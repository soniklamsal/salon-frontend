# Vercel Deployment Guide

## Quick Start - Deploy Without Backend

The application is designed to build and run on Vercel even without a backend connection. It will use fallback content and disable authentication features.

### Step 1: Initial Deployment (No Environment Variables Needed)

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository: `soniklamsal/salon-frontend`
   - **DO NOT add any environment variables yet**
   - Click "Deploy"

3. **Build will succeed** ✅
   - The app uses fallback content (bundled with the app)
   - Authentication is automatically disabled (no Clerk keys)
   - All pages will work with default content

### Step 2: Add Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add `ajunisexsalon.com` and `www.ajunisexsalon.com`
4. Update your DNS records as instructed by Vercel

### Step 3: Add Environment Variables (After Backend Setup)

Once your backend is ready, add these environment variables in Vercel:

1. **Go to**: Project Settings → Environment Variables

2. **Add these variables**:

```env
# Backend API
SALON_API_URL=https://ajunisexsalon.com/api/v1
SALON_API_REVALIDATE=60
SALON_API_TIMEOUT_MS=4000

# Site URL (your actual domain)
SALON_SITE_URL=https://ajunisexsalon.com

# Clerk Authentication (Production)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_live_YOUR_KEY_HERE

# Clerk Routes (can leave as defaults)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/services
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/services
```

3. **Set environment to**: Production, Preview, and Development
4. **Redeploy** the application

## How It Works Without Backend

### Content Fallback System

The application has a comprehensive fallback system:

- **Homepage**: Shows default content from `src/lib/fallbacks/content-fallback.ts`
- **Services**: Shows 5 default services with SVG images
- **About Page**: Shows default team and content
- **Booking**: Disabled when no backend (shows message)

### Authentication Fallback

- **No Clerk Keys**: Authentication features are hidden
- **With Clerk Keys**: Full sign-in/sign-up functionality enabled

### Build Process

1. During build, Next.js tries to fetch content from the API
2. If the API is unavailable (timeout after 4 seconds)
3. Falls back to bundled content
4. Build succeeds with warning in logs: `[content] unavailable — serving bundled fallback content`

## Troubleshooting

### Build Fails with "fetch failed"

**Cause**: The build process is trying to reach an unreachable backend

**Solution**: The fallback system should handle this automatically. If it doesn't:
1. Check that `SALON_API_TIMEOUT_MS` is set to a low value (4000ms)
2. Ensure `src/lib/api/content.ts` has proper error handling
3. Try adding this to Vercel environment variables:
   ```
   SALON_API_URL=http://localhost:8001/api/v1
   ```

### Build Fails with "CLERK_PUBLISHABLE_KEY is not defined"

**Cause**: Some Clerk component is trying to access keys at build time

**Solution**: The app checks `CLERK_ENABLED` before using Clerk. Make sure:
1. You're NOT setting Clerk env variables if you don't have keys yet
2. All Clerk components are wrapped in conditional checks
3. The layout.tsx uses the `CLERK_ENABLED` check

### Images Not Loading

**Cause**: Images are being served from local backend or Cloudinary

**Solution**: 
1. **For fallback content**: Images are SVGs in `/public/images/` - these always work
2. **For backend images**: Add `SALON_API_URL` environment variable
3. **For Cloudinary**: Images from Cloudinary should work automatically

### "SALON_SITE_URL is not configured" Warning

**Cause**: Missing `SALON_SITE_URL` environment variable

**Solution**: Add to Vercel environment variables:
```
SALON_SITE_URL=https://ajunisexsalon.com
```

This affects:
- SEO meta tags
- Open Graph tags
- Sitemap generation
- robots.txt

## Deployment Checklist

### Phase 1: Initial Deployment (No Backend)

- [ ] Push code to GitHub
- [ ] Import project to Vercel
- [ ] Deploy without environment variables
- [ ] Verify homepage loads with fallback content
- [ ] Verify services page works
- [ ] Verify about page works
- [ ] Check that booking shows "backend unavailable" message

### Phase 2: Domain Setup

- [ ] Add custom domain in Vercel
- [ ] Update DNS records (A/CNAME)
- [ ] Wait for DNS propagation
- [ ] Verify SSL certificate is active
- [ ] Add `SALON_SITE_URL` environment variable
- [ ] Redeploy to apply domain changes

### Phase 3: Backend Integration

- [ ] Backend deployed and accessible
- [ ] Add `SALON_API_URL` environment variable
- [ ] Test API endpoint manually: `curl https://ajunisexsalon.com/api/v1/homepage/`
- [ ] Redeploy frontend
- [ ] Verify CMS content loads instead of fallback
- [ ] Verify admin-uploaded images display

### Phase 4: Authentication

- [ ] Get Clerk production keys
- [ ] Configure Clerk production instance domain
- [ ] Add Clerk environment variables to Vercel
- [ ] Configure Clerk webhook endpoint
- [ ] Redeploy frontend
- [ ] Test sign-up flow
- [ ] Test sign-in flow
- [ ] Test Google OAuth
- [ ] Test booking creation with authentication

## Environment Variable Reference

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `SALON_API_URL` | No | `http://127.0.0.1:8001/api/v1` | Backend API endpoint |
| `SALON_API_REVALIDATE` | No | `60` | Content cache time (seconds) |
| `SALON_API_TIMEOUT_MS` | No | `4000` | API request timeout |
| `SALON_SITE_URL` | No | `http://localhost:3000` | Your production domain |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | No | - | Clerk public key |
| `CLERK_SECRET_KEY` | No | - | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | No | `/sign-in` | Sign-in page path |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | No | `/sign-up` | Sign-up page path |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | No | `/services` | After sign-in redirect |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | No | `/services` | After sign-up redirect |

## Performance Optimization

### Recommended Settings

1. **Enable Edge Functions** (Settings → Functions)
   - Improves global response time
   - Reduces latency for international users

2. **Enable ISR** (Already configured)
   - Content revalidates every 60 seconds
   - Pages are pre-rendered for fast loading

3. **Image Optimization** (Automatic)
   - Next.js Image component handles optimization
   - Cloudinary images are automatically optimized

4. **Analytics** (Settings → Analytics)
   - Enable Web Analytics for visitor tracking
   - Monitor Core Web Vitals

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Clerk Docs**: https://clerk.com/docs
- **Project Issues**: Check build logs in Vercel dashboard

## Rollback

If deployment fails or has issues:

1. **Instant Rollback**
   - Go to Vercel dashboard → Deployments
   - Find previous working deployment
   - Click "..." menu → "Promote to Production"

2. **Remove Problem Variables**
   - Settings → Environment Variables
   - Delete problematic variables
   - Redeploy

3. **Check Logs**
   - View build logs for errors
   - Check runtime logs for API failures
   - Monitor function logs for authentication issues
