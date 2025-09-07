import express from "express";
import { createServer } from "http";
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// Mock user for development
const DEV_USER = {
  id: "dev-user-123",
  email: "dev@test.com",
  firstName: "Dev",
  lastName: "User",
  role: "doctor"
};

// Autocomplete type definition
type AutocompleteItem = {
  id: string;
  text: string;
  category: string;
  isPriority: boolean;
  dosage?: string;
  frequency?: string;
  dosageOptions?: string[];
  frequencyOptions?: string[];
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

// In-memory storage for testing
const mockStorage: {
  notes: any[];
  smartPhrases: any[];
  templates: any[];
  autocompleteItems?: AutocompleteItem[];
} = {
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

// Auth routes (return a user object like the main server)
app.get('/api/auth/user', (req, res) => {
  res.json(DEV_USER);
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// Notes API
app.get('/api/notes', (req, res) => {
  res.json(mockStorage.notes);
});

app.post('/api/notes', (req, res) => {
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

app.put('/api/notes/:id', (req, res) => {
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

app.delete('/api/notes/:id', (req, res) => {
  const index = mockStorage.notes.findIndex(n => n.id === req.params.id);
  if (index >= 0) {
    mockStorage.notes.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Note not found' });
  }
});

// Note Templates API
app.get('/api/note-templates', (req, res) => {
  res.json(mockStorage.templates);
});

app.post('/api/note-templates', (req, res) => {
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
app.get('/api/smart-phrases', (req, res) => {
  res.json(mockStorage.smartPhrases);
});

app.post('/api/smart-phrases', (req, res) => {
  const phrase = {
    id: String(Date.now()),
    ...req.body,
    userId: DEV_USER.id,
    createdAt: new Date()
  };
  mockStorage.smartPhrases.push(phrase);
  res.json(phrase);
});

app.put('/api/smart-phrases/:id', (req, res) => {
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

app.delete('/api/smart-phrases/:id', (req, res) => {
  const index = mockStorage.smartPhrases.findIndex(p => p.id === req.params.id);
  if (index >= 0) {
    mockStorage.smartPhrases.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Smart phrase not found' });
  }
});

// Autocomplete APIs (mock responses)

mockStorage.autocompleteItems = [];

// New endpoints matching client expectations
app.get('/api/autocomplete-items', (req, res) => {
  const { category } = req.query as { category?: string };
  const items = (mockStorage.autocompleteItems as AutocompleteItem[])
    .filter(i => i.userId === DEV_USER.id && (!category || i.category === category))
    .sort((a, b) => Number(b.isPriority) - Number(a.isPriority) || a.category.localeCompare(b.category) || a.text.localeCompare(b.text));
  res.json(items);
});

app.post('/api/autocomplete-items', (req, res) => {
  const { text, category, isPriority = false, dosage, frequency, description, dosageOptions, frequencyOptions } = req.body || {};
  if (!text || !category) {
    return res.status(400).json({ message: 'Validation failed', error: 'text and category are required' });
  }
  const now = new Date().toISOString();
  const item: AutocompleteItem = {
    id: String(Date.now()),
    text: String(text),
    category: String(category),
    isPriority: Boolean(isPriority),
    dosage: dosage ? String(dosage) : undefined,
    frequency: frequency ? String(frequency) : undefined,
    dosageOptions: Array.isArray(dosageOptions) ? dosageOptions.map(String) : undefined,
    frequencyOptions: Array.isArray(frequencyOptions) ? frequencyOptions.map(String) : undefined,
    description: description ? String(description) : undefined,
    userId: DEV_USER.id,
    createdAt: now,
    updatedAt: now,
  };
  (mockStorage.autocompleteItems as AutocompleteItem[]).push(item);
  res.json(item);
});

app.put('/api/autocomplete-items/:id', (req, res) => {
  const { id } = req.params;
  const idx = (mockStorage.autocompleteItems as AutocompleteItem[]).findIndex(i => i.id === id && i.userId === DEV_USER.id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  const prev = (mockStorage.autocompleteItems as AutocompleteItem[])[idx];
  const updated: AutocompleteItem = {
    ...prev,
    ...req.body,
    text: req.body?.text ?? prev.text,
    category: req.body?.category ?? prev.category,
    isPriority: typeof req.body?.isPriority === 'boolean' ? req.body.isPriority : prev.isPriority,
    dosage: req.body?.dosage ?? prev.dosage,
    frequency: req.body?.frequency ?? prev.frequency,
    dosageOptions: Array.isArray(req.body?.dosageOptions) ? req.body.dosageOptions.map(String) : prev.dosageOptions,
    frequencyOptions: Array.isArray(req.body?.frequencyOptions) ? req.body.frequencyOptions.map(String) : prev.frequencyOptions,
    description: req.body?.description ?? prev.description,
    updatedAt: new Date().toISOString(),
  };
  (mockStorage.autocompleteItems as AutocompleteItem[])[idx] = updated;
  res.json(updated);
});

app.delete('/api/autocomplete-items/:id', (req, res) => {
  const { id } = req.params;
  const before = (mockStorage.autocompleteItems as AutocompleteItem[]).length;
  (mockStorage.autocompleteItems as AutocompleteItem[]) = (mockStorage.autocompleteItems as AutocompleteItem[]).filter(i => !(i.id === id && i.userId === DEV_USER.id));
  if ((mockStorage.autocompleteItems as AutocompleteItem[]).length === before) {
    return res.status(404).json({ message: 'Not found' });
  }
  res.json({ message: 'Autocomplete item deleted successfully' });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Simple test server is running', 
    user: DEV_USER,
    smartPhrasesCount: mockStorage.smartPhrases.length 
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', mode: 'simple-test' });
});

// Serve the app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = parseInt(process.env.DEV_PORT || '5003');
const server = createServer(app);

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Simple test server running on http://localhost:${PORT}`);
  console.log(`📝 Using mock user: ${DEV_USER.email}`);
  console.log(`🔓 Authentication bypassed for testing`);
  console.log(`💾 Using in-memory storage (${mockStorage.smartPhrases.length} smart phrases loaded)`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is busy, trying ${PORT + 1}...`);
    server.listen(PORT + 1, '127.0.0.1');
  } else {
    console.error('Server error:', err);
  }
});

export default server;
