import type { VercelRequest, VercelResponse } from '@vercel/node';
import getHandler from './note-templates-get.js';
import postHandler from './note-templates-post.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[NoteTemplates Handler] Method:', req.method);
  
  if (req.method === 'GET') {
    return getHandler(req, res);
  } else if (req.method === 'POST') {
    return postHandler(req, res);
  } else if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}