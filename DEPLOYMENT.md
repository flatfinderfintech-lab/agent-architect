# Agent Architect - Vercel Deployment Guide

This guide explains how to deploy the Agent Architect microservices platform to Vercel.

## Architecture Overview

Agent Architect is a monorepo with three packages:

- **packages/web**: Next.js frontend application
- **packages/backend**: Express.js API service with Socket.IO
- **packages/mobile**: Expo mobile application (not deployed to Vercel)

## Deployment Strategy

### Option 1: Monorepo Deployment (Recommended)

Deploy both frontend and backend from a single repository using Vercel's monorepo support.

#### Step 1: Deploy the Frontend

1. Import this repository to Vercel: https://github.com/fucacctz-create/agent-architect
2. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: Leave as root (monorepo detected)
   - **Build Command**: `npm run build --workspace=packages/web`
   - **Output Directory**: `packages/web/.next`
   - **Install Command**: `npm install --legacy-peer-deps`

3. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   ```

#### Step 2: Deploy the Backend

1. Create a new Vercel project for the backend
2. Link the same GitHub repository
3. Configure the project:
   - **Root Directory**: `packages/backend`
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Set environment variables:
   ```
   NODE_ENV=production
   WEB_URL=https://your-frontend-url.vercel.app
   CLERK_SECRET_KEY=your_clerk_secret
   DATABASE_URL=your_database_url
   REDIS_URL=your_redis_url
   ANTHROPIC_API_KEY=your_anthropic_key
   OPENAI_API_KEY=your_openai_key
   ```

### Option 2: Separate Repositories

You can also split the monorepo into separate repositories for more granular control:

1. **Frontend Repository**: Deploy `packages/web` as standalone Next.js app
2. **Backend Repository**: Deploy `packages/backend` as standalone Node.js app

## Configuration Files

### Root `vercel.json`

Configures the frontend deployment and API routing:

- Routes API calls to the backend service
- Sets up CORS headers
- Configures environment variables

### Backend `vercel.json`

Configures the backend service:

- Builds the Express.js application
- Sets up serverless functions
- Configures memory and timeout limits

## Environment Variables

### Frontend (packages/web)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk authentication key | Yes |

### Backend (packages/backend)

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (production) | Yes |
| `WEB_URL` | Frontend URL for CORS | Yes |
| `CLERK_SECRET_KEY` | Clerk authentication secret | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | No |

## Database Setup

The backend requires PostgreSQL and Redis. You can use:

- **Vercel Postgres**: Integrated PostgreSQL database
- **Vercel KV**: Integrated Redis database
- **External providers**: Railway, Supabase, Upstash, etc.

### Running Migrations

After deploying the backend:

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Run migrations
vercel env pull .env.local
npm run migrate --workspace=packages/backend
```

## WebSocket Considerations

⚠️ **Important**: Vercel's serverless functions have limitations with WebSocket connections. For production deployments requiring real-time WebSocket features:

1. **Option A**: Deploy backend to a different platform
   - Railway: Full WebSocket support
   - Render: Full WebSocket support
   - AWS ECS/Fargate: Full control

2. **Option B**: Use Vercel Edge Functions with Server-Sent Events (SSE)
   - Refactor WebSocket logic to use SSE
   - Maintain compatibility with Vercel's infrastructure

## Testing the Deployment

After deployment, test the following:

1. **Frontend Health**:
   ```bash
   curl https://your-frontend-url.vercel.app
   ```

2. **Backend Health**:
   ```bash
   curl https://your-backend-url.vercel.app/health
   ```

3. **API Connection**:
   - Open your frontend in a browser
   - Check browser console for API connection errors
   - Verify authentication flows work

## Troubleshooting

### "Invalid request: should not have additional property 'lockfileVersion'"

This error occurs when `lockfileVersion` appears in JSON config files. The issue has been resolved by:
- Ensuring `lockfileVersion` only exists in `package-lock.json`
- Not copying lockfile properties to `vercel.json`

### Build Failures

If builds fail:
1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Ensure `npm install --legacy-peer-deps` is used (configured in root `vercel.json`)

### CORS Errors

If you see CORS errors:
1. Update `WEB_URL` in backend environment variables
2. Verify CORS headers in `vercel.json`
3. Check that API routes are properly configured

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Commits to `main` branch
- **Preview**: Pull requests and other branches

Configure branch protection and deployment settings in Vercel dashboard.

## Cost Optimization

- Use Vercel's free tier for development/testing
- Monitor function execution time and memory usage
- Consider caching strategies for API responses
- Use Edge Functions for static API routes

## Support

For issues or questions:
- GitHub Issues: https://github.com/fucacctz-create/agent-architect/issues
- Vercel Documentation: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
