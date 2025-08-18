# Auth0 Setup Guide

This guide will help you set up Auth0 authentication for the Gigatime application.

## Prerequisites

1. Create an Auth0 account at [https://auth0.com](https://auth0.com)
2. Create a new Application in your Auth0 dashboard

## Auth0 Application Setup

1. **Create Application**:
   - Go to Applications > Create Application
   - Choose "Single Page Application"
   - Give it a name (e.g., "Gigatime Medical App")

2. **Configure Application Settings**:
   - **Allowed Callback URLs**: 
     ```
     http://localhost:5001/api/auth/callback,
     http://localhost:5173,
     https://your-production-domain.com/api/auth/callback
     ```
   
   - **Allowed Logout URLs**:
     ```
     http://localhost:5001,
     http://localhost:5173,
     https://your-production-domain.com
     ```
   
   - **Allowed Web Origins**:
     ```
     http://localhost:5001,
     http://localhost:5173,
     https://your-production-domain.com
     ```
   
   - **Allowed Origins (CORS)**:
     ```
     http://localhost:5001,
     http://localhost:5173,
     https://your-production-domain.com
     ```

3. **Save the Settings**

## Environment Variables

Copy `.env.example` to `.env` and fill in your Auth0 credentials:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

### Server-side variables:
- `AUTH0_SECRET`: Generate a long random string (32+ characters)
- `AUTH0_BASE_URL`: Your app's base URL (e.g., http://localhost:5001)
- `AUTH0_CLIENT_ID`: Found in your Auth0 application settings
- `AUTH0_CLIENT_SECRET`: Found in your Auth0 application settings
- `AUTH0_ISSUER_BASE_URL`: Your Auth0 domain (e.g., https://your-domain.auth0.com)
- `AUTH0_AUDIENCE`: Your API identifier (optional, for API authorization)

### Client-side variables:
- `VITE_AUTH0_DOMAIN`: Your Auth0 domain (e.g., your-domain.auth0.com)
- `VITE_AUTH0_CLIENT_ID`: Same as AUTH0_CLIENT_ID
- `VITE_AUTH0_AUDIENCE`: Same as AUTH0_AUDIENCE (if using API)

## Optional: Create an API

If you want to use Auth0 for API authorization:

1. Go to APIs > Create API
2. Set an identifier (this will be your audience)
3. Use this identifier for `AUTH0_AUDIENCE` and `VITE_AUTH0_AUDIENCE`

## Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:5173

3. Click "Sign In to Get Started"

4. You should be redirected to Auth0 login page

5. After successful login, you'll be redirected back to the application

## Production Deployment

For production:

1. Update all URLs in Auth0 application settings to use your production domain
2. Set environment variables in your production environment
3. Ensure `AUTH0_BASE_URL` matches your production URL
4. Use HTTPS for all production URLs

## Troubleshooting

- **Login redirect not working**: Check that callback URLs are correctly configured in Auth0
- **CORS errors**: Ensure your domain is added to Allowed Web Origins
- **Session not persisting**: Check that AUTH0_SECRET is set and consistent
- **Development without Auth0**: The app will fall back to mock authentication if Auth0 env vars are not set

## Security Best Practices

1. Never commit `.env` file to version control
2. Use strong, unique values for AUTH0_SECRET
3. Regularly rotate client secrets
4. Enable MFA in Auth0 for added security
5. Review Auth0 security best practices documentation

## Support

For Auth0-specific issues, consult the [Auth0 documentation](https://auth0.com/docs) or contact Auth0 support.