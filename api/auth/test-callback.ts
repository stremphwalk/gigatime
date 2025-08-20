import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query;

  console.log('Test Auth0 Callback received:', {
    code: code ? 'RECEIVED' : 'NOT RECEIVED',
    state,
    error,
    query: req.query
  });

  if (error) {
    return res.status(400).json({ 
      error: 'Auth0 callback error', 
      details: error,
      description: req.query.error_description 
    });
  }

  if (!code) {
    return res.status(400).json({ error: 'No authorization code received' });
  }

  // Skip state verification for testing - just proceed with token exchange
  console.log('Skipping state verification for testing purposes');

  try {
    // Exchange code for tokens
    const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;
    const baseUrl = process.env.AUTH0_BASE_URL || 'https://gigatime.vercel.app';
    const redirectUri = `${baseUrl}/api/auth/test-callback`;

    console.log('Exchanging code for tokens:', {
      auth0Domain,
      clientId: clientId ? 'SET' : 'NOT SET',
      clientSecret: clientSecret ? 'SET' : 'NOT SET',
      redirectUri
    });

    const tokenResponse = await fetch(`${auth0Domain}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return res.status(400).json({ 
        error: 'Token exchange failed', 
        details: errorData 
      });
    }

    const tokens = await tokenResponse.json();
    console.log('Token exchange successful:', {
      access_token: tokens.access_token ? 'RECEIVED' : 'NOT RECEIVED',
      id_token: tokens.id_token ? 'RECEIVED' : 'NOT RECEIVED'
    });
    
    // Get user info
    const userResponse = await fetch(`${auth0Domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      console.error('User info fetch failed:', errorData);
      return res.status(400).json({ 
        error: 'User info fetch failed', 
        details: errorData 
      });
    }

    const user = await userResponse.json();
    
    console.log('Auth0 Test Success:', {
      user: { sub: user.sub, email: user.email, name: user.name }
    });

    // Return success page instead of redirect for testing
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Auth0 Test Success</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>✅ Auth0 Test Successful!</h1>
          <h2>User Info:</h2>
          <ul>
            <li><strong>ID:</strong> ${user.sub}</li>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Name:</strong> ${user.name}</li>
          </ul>
          <h2>Tokens:</h2>
          <ul>
            <li><strong>Access Token:</strong> ${tokens.access_token ? 'Received' : 'Not received'}</li>
            <li><strong>ID Token:</strong> ${tokens.id_token ? 'Received' : 'Not received'}</li>
          </ul>
          <p><a href="/">← Back to home</a></p>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Auth0 test callback error:', error);
    res.status(500).json({ error: 'Internal server error', details: error });
  }
}