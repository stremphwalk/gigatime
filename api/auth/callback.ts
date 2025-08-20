import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query;

  console.log('Auth0 Callback received:', {
    code: code ? 'RECEIVED' : 'NOT RECEIVED',
    state,
    error,
    cookies: req.headers.cookie
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

  // Verify HMAC-signed state parameter (no cookies needed!)
  if (!state || typeof state !== 'string') {
    return res.status(400).json({ error: 'Invalid state parameter' });
  }

  try {
    const secret = process.env.AUTH0_SECRET || 'fallback-secret';
    
    // Decode the base64url state
    const stateBuffer = Buffer.from(state as string, 'base64url');
    const stateString = stateBuffer.toString();
    
    // Split state data and signature
    const [stateData, expectedSignature] = stateString.split('.');
    if (!stateData || !expectedSignature) {
      throw new Error('Invalid state format');
    }
    
    // Verify HMAC signature
    const { createHmac } = await import('crypto');
    const hmac = createHmac('sha256', secret);
    hmac.update(stateData);
    const actualSignature = hmac.digest('hex');
    
    if (actualSignature !== expectedSignature) {
      throw new Error('Invalid state signature');
    }
    
    // Parse timestamp and check if state is still valid (10 minutes max)
    const [timestamp, nonce] = stateData.split('-');
    const stateAge = Date.now() - parseInt(timestamp);
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    if (stateAge > maxAge) {
      throw new Error('State has expired');
    }
    
    console.log('State verification successful:', {
      timestamp,
      nonce: nonce?.substring(0, 8) + '...',
      age: Math.round(stateAge / 1000) + 's'
    });
    
  } catch (error) {
    console.error('State verification failed:', error);
    return res.status(400).json({ 
      error: 'Invalid or expired state parameter',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  try {
    // Exchange code for tokens
    const auth0Domain = process.env.AUTH0_ISSUER_BASE_URL;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;
    const baseUrl = process.env.AUTH0_BASE_URL || 'https://gigatime.vercel.app';
    const redirectUri = `${baseUrl}/api/auth/callback`;

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
    
    console.log('Auth0 Success:', {
      user: { sub: user.sub, email: user.email, name: user.name },
      tokens: { access_token: 'RECEIVED', id_token: tokens.id_token ? 'RECEIVED' : 'NOT RECEIVED' }
    });

    // Set auth cookie with user info (in production, use JWT or secure session)
    const userCookie = Buffer.from(JSON.stringify({
      sub: user.sub,
      email: user.email,
      name: user.name,
      picture: user.picture
    })).toString('base64');

    // Set user cookie (no state cookie to clear since we don't use cookies for state)
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = isProduction 
      ? 'HttpOnly; Secure; SameSite=Lax; Path=/'
      : 'HttpOnly; SameSite=Lax; Path=/';
      
    res.setHeader('Set-Cookie', `auth0_user=${userCookie}; ${cookieOptions}; Max-Age=604800`); // 7 days

    // Redirect to home page
    res.redirect('/');

  } catch (error) {
    console.error('Auth0 callback error:', error);
    res.status(500).json({ error: 'Internal server error', details: error });
  }
}