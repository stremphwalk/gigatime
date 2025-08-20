import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Development bypass
    if (process.env.NODE_ENV === 'development') {
      const urlParams = new URLSearchParams(req.url?.split('?')[1] || '');
      const devBypass = urlParams.get('dev') === 'true';
      
      if (devBypass) {
        return res.json({
          id: "123e4567-e89b-12d3-a456-426614174000",
          email: "doctor@hospital.com",
          name: "Dr. Sarah Mitchell",
          firstName: "Dr. Sarah",
          lastName: "Mitchell",
          specialty: "Emergency Medicine"
        });
      }
    }

    // Check for auth cookie
    const cookies = req.headers.cookie;
    const userCookie = cookies?.split(';').find(c => c.trim().startsWith('auth0_user='));
    
    if (!userCookie) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Decode user info from cookie
    const userDataBase64 = userCookie.split('=')[1];
    const userDataJson = Buffer.from(userDataBase64, 'base64').toString('utf-8');
    const userData = JSON.parse(userDataJson);

    // Return user info
    res.json({
      id: userData.sub,
      email: userData.email,
      name: userData.name,
      firstName: userData.name?.split(' ')[0] || '',
      lastName: userData.name?.split(' ').slice(1).join(' ') || '',
      picture: userData.picture
    });

  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
}