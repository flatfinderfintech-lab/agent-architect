# Agent Architect - Claude Code Guide

## Project Overview

**Agent Architect** is a comprehensive AI agent platform that empowers both non-coders and developers to build, deploy, monetize, and execute AI agents across web and mobile environments.

**Tech Stack**: Node.js 20, TypeScript, Next.js 14, React Native (Expo), Supabase, PostgreSQL, Redis, Express.js

**Repository Type**: Monorepo with npm workspaces

## Architecture

This is a monorepo project with the following structure:

```
agent-architect/
├── packages/
│   ├── backend/         # Node.js/Express API with TypeScript
│   ├── web/             # Next.js 14 web application
│   ├── mobile/          # React Native mobile app (Expo)
│   └── shared/          # Shared types and utilities
├── supabase/            # Supabase configuration and migrations
├── .github/             # GitHub Actions workflows
├── docker-compose.yml   # Docker orchestration
├── Makefile            # Common development tasks
├── first-time.sh       # Interactive setup script
└── package.json        # Root package with workspace configuration
```

## Key Technologies

### Backend (`packages/backend/`)
- **Runtime**: Node.js 20 LTS with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15 (via Supabase)
- **Cache**: Redis 7
- **LLMs**: OpenAI SDK (GPT-4, GPT-3.5), Anthropic SDK (Claude)
- **Real-time**: Socket.io for WebSocket connections
- **Backend**: Supabase (Auth, Database, Storage, Realtime)

### Web Frontend (`packages/web/`)
- **Framework**: Next.js 14 with App Router
- **UI**: shadcn/ui + Tailwind CSS 3
- **Authentication**: Clerk OAuth (Google, GitHub, Email)
- **State Management**: React Context/Hooks

### Mobile (`packages/mobile/`)
- **Framework**: React Native (Expo)
- **UI**: React Native Paper
- **Authentication**: Clerk Expo

## Core Features

1. **Agent Creation & Management**: Create, edit, and manage AI agents with custom system prompts
2. **ReAct Execution Engine**: Implements Reasoning → Action → Observation loops for autonomous problem-solving
3. **Tool Store**: Browse and attach tools (Web Search via Perplexity, Email, Database, HTTP, Slack)
4. **Marketplace**: Publish and monetize agents with subscription-based pricing
5. **Multi-Platform**: Unified experience across web and mobile
6. **Real-time Execution**: WebSocket support for live execution updates

## Development Setup

### Prerequisites
- Node.js 20+ and npm 10+
- Docker and Docker Compose
- Supabase account
- API keys: OpenAI, Anthropic, Perplexity (optional)

### Quick Start
```bash
# Run the interactive setup script
./first-time.sh

# Install dependencies
npm install --legacy-peer-deps

# Start all services with Docker
npm run docker:up

# OR start services individually
docker-compose up postgres redis -d
npm run dev:backend
npm run dev:web
npm run dev:mobile  # optional
```

### Environment Variables
Key environment variables (see `.env.example`):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
- `NODE_ENV`, `JWT_SECRET`
- `CLERK_*` - Clerk authentication credentials

## Common Development Tasks

### Running Services
```bash
npm run dev                 # Backend + Web
npm run dev:backend        # Backend only
npm run dev:web            # Web only
npm run dev:mobile         # Mobile only
npm run docker:up          # All services via Docker
npm run docker:down        # Stop Docker services
```

### Database Operations
```bash
npm run db:migrate         # Run database migrations
npm run db:seed           # Seed database with sample data
```

### Testing
```bash
npm test                           # All tests
npm test --workspace=packages/backend   # Backend tests only
npm test --workspace=packages/web       # Web tests only
```

### Building
```bash
npm run build                      # Build all packages
npm run build --workspace=packages/web  # Build web only
```

## Database Schema

Key tables in PostgreSQL:
- `users` - User accounts (synced with Clerk)
- `agents` - AI agent configurations
- `tools` - Available tools for agents
- `agent_tools` - Agent-tool associations
- `executions` - Execution records
- `execution_logs` - Step-by-step execution logs (ReAct pattern)
- `marketplace_listings` - Marketplace agent listings
- `subscriptions` - User subscriptions to marketplace agents
- `usage_tracking` - Token usage and cost tracking

## API Endpoints

### Agents
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents` - Create new agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent
- `POST /api/agents/:id/clone` - Clone an agent

### Executions
- `POST /api/executions` - Execute an agent
- `GET /api/executions/:id` - Get execution details
- `GET /api/executions` - List executions

### Tools
- `GET /api/tools` - List available tools
- `GET /api/tools/:id` - Get tool details

### Marketplace
- `GET /api/marketplace` - Browse marketplace listings
- `GET /api/marketplace/:id` - Get listing details
- `POST /api/marketplace` - Create listing
- `POST /api/marketplace/:id/subscribe` - Subscribe to listing
- `GET /api/marketplace/my/listings` - Get creator's listings
- `GET /api/marketplace/my/subscriptions` - Get user's subscriptions

## Coding Conventions

### TypeScript
- Use strict TypeScript configuration
- Define interfaces for all data models
- Use type-safe API calls
- Avoid `any` types when possible

### Code Organization
- Shared types should go in `packages/shared/`
- Keep components focused and single-purpose
- Use consistent naming: PascalCase for components, camelCase for functions
- Follow Next.js 14 App Router conventions for web package

### Error Handling
- Use try-catch blocks for async operations
- Return meaningful error messages
- Log errors with Winston logger (backend)
- Implement graceful degradation for failed API calls

### Security
- Never commit API keys or secrets
- Use environment variables for configuration
- Implement rate limiting on API endpoints
- Use parameterized queries to prevent SQL injection
- Validate and sanitize user inputs

## Important Files

### Configuration
- `docker-compose.yml` - Docker service definitions
- `vercel.json` - Vercel deployment configuration
- `Makefile` - Development task shortcuts
- `.npmrc` - npm configuration (legacy-peer-deps)

### Documentation
- `README.md` - Main project documentation
- `DEPLOYMENT.md` - Deployment guide
- `DEPLOYMENT-SUPABASE.md` - Supabase-specific deployment guide

### Setup
- `first-time.sh` - Interactive setup script for new developers
- `.env.example` - Example environment variables

## ReAct Pattern Implementation

The execution engine implements the ReAct (Reasoning + Acting) pattern:

1. **Reasoning**: LLM reasons about the current state and decides next action
2. **Action**: Execute the chosen tool or action
3. **Observation**: Record the result and feed back to LLM
4. Loop until task is complete or max iterations reached

Key features:
- Iteration limits to prevent infinite loops
- Execution timeouts for long-running tasks
- Detailed step logging in `execution_logs` table
- Token usage and cost tracking per execution

## Deployment

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Vercel (Web)
- Web frontend is configured for Vercel deployment
- See `vercel.json` for configuration
- Microservices are configured via `rewrites`

### Kubernetes
- Ready for deployment on AWS EKS, GCP GKE, Azure AKS
- See deployment documentation for manifests

## Troubleshooting

### Common Issues

1. **npm install fails**: Use `npm install --legacy-peer-deps`
2. **Docker services won't start**: Check ports 3000, 3001, 5432, 6379 are available
3. **Database connection errors**: Verify Supabase credentials in `.env`
4. **Authentication fails**: Check Clerk credentials and callback URLs

### Logs
- Backend logs: Winston structured JSON logs
- Docker logs: `docker-compose logs -f [service]`
- Execution logs: Stored in `execution_logs` table

## Best Practices

1. **Before Making Changes**:
   - Read existing code to understand patterns
   - Check if similar functionality exists elsewhere
   - Follow the existing architectural patterns

2. **When Adding Features**:
   - Consider impact on all packages (backend, web, mobile)
   - Update shared types if data models change
   - Add appropriate error handling
   - Update documentation as needed

3. **Testing**:
   - Write tests for new functionality
   - Test across platforms (web and mobile)
   - Verify authentication flows
   - Test with different LLM providers

4. **Git Workflow**:
   - Create feature branches from main
   - Use descriptive commit messages
   - Push to feature branches only
   - Never force push to main

## Support Resources

- **Documentation**: https://docs.prototype.cafe
- **Issues**: GitHub Issues
- **Email**: support@prototype.cafe
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Expo Docs**: https://docs.expo.dev

## Project Goals

### For Non-Coders
Create and deploy a functional agent in under 90 seconds using templates and pre-built tools.

### For Developers
Clone, customize, and publish marketplace agents in under 15 minutes with full control over prompts, tools, and pricing.

---

**Built with care by the Prototype.Cafe team**
