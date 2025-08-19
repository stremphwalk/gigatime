# Gigatime Deployment Guide - Vercel + Supabase

This guide walks you through deploying Gigatime to Vercel with Supabase as the database.

## Prerequisites

1. **Vercel Account**: [Sign up at vercel.com](https://vercel.com)
2. **Supabase Account**: [Sign up at supabase.com](https://supabase.com)
3. **Auth0 Account**: [Sign up at auth0.com](https://auth0.com)
4. **Deepgram Account**: [Sign up at deepgram.com](https://deepgram.com)

## 1. Supabase Setup

### Create a New Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project name: `gigatime-production`
5. Generate a strong database password
6. Select a region close to your users
7. Click "Create new project"

### Get Database Connection Details
1. Go to **Settings > Database**
2. Find the **Connection string** section
3. Copy the **URI** (it looks like `postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres`)
4. Save this as your `DATABASE_URL`

### Set Up Row Level Security (RLS)
Supabase automatically enables RLS. For this deployment, we'll use service role for server-side operations.

## 2. Auth0 Configuration

### Update Auth0 Settings
1. Go to your Auth0 Dashboard
2. Navigate to **Applications > Your App > Settings**
3. Update the URLs for production:

**Allowed Callback URLs:**
```
https://your-app-name.vercel.app/api/auth/callback
```

**Allowed Logout URLs:**
```
https://your-app-name.vercel.app
```

**Allowed Web Origins:**
```
https://your-app-name.vercel.app
```

**Allowed Origins (CORS):**
```
https://your-app-name.vercel.app
```

## 3. Vercel Deployment

### Deploy from GitHub
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the `vercel-deployment` branch
5. Configure the project settings:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

### Environment Variables
Add these environment variables in Vercel:

```bash
# Database
DATABASE_URL=postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres

# Auth0 Server
AUTH0_SECRET=[generate-strong-secret]
AUTH0_BASE_URL=https://your-app-name.vercel.app
AUTH0_CLIENT_ID=[your-auth0-client-id]
AUTH0_CLIENT_SECRET=[your-auth0-client-secret]
AUTH0_ISSUER_BASE_URL=https://[your-domain].auth0.com
AUTH0_AUDIENCE=[your-auth0-audience]

# Auth0 Client
VITE_AUTH0_DOMAIN=[your-domain].auth0.com
VITE_AUTH0_CLIENT_ID=[your-auth0-client-id]
VITE_AUTH0_AUDIENCE=[your-auth0-audience]

# Other Services
DEEPGRAM_API_KEY=[your-deepgram-api-key]
SESSION_SECRET=[generate-strong-secret]
NODE_ENV=production
```

### Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be available at `https://your-app-name.vercel.app`

## 4. Database Migration

### Run Migrations
After deployment, you need to set up the database schema:

1. **Local Setup**:
   ```bash
   # Install dependencies locally
   npm install
   
   # Set your production DATABASE_URL in .env
   DATABASE_URL=postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres
   
   # Push schema to Supabase
   npm run db:push
   ```

2. **Or use Drizzle Studio**:
   ```bash
   npx drizzle-kit studio
   ```

## 5. Verification

### Test the Deployment
1. Visit your Vercel URL
2. Test authentication with Auth0
3. Create a new note to verify database connectivity
4. Test voice dictation functionality

### Monitor
- **Vercel Analytics**: Monitor performance and usage
- **Supabase Dashboard**: Monitor database performance
- **Auth0 Dashboard**: Monitor authentication metrics

## 6. Domain Setup (Optional)

### Custom Domain
1. Go to Vercel Dashboard > Your Project > Settings > Domains
2. Add your custom domain
3. Update Auth0 callback URLs to use your custom domain

## Troubleshooting

### Common Issues

**Database Connection Errors:**
- Verify DATABASE_URL is correct
- Check Supabase project is active
- Ensure password is URL-encoded

**Auth0 Errors:**
- Verify all callback URLs are correctly set
- Check environment variables match Auth0 settings
- Ensure AUTH0_BASE_URL matches your Vercel URL

**Build Errors:**
- Check Node.js version compatibility
- Verify all environment variables are set
- Review build logs in Vercel

## Security Notes

1. **Environment Variables**: Never commit real environment variables to git
2. **Database Access**: Use connection pooling for production
3. **Auth0**: Enable anomaly detection and brute force protection
4. **Vercel**: Enable deployment protection if needed

## Scaling Considerations

1. **Database**: Supabase automatically scales, monitor usage in dashboard
2. **Vercel**: Upgrade plan as needed for higher traffic
3. **Auth0**: Monitor MAU (Monthly Active Users) limits
4. **Deepgram**: Monitor API usage and quotas

---

🎉 **Your Gigatime application is now deployed and ready for production use!**