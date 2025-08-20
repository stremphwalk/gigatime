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

  // Verify state parameter from cookie
  const cookies = req.headers.cookie;
  const stateCookie = cookies?.split(';').find(c => c.trim().startsWith('auth0_state='));
  const expectedState = stateCookie?.split('=')[1];

  if (!expectedState || expectedState !== state) {
    console.error('State mismatch:', { expected: expectedState, received: state });
    return res.status(400).json({ error: 'State parameter mismatch' });
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

    // Clear state cookie and set user cookie
    res.setHeader('Set-Cookie', [
      'auth0_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0', // Clear state cookie
      `auth0_user=${userCookie}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800` // 7 days
    ]);

    // Redirect to home page
    res.redirect('/');

  } catch (error) {
    console.error('Auth0 callback error:', error);
    res.status(500).json({ error: 'Internal server error', details: error });
  }
}