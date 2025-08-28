import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from "../server/storage.js";
import { getCurrentUserId } from "../server/auth.js";
import { insertNoteTemplateSchema } from "../shared/schema.js";

// Also handle DATABASE_URL for compatibility
if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[NoteTemplates POST] Handler started');
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    console.log('[NoteTemplates POST] Getting user ID...');
    
    // For now, use a mock user ID in production
    const userId = "123e4567-e89b-12d3-a456-426614174000";
    console.log('[NoteTemplates POST] User ID:', userId);
    
    // Ensure user exists
    let user = await storage.getUser(userId);
    if (!user) {
      console.log('[NoteTemplates POST] Creating user...');
      user = await storage.createUser({
        id: userId,
        email: "doctor@hospital.com",
        firstName: "Dr. Sarah",
        lastName: "Mitchell",
        specialty: "Emergency Medicine",
      });
    }
    
    console.log('[NoteTemplates POST] Parsing template data...');
    const templateData = insertNoteTemplateSchema.parse({ ...req.body, userId });
    
    console.log('[NoteTemplates POST] Creating template...');
    const template = await storage.createNoteTemplate(templateData);
    
    console.log('[NoteTemplates POST] Template created successfully:', template.id);
    return res.status(200).json(template);
    
  } catch (error) {
    console.error('[NoteTemplates POST] Error:', error);
    
    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      const validationErrors = (error as any).issues.map((issue: any) => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      return res.status(400).json({ 
        message: "Validation failed", 
        error: `Invalid template data: ${validationErrors}` 
      });
    }
    
    return res.status(500).json({ 
      message: "Failed to create note template", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}