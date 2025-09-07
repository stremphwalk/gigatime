import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage.ts";
import { setupVite, serveStatic, log } from "./vite.ts";

// Simple development configuration
const DEV_USER_ID = `dev-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const DEV_USER = {
  id: DEV_USER_ID,
  email: process.env.DEV_USER_EMAIL || "test@gigatime.dev",
  firstName: process.env.DEV_USER_FIRST_NAME || "Test",
  lastName: process.env.DEV_USER_LAST_NAME || "User",
  specialty: process.env.DEV_USER_SPECIALTY || "General Practice"
};

const app = express();

// Disable all security for maximum compatibility
app.disable('x-powered-by');
app.disable('etag');

// Ultra-permissive CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Simple session
app.use(session({
  secret: 'simple-dev-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, 
    httpOnly: false, // Allow client-side access for debugging
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

// Auto-authentication middleware
app.use((req: any, res, next) => {
  req.user = {
    claims: {
      sub: DEV_USER.id,
      email: DEV_USER.email,
      first_name: DEV_USER.firstName,
      last_name: DEV_USER.lastName
    }
  };
  
  if (req.session) {
    req.session.devUserId = DEV_USER.id;
    req.session.authenticated = true;
  }
  
  next();
});

// Simple request logging
app.use((req, res, next) => {
  if (req.path.startsWith('/api') && !req.path.includes('/auth/user')) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      log(`${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
    });
  }
  next();
});

// Auto-create user helper
const ensureUser = async () => {
  try {
    let user = await storage.getUser(DEV_USER.id);
    if (!user) {
      user = await storage.createUser(DEV_USER);
      log(`✅ Created dev user: ${DEV_USER.firstName} ${DEV_USER.lastName}`);
    }
    return user;
  } catch (error) {
    log(`⚠️ User creation failed: ${error}`);
    return null;
  }
};

// === AUTH ENDPOINTS ===
app.get('/api/auth/user', async (req, res) => {
  try {
    const user = await ensureUser();
    res.json(user || DEV_USER);
  } catch (error) {
    console.error("Auth user error:", error);
    res.json(DEV_USER); // Always return a user
  }
});

app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Already logged in', user: DEV_USER });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout ignored in dev mode', user: DEV_USER });
});

app.get('/api/auth/callback', (req, res) => {
  res.redirect('/');
});

// === CORE API ENDPOINTS ===
app.get('/api/notes', async (req, res) => {
  try {
    await ensureUser();
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const notes = await storage.getNotes(DEV_USER.id, limit);
    res.json(notes);
  } catch (error) {
    console.error("Notes error:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

app.get('/api/note-templates', async (req, res) => {
  try {
    await ensureUser();
    const templates = await storage.getNoteTemplates(DEV_USER.id);
    res.json(templates);
  } catch (error) {
    console.error("Templates error:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

app.get('/api/smart-phrases', async (req, res) => {
  try {
    await ensureUser();
    const query = req.query.q as string;
    let phrases;
    if (query) {
      phrases = await storage.searchSmartPhrases(DEV_USER.id, query);
    } else {
      phrases = await storage.getSmartPhrases(DEV_USER.id);
    }
    res.json(phrases || []);
  } catch (error) {
    console.error("Smart phrases error:", error);
    res.status(500).json({ error: "Failed to fetch smart phrases" });
  }
});

// === SONIOX API ENDPOINT ===
app.get('/api/soniox-key', (req, res) => {
  const apiKey = process.env.SONIOX_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ SONIOX_API_KEY not configured');
    return res.status(500).json({ message: "Soniox API key not configured" });
  }
  res.json({ apiKey });
});

// === DEVELOPMENT ENDPOINTS ===
app.get('/api/dev/info', (req, res) => {
  res.json({
    message: "Simple development server running",
    user: DEV_USER,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: "healthy",
    server: "simple-dev",
    user: `${DEV_USER.firstName} ${DEV_USER.lastName}`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const server = createServer(app);

(async () => {
  try {
    // Initialize database
    await storage.ensureCoreSchema();
    log(`✅ Database initialized`);
    
    // Setup Vite with graceful fallback
    try {
      await setupVite(app, server);
      log(`✅ Vite development server setup complete`);
    } catch (viteError) {
      log(`⚠️ Vite setup failed, trying static files...`);
      try {
        serveStatic(app);
        log(`✅ Static file serving enabled`);
      } catch (staticError) {
        log(`ℹ️ No static files available. Run 'npm run build' first.`);
        // Fallback HTML for when nothing else works
        app.get('*', (req, res) => {
          if (!req.path.startsWith('/api')) {
            res.send(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Gigatime Dev Server</title>
                  <style>
                    body { font-family: system-ui; margin: 40px; }
                    .status { background: #f0f9ff; padding: 20px; border-radius: 8px; }
                  </style>
                </head>
                <body>
                  <div class="status">
                    <h1>🚀 Gigatime Development Server</h1>
                    <p>Server is running but frontend build not available.</p>
                    <p>API endpoints are working: <a href="/api/health">Health Check</a></p>
                    <p>To enable the frontend, run: <code>npm run build</code></p>
                  </div>
                </body>
              </html>
            `);
          } else {
            res.status(404).json({ error: 'API endpoint not found' });
          }
        });
      }
    }

    // Find available port
    const port = parseInt(process.env.PORT || '5001', 10);
    
    server.listen(port, '0.0.0.0', async () => {
      console.log('\n' + '='.repeat(50));
      log(`🚀 SIMPLE DEV SERVER running on http://localhost:${port}`);
      log(`📝 No authentication required`);
      log(`👤 Test User: ${DEV_USER.firstName} ${DEV_USER.lastName}`);
      log(`📧 Email: ${DEV_USER.email}`);
      console.log('='.repeat(50));
      log(`🌐 Frontend: http://localhost:${port}`);
      log(`🔍 Health: http://localhost:${port}/api/health`);
      log(`ℹ️ Info: http://localhost:${port}/api/dev/info`);
      console.log('='.repeat(50));
      log(`💡 Ultra-simple server with no security restrictions`);
      log(`⚡ Maximum Vite compatibility`);
      log(`🎯 Perfect for troubleshooting`);
      console.log('='.repeat(50) + '\n');
      
      // Initialize user
      try {
        await ensureUser();
      } catch (error) {
        log(`⚠️ User initialization warning: ${error}`);
      }
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
})();
