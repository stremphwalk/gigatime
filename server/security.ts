import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import type { Express } from 'express';

/**
 * Configure CORS settings for the application
 */
export function configureCors() {
  const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // Allow requests with no origin (like mobile apps or curl requests) in development
      if (!origin && process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // Parse allowed origins from environment variable
      const allowedOrigins = process.env.CORS_ORIGIN 
        ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
        : [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5000',
            'http://localhost:5001',
            'http://localhost:5002',
            'https://gigatime.vercel.app'
          ];

      // Allow if origin is in the allowed list
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS: Blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies and credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cookie'
    ],
    maxAge: 86400 // Cache preflight response for 24 hours
  };

  return cors(corsOptions);
}

/**
 * Configure rate limiting for API endpoints
 */
export function configureRateLimit() {
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes default

  return rateLimit({
    windowMs, // Time window in milliseconds
    max: maxRequests, // Maximum number of requests per window
    message: {
      error: 'Too many requests from this IP, please try again later.',
      resetTime: new Date(Date.now() + windowMs).toISOString()
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip successful responses that are cached
    skip: (req, res) => {
      return res.getHeader('Cache-Control') === 'public' && res.statusCode < 400;
    },
    // More lenient rate limiting in development
    ...(process.env.NODE_ENV === 'development' && {
      max: maxRequests * 5, // 5x more requests in development
      message: {
        error: 'Rate limit exceeded (development mode)',
        resetTime: new Date(Date.now() + windowMs).toISOString()
      }
    })
  });
}

/**
 * Configure Helmet for security headers
 */
export function configureHelmet() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return helmet({
    contentSecurityPolicy: isDevelopment ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://replit.com", "wss:", "ws:"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://api.openai.com", "https://api.deepgram.com", "wss:", "ws:", "http:", "https:"],
        manifestSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"]
      },
    } : {
      // Production CSP - more restrictive
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.openai.com", "https://api.deepgram.com"],
      },
    },
    hsts: process.env.NODE_ENV === 'production' ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    } : false, // Disable HSTS in development
    noSniff: true,
    frameguard: isDevelopment ? false : { action: 'deny' }, // More lenient in development
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  });
}

/**
 * Apply all security middleware to Express app
 */
export function applySecurity(app: Express) {
  // Apply Helmet first for security headers
  app.use(configureHelmet());
  
  // Apply CORS configuration
  app.use(configureCors());
  
  // Apply rate limiting to API routes only
  app.use('/api/', configureRateLimit());
  
  // Disable X-Powered-By header
  app.disable('x-powered-by');
  
  console.log('🔒 Security middleware configured');
  console.log(`   - CORS enabled for origins: ${process.env.CORS_ORIGIN || 'default development origins'}`);
  console.log(`   - Rate limiting: ${process.env.RATE_LIMIT_MAX_REQUESTS || '100'} requests per ${parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10) / 60000} minutes`);
  console.log(`   - Security headers enabled via Helmet`);
}

/**
 * Apply minimal security middleware for development servers
 */
export function applyDevelopmentSecurity(app: Express) {
  // Very lenient CORS for development
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Disable CSP entirely in development to avoid Vite conflicts
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('Content-Security-Policy-Report-Only');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  
  // Minimal Helmet config for development - no CSP
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP completely
    hsts: false,
    frameguard: false,
    crossOriginEmbedderPolicy: false
  }));
  
  // Very lenient rate limiting for development
  app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Very high limit for development
    message: { error: 'Rate limit exceeded in development mode' },
    standardHeaders: false,
    legacyHeaders: false
  }));
  
  // Disable X-Powered-By header
  app.disable('x-powered-by');
  
  console.log('🔓 Development security applied (CSP disabled for Vite compatibility)');
}

/**
 * Enhanced rate limiting for authentication endpoints
 */
export function configureAuthRateLimit() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 50 : 5, // More restrictive for auth
    message: {
      error: 'Too many authentication attempts, please try again later.',
      resetTime: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Don't count successful requests
  });
}
