import express from "express";
import { createServer } from "http";
import session from "express-session";
import { setupVite } from './vite.ts';

// Vite setup will be attached via setupVite

const app = express();
app.use(express.json());

// Development session for auth bypass
app.use(session({
  secret: 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

// Mock user for development
const DEV_USER = {
  id: "dev-user-123",
  email: "dev@test.com",
  firstName: "Dev",
  lastName: "User",
  role: "doctor"
};

// In-memory storage for testing
const mockStorage = {
  notes: [] as any[],
  smartPhrases: [
    {
      id: "1",
      trigger: "chest-pain",
      content: "Patient presents with chest pain described as {severity} and {quality}, occurring {frequency}.",
      description: "Standard chest pain assessment",
      elements: [
        {
          type: "multipicker",
          label: "Severity",
          options: ["mild", "moderate", "severe", "crushing"]
        },
        {
          type: "multipicker", 
          label: "Quality",
          options: ["sharp", "dull", "burning", "pressure-like", "stabbing"]
        },
        {
          type: "multipicker",
          label: "Frequency", 
          options: ["constant", "intermittent", "with exertion", "at rest"]
        }
      ],
      userId: DEV_USER.id,
      createdAt: new Date()
    },
    {
      id: "2",
      trigger: "headache",
      content: "Patient reports headache that is {severity} in intensity, {location}, and {quality} in nature.",
      description: "Headache assessment template",
      elements: [
        {
          type: "multipicker",
          label: "Severity",
          options: ["mild", "moderate", "severe", "debilitating"]
        },
        {
          type: "multipicker",
          label: "Location", 
          options: ["frontal", "temporal", "occipital", "bilateral", "unilateral"]
        },
        {
          type: "multipicker",
          label: "Quality",
          options: ["throbbing", "sharp", "dull", "pressure-like", "stabbing"]
        }
      ],
      userId: DEV_USER.id,
      createdAt: new Date()
    },
    {
      id: "3",
      trigger: "abdominal-pain",
      content: "Patient presents with abdominal pain in the {location} region, {severity} in intensity, {quality} in nature, {duration} in duration.",
      description: "Abdominal pain assessment",
      elements: [
        {
          type: "multipicker",
          label: "Location",
          options: ["right upper quadrant", "left upper quadrant", "right lower quadrant", "left lower quadrant", "epigastric", "periumbilical", "suprapubic"]
        },
        {
          type: "multipicker",
          label: "Severity",
          options: ["mild", "moderate", "severe", "excruciating"]
        },
        {
          type: "multipicker",
          label: "Quality", 
          options: ["cramping", "sharp", "dull", "burning", "colicky", "constant"]
        },
        {
          type: "multipicker",
          label: "Duration",
          options: ["acute", "chronic", "hours", "days", "weeks", "months"]
        }
      ],
      userId: DEV_USER.id,
      createdAt: new Date()
    }
  ] as any[],
  templates: [] as any[]
};

// Middleware to inject dev user
app.use((req: any, res, next) => {
  req.user = {
    claims: {
      sub: DEV_USER.id,
      email: DEV_USER.email,
      first_name: DEV_USER.firstName,
      last_name: DEV_USER.lastName
    }
  };
  next();
});

// Auth routes
app.get('/api/auth/user', async (req: any, res) => {
  res.json({ user: DEV_USER, isAuthenticated: true });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// Notes API
app.get('/api/notes', async (req: any, res) => {
  res.json(mockStorage.notes);
});

app.post('/api/notes', async (req: any, res) => {
  const note = {
    id: String(Date.now()),
    ...req.body,
    userId: DEV_USER.id,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  mockStorage.notes.push(note);
  res.json(note);
});

app.put('/api/notes/:id', async (req: any, res) => {
  const index = mockStorage.notes.findIndex(n => n.id === req.params.id);
  if (index >= 0) {
    mockStorage.notes[index] = {
      ...mockStorage.notes[index],
      ...req.body,
      updatedAt: new Date()
    };
    res.json(mockStorage.notes[index]);
  } else {
    res.status(404).json({ error: 'Note not found' });
  }
});

app.delete('/api/notes/:id', async (req: any, res) => {
  const index = mockStorage.notes.findIndex(n => n.id === req.params.id);
  if (index >= 0) {
    mockStorage.notes.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Note not found' });
  }
});

// Note Templates API
app.get('/api/note-templates', async (req: any, res) => {
  res.json(mockStorage.templates);
});

app.post('/api/note-templates', async (req: any, res) => {
  const template = {
    id: String(Date.now()),
    ...req.body,
    userId: DEV_USER.id,
    createdAt: new Date()
  };
  mockStorage.templates.push(template);
  res.json(template);
});

// Smart Phrases API
app.get('/api/smart-phrases', async (req: any, res) => {
  res.json(mockStorage.smartPhrases);
});

app.post('/api/smart-phrases', async (req: any, res) => {
  const phrase = {
    id: String(Date.now()),
    ...req.body,
    userId: DEV_USER.id,
    createdAt: new Date()
  };
  mockStorage.smartPhrases.push(phrase);
  res.json(phrase);
});

app.put('/api/smart-phrases/:id', async (req: any, res) => {
  const index = mockStorage.smartPhrases.findIndex(p => p.id === req.params.id);
  if (index >= 0) {
    mockStorage.smartPhrases[index] = {
      ...mockStorage.smartPhrases[index],
      ...req.body,
      updatedAt: new Date()
    };
    res.json(mockStorage.smartPhrases[index]);
  } else {
    res.status(404).json({ error: 'Smart phrase not found' });
  }
});

app.delete('/api/smart-phrases/:id', async (req: any, res) => {
  const index = mockStorage.smartPhrases.findIndex(p => p.id === req.params.id);
  if (index >= 0) {
    mockStorage.smartPhrases.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Smart phrase not found' });
  }
});

// Autocomplete APIs (mock responses)
app.get('/api/autocomplete/:category', async (req: any, res) => {
  res.json([]);
});

app.post('/api/autocomplete/:category', async (req: any, res) => {
  res.json({ id: String(Date.now()), ...req.body });
});

app.post('/api/autocomplete/init-tables', async (req: any, res) => {
  res.json({ success: true, message: "Mock tables initialized" });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Test server is running', 
    user: DEV_USER,
    smartPhrasesCount: mockStorage.smartPhrases.length 
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', mode: 'test' });
});

async function createTestServer() {
  const PORT = process.env.DEV_PORT || 5002;
  const server = createServer(app);

  // Attach Vite middleware using shared helper
  await setupVite(app as any, server as any);

  server.listen(PORT, () => {
    console.log(`🚀 Test server running on http://localhost:${PORT}`);
    console.log(`📝 Using mock user: ${DEV_USER.email}`);
    console.log(`🔓 Authentication bypassed for testing`);
    console.log(`⚡ Vite HMR enabled`);
    console.log(`💾 Using in-memory storage (${mockStorage.smartPhrases.length} smart phrases loaded)`);
  });

  return server;
}

createTestServer().catch(console.error);