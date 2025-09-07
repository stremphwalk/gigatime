/// <reference types="vitest" />
import { describe, it, expect } from 'vitest'
import { normalizeKey, canonicalizeLab, canonicalizeVital, canonicalizeImagingType } from './canonical'

describe('normalizeKey', () => {
  it('lowercases, collapses whitespace, keeps plus sign', () => {
    expect(normalizeKey('  Na+  ')).toBe('na+')
    expect(normalizeKey('White   blood   cells')).toBe('white blood cells')
  })

  it('removes punctuation except + and collapses to single spaces', () => {
    expect(normalizeKey('white-blood, cells!!')).toBe('white blood cells')
    expect(normalizeKey('K+ / K')).toBe('k+ k')
  })
})

describe('canonicalizeLab', () => {
  it('maps common synonyms and case-insensitive inputs', () => {
    expect(canonicalizeLab('  wBc  ')).toBe('WBC')
    expect(canonicalizeLab('Platelets')).toBe('Platelets')
    expect(canonicalizeLab('Cr')).toBe('Creatinine')
    expect(canonicalizeLab('Na+')).toBe('Sodium')
  })

  it('passes through unknown values unchanged', () => {
    expect(canonicalizeLab('Unrecognized Panel XYZ')).toBe('Unrecognized Panel XYZ')
  })
})

describe('canonicalizeVital', () => {
  it('maps vital synonyms', () => {
    expect(canonicalizeVital('pulse')).toBe('Heart Rate')
    expect(canonicalizeVital('BP')).toBe('Blood Pressure')
    expect(canonicalizeVital('TEMP')).toBe('Temperature')
  })
})

describe('canonicalizeImagingType', () => {
  it('maps imaging synonyms', () => {
    expect(canonicalizeImagingType('CXR')).toBe('Chest X-ray')
    expect(canonicalizeImagingType('ct scan')).toBe('CT')
    expect(canonicalizeImagingType('Ultrasound')).toBe('Ultrasound')
  })
})

