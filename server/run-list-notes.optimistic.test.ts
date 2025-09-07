/// <reference types="vitest" />
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'

// Ensure DB module doesn't throw on import; we will stub storage.db later
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/postgres'
process.env.NODE_ENV = 'development'

// We'll import and mutate the singleton storage during setup (after env is set)
let storageRef: any

// Local test state to simulate DB rows
const TEST_USER_ID = 'test-user-123'
const LIST_PATIENT_ID = 'lp-1'
const NOTE_ID = 'note-1'

let currentUpdatedAt = new Date('2025-01-01T00:00:00.000Z')

// Minimal fake DB implementing just what the route uses
function makeFakeDb() {
  return {
    // ensureCoreSchema uses execute heavily; make it a no-op
    async execute(_sql?: string) { /* noop */ },

    // Select builder used for the join of rl, patient, note
    select() {
      const builder: any = {
        from() { return builder },
        leftJoin() { return builder },
        innerJoin() { return builder },
        where() {
          // Return a single joined row owned by the test user
          return Promise.resolve([
            {
              rl: { id: 'rl-1', userId: TEST_USER_ID },
              p: { id: LIST_PATIENT_ID, runListId: 'rl-1' },
              n: {
                id: NOTE_ID,
                listPatientId: LIST_PATIENT_ID,
                rawText: 'initial',
                structuredSections: {},
                status: 'draft',
                updatedAt: currentUpdatedAt,
                expiresAt: new Date(Date.now() + 3600_000),
              },
            },
          ])
        },
      }
      return builder
    },

    // Update builder for run_list_notes
    update(_table?: any) {
      const updateCtx: any = { payload: null }
      const builder: any = {
        set(payload: any) {
          updateCtx.payload = payload
          return builder
        },
        where() { return builder },
        returning() {
          // Reflect the update into the note and return it
          currentUpdatedAt = updateCtx.payload?.updatedAt || new Date()
          return Promise.resolve([
            {
              id: NOTE_ID,
              listPatientId: LIST_PATIENT_ID,
              rawText: updateCtx.payload?.rawText ?? 'initial',
              structuredSections: updateCtx.payload?.structuredSections ?? {},
              status: updateCtx.payload?.status ?? 'draft',
              updatedAt: currentUpdatedAt,
              expiresAt: updateCtx.payload?.expiresAt ?? new Date(Date.now() + 3600_000),
            },
          ])
        },
      }
      return builder
    },

    // Insert builder used for note versions (we can ignore the result)
    insert(_table?: any) {
      const builder: any = {
        values() {
          return Promise.resolve()
        },
        returning() {
          // For completeness if called elsewhere
          return Promise.resolve([{ id: 'dummy' }])
        },
      }
      return builder
    },
  }
}

// Prepare the server with our fake storage/db and controlled auth
let server: any
beforeAll(async () => {
  // Bypass auth in middleware and set a known user id before routes
  const app = express()
  app.use(express.json())
  app.use((req: any, _res, next) => {
    req.user = { claims: { sub: TEST_USER_ID } }
    req.session = {}
    next()
  })

  // Import storage after env vars are set
  const storageModule = await import('./storage')
  storageRef = (storageModule as any).storage

  // Inject fake db and no-op schema into storage singleton
  storageRef.db = makeFakeDb()
  storageRef.ensureCoreSchema = async () => {}
  storageRef.purgeExpiredNotes = async () => 0

  // Register full routes (uses our injected storage)
  const { registerRoutes } = await import('./routes')
  server = await registerRoutes(app)
})

afterAll(async () => {
  if (server && typeof server.close === 'function') await new Promise((r) => server.close(r))
})

describe('Run list notes optimistic locking', () => {
  it('updates when expectedUpdatedAt matches', async () => {
    const res = await request(server)
      .put(`/api/run-list/notes/${LIST_PATIENT_ID}`)
      .send({ rawText: 'first update', expectedUpdatedAt: currentUpdatedAt.toISOString() })
      .set('Accept', 'application/json')

    expect(res.status).toBe(200)
    expect(res.body?.note?.rawText).toBe('first update')
    expect(new Date(res.body?.note?.updatedAt).getTime()).toBeGreaterThan(new Date('2025-01-01T00:00:00.000Z').getTime())
  })

  it('returns 409 when expectedUpdatedAt is stale', async () => {
    // Now currentUpdatedAt has moved forward from the previous test
    const stale = new Date('2025-01-01T00:00:00.000Z')
    const res = await request(server)
      .put(`/api/run-list/notes/${LIST_PATIENT_ID}`)
      .send({ rawText: 'conflicting update', expectedUpdatedAt: stale.toISOString() })
      .set('Accept', 'application/json')

    expect(res.status).toBe(409)
    expect(res.body?.message || '').toMatch(/Conflict/i)
  })
})

