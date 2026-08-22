# Production Deployment Guide for ajunisexsalon.com

## Overview
This guide covers deploying the salon booking application to production at **ajunisexsalon.com**.

## Environment Configuration

### Current Setup
- **Development**: Using `.env.local` with test Clerk keys
- **Production**: Domain **ajunisexsalon.com** registered and ready

### Clerk Production Instance
- **App ID**: `app_3HrCwpviKJeTG99BXo3imicMsFc`
- **Instance ID**: `ins_3ICmMnOQDubn39PON0qH9tgttTl`
- **Dashboard**: [View in Clerk Dashboard](https://dashboard.clerk.com/apps/app_3HrCwpviKJeTG99BXo3imicMsFc/instances/ins_3ICmMnOQDubn39PON0qH9tgttTl)

## Switching to Production

### Step 1: Update `.env.local`

Your `.env.local` file now has two sections:
1. **DEVELOPMENT (LOCAL) CONFIGURATION** - Currently active
2. **PRODUCTION CONFIGURATION** - Currently commented out

When ready to deploy:

1. **Comment out** the entire DEVELOPMENT section (lines with current values)
2. **Uncomment** the PRODUCTION section
3. **Get production keys** from Clerk dashboard:
   - Visit: [API Keys](https://dashboard.clerk.com/apps/app_3HrCwpviKJeTG99BXo3imicMsFc/instances/ins_3ICmMnOQDubn39PON0qH9tgttTl/api-keys)
   - Copy `pk_live_*` (publishable key)
   - Copy `sk_live_*` (secret key)
   - Replace placeholders in `.env.local`

### Step 2: Configure Clerk Production Instance

1. **Add Production Domain**
   - Go to: [Domains Settings](https://dashboard.clerk.com/apps/app_3HrCwpviKJeTG99BXo3imicMsFc/instances/ins_3ICmMnOQDubn39PON0qH9tgttTl/domains)
   - Add `ajunisexsalon.com` as authorized domain
   - Configure authorized redirect URLs:
     - `https://ajunisexsalon.com/sign-in`
     - `https://ajunisexsalon.com/sign-up`
     - `https://ajunisexsalon.com/services`

2. **Configure OAuth Settings** (if using Google Sign-In)
   - Set up production OAuth credentials
   - Update Google Cloud Console with production domain
   - Configure Clerk with production OAuth client ID/secret

3. **Set Up Webhooks**
   - Configure webhook URL: `https://ajunisexsalon.com/api/v1/webhooks/clerk/`
   - Get webhook signing secret
   - Add to backend `.env.production`

### Step 3: Update Backend Configuration

Update `backend/.env.production`:

```env
# Django Settings
DJANGO_SECRET_KEY=<generate-new-production-secret-key>
DEBUG=False
ALLOWED_HOSTS=ajunisexsalon.com,www.ajunisexsalon.com

# Database - MySQL Production
DATABASE_URL=mysql://salon_user:password@localhost:3306/salon_production

# Clerk
CLERK_API_KEY=<your-clerk-production-secret-key>
CLERK_WEBHOOK_SECRET=<your-clerk-webhook-signing-secret>

# CORS
CORS_ALLOWED_ORIGINS=https://ajunisexsalon.com,https://www.ajunisexsalon.com

# CSRF
CSRF_TRUSTED_ORIGINS=https://ajunisexsalon.com,https://www.ajunisexsalon.com

# Cloudinary (same as development)
CLOUDINARY_CLOUD_NAME=dr54mqokd
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

### Step 4: DNS Configuration

1. **Point Domain to Server**
   - Set A record for `ajunisexsalon.com` → your server IP
   - Set A record for `www.ajunisexsalon.com` → your server IP

2. **SSL Certificate**
   - Install Let's Encrypt certificate
   - Configure auto-renewal
   - Ensure HTTPS is enforced

### Step 5: Build and Deploy

```bash
# Frontend (Next.js)
npm run build
npm run start  # or use PM2/systemd

# Backend (Django)
python manage.py collectstatic --noinput
python manage.py migrate
# Start with Gunicorn or uWSGI
```

## Production Checklist

### Before Going Live

- [ ] Get production Clerk API keys
- [ ] Update `.env.local` with production configuration
- [ ] Configure Clerk production domain (ajunisexsalon.com)
- [ ] Set up Clerk webhooks with production URL
- [ ] Update backend `.env.production` file
- [ ] Configure production database
- [ ] Set up DNS records
- [ ] Install SSL certificate
- [ ] Update Django ALLOWED_HOSTS and CORS settings
- [ ] Build frontend (`npm run build`)
- [ ] Run Django migrations
- [ ] Collect static files
- [ ] Seed initial content
- [ ] Configure web server (Nginx/Apache)

### Post-Deployment Testing

- [ ] Test sign-up flow with email
- [ ] Test sign-in flow
- [ ] Test Google OAuth sign-in
- [ ] Test booking creation
- [ ] Test payment screenshot upload to Cloudinary
- [ ] Test booking approval workflow
- [ ] Test admin panel access
- [ ] Test booking slip download/print
- [ ] Verify email notifications
- [ ] Test responsive design on mobile
- [ ] Check SSL certificate validity
- [ ] Monitor error logs

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `.env.local` or `.env.production` to Git
- Keep Clerk secret keys private
- Use strong Django SECRET_KEY in production
- Enable Django's security middleware
- Keep DEBUG=False in production
- Regularly update dependencies

## Support

For issues or questions:
- Backend: Check Django logs in `/var/log/` or application logs
- Frontend: Check Next.js logs and browser console
- Clerk: Check [Clerk Dashboard](https://dashboard.clerk.com) for authentication logs

## Rollback Plan

If deployment fails:
1. Comment out PRODUCTION section in `.env.local`
2. Uncomment DEVELOPMENT section
3. Restart Next.js application
4. Investigate logs and fix issues
5. Test thoroughly before retrying deployment
