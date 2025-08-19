# Gigatime - Vercel Deployment Branch

This branch is specifically configured for deployment to **Vercel** with **Supabase** as the database.

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/stremphwalk/gigatime/tree/vercel-deployment)

## What's Different in This Branch

1. **Database Configuration**: Updated to support both Neon (dev) and Supabase (production)
2. **Vercel Config**: Added `vercel.json` for optimal deployment
3. **Production Environment**: Created production environment template
4. **Deployment Guide**: Comprehensive setup instructions

## Quick Setup

### 1. Clone and Deploy
```bash
git clone -b vercel-deployment https://github.com/stremphwalk/gigatime.git
cd gigatime
```

### 2. Set Up Services
- **Supabase**: Create project and get DATABASE_URL
- **Auth0**: Configure callback URLs for your domain
- **Deepgram**: Get API key for voice recognition

### 3. Environment Variables
Copy `.env.production.example` and fill in your values:
- `DATABASE_URL` (from Supabase)
- `AUTH0_*` (from Auth0 dashboard)
- `DEEPGRAM_API_KEY` (from Deepgram)

### 4. Deploy
```bash
# Push to GitHub and connect to Vercel
# Or use Vercel CLI
npx vercel --prod
```

### 5. Database Setup
```bash
# After deployment, run migration
npm run db:push
```

## Features Ready for Production

✅ **Authentication**: Auth0 integration with secure JWT tokens  
✅ **Database**: Supabase PostgreSQL with connection pooling  
✅ **Voice Recognition**: Deepgram Nova-3-medical model  
✅ **Medical Templates**: Admission, Progress, and Consult notes  
✅ **Security**: HTTPS, secure headers, environment isolation  
✅ **Scalability**: Serverless deployment with auto-scaling  

## File Structure
```
├── vercel.json                 # Vercel deployment config
├── DEPLOYMENT.md              # Detailed deployment guide
├── .env.production.example    # Production environment template
├── server/db.ts              # Updated for Supabase support
└── drizzle.config.ts         # Updated Drizzle config
```

## Support

For deployment issues, see [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting.

---

**🚀 Ready to deploy your medical documentation platform!**