import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('[Test] Ultra minimal test endpoint called');
    console.log('[Test] Method:', req.method);
    console.log('[Test] URL:', req.url);
    console.log('[Test] Node version:', process.version);
    console.log('[Test] Environment:', process.env.NODE_ENV);
    
    res.status(200).json({
      status: 'success',
      message: 'Ultra minimal test endpoint working',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('[Test] Error in minimal test endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error in minimal test endpoint',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}