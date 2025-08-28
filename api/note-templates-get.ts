import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from "../server/storage.js";

// Also handle DATABASE_URL for compatibility
if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[NoteTemplates GET] Handler started');
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    console.log('[NoteTemplates GET] Fetching templates...');
    
    // For now, use a mock user ID in production
    const userId = "123e4567-e89b-12d3-a456-426614174000";
    
    // Initialize default templates if needed
    const existingTemplates = await storage.getNoteTemplates();
    const existingDefaultTemplates = existingTemplates.filter(t => t.isDefault);
    
    if (existingDefaultTemplates.length === 0) {
      console.log('[NoteTemplates GET] Creating default templates...');
      const defaultTemplateData = [
        {
          name: "Progress Note",
          type: "progress",
          isDefault: true,
          userId: null,
          sections: [
            { id: "subjective", title: "Subjective", content: "", required: true },
            { id: "objective", title: "Objective", content: "", required: true },
            { id: "assessment", title: "Assessment", content: "", required: true },
            { id: "plan", title: "Plan", content: "", required: true }
          ]
        }
      ];

      for (const template of defaultTemplateData) {
        await storage.createNoteTemplate(template);
      }
    }
    
    const templates = await storage.getNoteTemplates(userId);
    console.log('[NoteTemplates GET] Found', templates.length, 'templates');
    
    return res.status(200).json(templates);
    
  } catch (error) {
    console.error('[NoteTemplates GET] Error:', error);
    return res.status(500).json({ 
      message: "Failed to fetch note templates", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}