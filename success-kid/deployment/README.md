# Deployment Guide

This document provides guidance for deploying the Success Kid Community Platform to various environments.

## Environments

### Staging

The staging environment is used for testing and validating changes before they are deployed to production. It is automatically deployed when changes are pushed to the `develop` branch.

**URL:** https://staging.successkid.com
**API URL:** https://api-staging.successkid.com

### Production

The production environment is the live environment used by users. It is deployed when changes are pushed to the `main` branch or when a release is created.

**URL:** https://successkid.com
**API URL:** https://api.successkid.com

## Deployment Process

### Automatic Deployments

The platform is automatically deployed to the appropriate environment based on the branch:

- **develop** branch → Staging environment
- **main** branch → Production environment

### Manual Deployments

In case manual deployments are needed, follow these steps:

1. Ensure you have the required permissions
2. Check out the branch you want to deploy
3. Run the appropriate deployment script:
   - Staging: `pnpm deploy:staging`
   - Production: `pnpm deploy:production`

### Rollback Process

If a deployment causes issues, follow these steps to roll back:

1. Go to the GitHub repository
2. Navigate to Actions
3. Find the failing deployment
4. Click "Re-run jobs" on the last successful deployment

Alternatively, you can manually roll back by running the appropriate rollback script:
```bash
./scripts/rollback-staging.sh
# or
./scripts/rollback-production.sh
```

## Environment Variables

Environment variables are managed in the following locations:

- GitHub Secrets for sensitive information
- Environment files for non-sensitive configuration
- Vercel environment variables for frontend-specific settings

To set up environment variables:

1. Copy the appropriate `.env.example` file to `.env`
2. Fill in the necessary values
3. For GitHub Actions, add secrets in the repository settings

## Deployment Architecture

### Frontend

The frontend is deployed to Vercel. The deployment process:

1. Builds the Next.js application
2. Deploys the built assets to Vercel
3. Handles environment configuration

### Backend

The backend is deployed to a dedicated server using PM2. The deployment process:

1. Pulls the latest code from the repository
2. Installs dependencies
3. Builds the application
4. Restarts the PM2 process

## Monitoring

After deployment, monitor the application through:

- Application logs: `/var/log/successkid/`
- Error tracking: Sentry dashboard
- Performance monitoring: New Relic dashboard
- User feedback channels: Support portal

## Health Checks

The following endpoints can be used to check the health of the application:

- Frontend: `https://[domain]/api/health`
- Backend: `https://api.[domain]/health`

## Deployment Verification Checklist

After each deployment, verify:

1. The application loads correctly
2. Authentication flows work
3. Critical features function as expected
4. No errors appear in the console
5. Performance metrics are within acceptable ranges