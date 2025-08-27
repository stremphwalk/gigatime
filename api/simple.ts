import type { VercelRequest, VercelResponse } from '@vercel/node';

// Ultra-simple API handler with no external dependencies
export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[Simple] Starting simple API handler');
  console.log('[Simple] Method:', req.method, 'URL:', req.url);
  
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Route handling
    const { url, method } = req;
    
    if (url === '/api/simple' && method === 'GET') {
      return res.status(200).json({
        status: 'success',
        message: 'Simple API handler working',
        timestamp: new Date().toISOString(),
        method,
        url
      });
    }
    
    if (url === '/api/note-templates' && method === 'POST') {
      console.log('[Simple] Handling POST /api/note-templates');
      console.log('[Simple] Request body:', req.body);
      
      // Mock response for testing
      return res.status(200).json({
        id: 'test-template-id',
        name: req.body?.name || 'Test Template',
        type: req.body?.type || 'progress',
        sections: req.body?.sections || [],
        createdAt: new Date().toISOString(),
        isDefault: false,
        isPublic: false,
        userId: 'mock-user-id'
      });
    }
    
    if (url === '/api/note-templates' && method === 'GET') {
      console.log('[Simple] Handling GET /api/note-templates');
      
      // Mock templates response
      return res.status(200).json([
        {
          id: 'mock-template-1',
          name: 'Progress Note',
          type: 'progress',
          sections: [
            { id: 'subjective', title: 'Subjective', content: '', required: true },
            { id: 'objective', title: 'Objective', content: '', required: true },
            { id: 'assessment', title: 'Assessment', content: '', required: true },
            { id: 'plan', title: 'Plan', content: '', required: true }
          ],
          createdAt: new Date().toISOString(),
          isDefault: true,
          isPublic: false,
          userId: null
        }
      ]);
    }
    
    // Default 404 response
    return res.status(404).json({
      status: 'error',
      message: 'Endpoint not found',
      url,
      method
    });
    
  } catch (error) {
    console.error('[Simple] Error in simple handler:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}