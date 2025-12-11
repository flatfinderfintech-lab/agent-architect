# Agent Architect - Supabase + Vercel Deployment Guide

Complete deployment guide for Agent Architect with Supabase backend.

## 🏗️ Architecture

- **Frontend**: Next.js (packages/web) → Vercel
- **Backend**: Node.js Express (packages/backend) → Vercel
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Anthropic Claude + OpenAI

## 🚀 Quick Start

### 1. Initial Setup (One Time)

Run the setup script to configure your local environment:

```bash
./first-time.sh
```

This will:
- ✅ Check prerequisites
- ✅ Collect Supabase credentials
- ✅ Collect AI API keys
- ✅ Generate `.env` files for all packages

### 2. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: `agent-architect`
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to your users
4. Click "Create Project" and wait ~2 minutes

### 3. Get Supabase Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...`
   - **Service Role Key**: `eyJhbGc...` (keep secret!)

### 4. Set Up Database Schema

Link to your Supabase project and apply migrations:

```bash
# Install Supabase CLI if needed
brew install supabase/tap/supabase
# or: npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (get project ref from dashboard URL)
supabase link --project-ref your-project-ref

# Apply database migrations
supabase db push

# (Optional) Seed initial data
supabase db seed
```

### 5. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 6. Test Locally

```bash
# Start both frontend and backend
npm run dev

# Or individually:
npm run dev:web      # Frontend only (localhost:3000)
npm run dev:backend  # Backend only (localhost:3001)
```

Visit http://localhost:3000 to test!

---

## 🌐 Deploy to Vercel

### Step 1: Deploy Frontend

1. **Import Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/new)
   - Import: `https://github.com/YOUR_USERNAME/agent-architect`

2. **Configure Project**:
   ```
   Project Name: agent-architect-web
   Framework: Next.js
   Root Directory: packages/web
   Build Command: (auto-detected)
   Install Command: npm install --legacy-peer-deps
   ```

3. **Environment Variables**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   NEXT_PUBLIC_API_URL=https://agent-architect-backend.vercel.app
   ```

4. **Deploy** and save the URL (e.g., `https://agent-architect-web.vercel.app`)

### Step 2: Deploy Backend

1. **Create New Project**:
   - Click "Add New Project" in Vercel
   - Import the **same repository**

2. **Configure Project**:
   ```
   Project Name: agent-architect-backend
   Framework: Other
   Root Directory: packages/backend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install --legacy-peer-deps
   ```

3. **Environment Variables**:
   ```bash
   NODE_ENV=production
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_KEY=eyJhbGc... (service role key)
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...
   WEB_URL=https://agent-architect-web.vercel.app
   ```

4. **Deploy** and save the URL

### Step 3: Update Frontend

Go back to frontend project (`agent-architect-web`):

1. **Settings** → **Environment Variables**
2. **Update** `NEXT_PUBLIC_API_URL` with actual backend URL
3. **Deployments** → Click ⋯ → **Redeploy**

---

## ✅ Verify Deployment

### Test Backend Health

```bash
curl https://agent-architect-backend.vercel.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-09T...",
  "version": "1.0.0"
}
```

### Test Frontend

1. Open: `https://agent-architect-web.vercel.app`
2. Check browser DevTools console for errors
3. Try authentication flow

---

## 🔐 Supabase Authentication

### Enable Auth Providers

In Supabase Dashboard → **Authentication** → **Providers**:

1. **Email/Password**: Enabled by default
2. **Google OAuth**:
   - Get credentials from [Google Cloud Console](https://console.cloud.google.com)
   - Add authorized redirect URL: `https://xxxxx.supabase.co/auth/v1/callback`
3. **GitHub OAuth**:
   - Create OAuth app in [GitHub Settings](https://github.com/settings/developers)
   - Add callback URL: `https://xxxxx.supabase.co/auth/v1/callback`

---

## 📊 Database Management

### Useful Commands

```bash
# Create new migration
make db-migration-new name=add_agents_table

# Apply migrations
make db-apply

# Check migration status
make db-status

# List applied migrations
make db-list
```

### Access Database

**Via Supabase Dashboard**:
- Go to **Database** → **Tables**
- Run SQL: **SQL Editor**

**Via CLI**:
```bash
supabase db remote shell
```

---

## 🔧 Troubleshooting

### Build Failures

**Error**: "Cannot find module '@supabase/supabase-js'"
- **Fix**: Make sure `npm install --legacy-peer-deps` is used

**Error**: "SUPABASE_URL is not defined"
- **Fix**: Check environment variables in Vercel dashboard

### Database Connection Issues

**Error**: "Failed to connect to Supabase"
- **Fix**: Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
- Check Supabase project is not paused (free tier auto-pauses after 1 week inactivity)

### Authentication Issues

**Error**: "Invalid API key"
- **Fix**: Use `SUPABASE_ANON_KEY` for frontend, `SUPABASE_SERVICE_KEY` for backend

---

## 💰 Cost Breakdown

### Supabase Free Tier
- ✅ 500 MB database space
- ✅ 50,000 monthly active users
- ✅ 2 GB file storage
- ✅ 5 GB bandwidth
- ⚠️ Projects pause after 1 week inactivity

### Supabase Pro ($25/month)
- 8 GB database
- 100,000 MAU
- 100 GB storage
- 200 GB bandwidth
- No pausing

### Vercel Free Tier
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Serverless functions: 100 GB-hours

### Vercel Pro ($20/month/user)
- 1 TB bandwidth
- Commercial use
- Team collaboration

---

## 📈 Scaling Tips

1. **Enable Supabase Connection Pooling**:
   - Use `SUPABASE_URL` with connection pooler: `https://xxxxx.supabase.co:6543`

2. **Optimize Vercel Functions**:
   - Increase memory in `vercel.json` if needed
   - Use Edge Functions for faster cold starts

3. **Database Indexing**:
   - Add indexes for frequently queried columns
   - Monitor slow queries in Supabase dashboard

4. **Caching**:
   - Use Vercel Edge caching for static content
   - Implement Redis caching for API responses (Upstash)

---

## 🆘 Support

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Issues**: https://github.com/YOUR_USERNAME/agent-architect/issues

---

## 🎯 Next Steps

After deployment:

1. ✅ Set up custom domain in Vercel
2. ✅ Enable Supabase Auth providers
3. ✅ Set up monitoring (Vercel Analytics, Supabase Logs)
4. ✅ Configure email templates in Supabase
5. ✅ Set up CI/CD with GitHub Actions
6. ✅ Add SSL certificates (auto with Vercel)

Happy deploying! 🚀
