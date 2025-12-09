# Agent Architect

A comprehensive AI agent platform powered by Supabase that empowers both non-coders and developers to build, deploy, monetize, and execute AI agents across web and mobile environments.

## 🆕 New: Supabase Integration

Agent Architect now uses **Supabase** for a streamlined, all-in-one backend:

- ✅ **Authentication**: Built-in auth with Google, GitHub, email/password
- ✅ **Database**: PostgreSQL with Row Level Security (RLS)
- ✅ **Real-time**: Instant updates via Supabase Realtime
- ✅ **Storage**: File uploads and management
- ✅ **Easy Setup**: Run `./first-time.sh` to get started
- ✅ **Free Tier**: Generous free tier for development

**Quick Start**: See [DEPLOYMENT-SUPABASE.md](./DEPLOYMENT-SUPABASE.md) for complete setup instructions.

## 🌟 Features

- **Agent Creation & Management**: Create, edit, and manage AI agents with custom system prompts
- **ReAct Execution Engine**: Advanced execution with Reasoning → Action → Observation loops
- **Tool Store**: Browse and attach powerful tools (Web Search via Perplexity, Email, Database, HTTP, Slack)
- **Marketplace**: Publish and monetize your agents with subscription-based pricing
- **Multi-Platform**: Web application (Next.js 14) and Mobile app (React Native)
- **LLM Integration**: Support for OpenAI (GPT-4, GPT-3.5) and Anthropic (Claude) models
- **Real-time Execution**: WebSocket support for live execution updates
- **Authentication**: Secure authentication via Clerk (Google, GitHub, Email)

## 🏗️ Architecture

This is a monorepo project with the following structure:

```
agent-architect/
├── packages/
│   ├── backend/         # Node.js/Express API with TypeScript
│   ├── web/            # Next.js 14 web application
│   ├── mobile/         # React Native mobile app (Expo)
│   └── shared/         # Shared types and utilities
├── docker-compose.yml  # Docker orchestration
└── package.json        # Root package with workspace configuration
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20 LTS with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **LLMs**: OpenAI SDK, Anthropic SDK
- **Authentication**: Clerk
- **Real-time**: Socket.io

### Web Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Tailwind CSS 3
- **Authentication**: Clerk OAuth

### Mobile
- **Framework**: React Native (Expo)
- **UI**: React Native Paper
- **Authentication**: Clerk Expo

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm 10+
- Docker and Docker Compose
- Clerk account (for authentication)
- OpenAI API key (optional)
- Anthropic API key (optional)
- Perplexity API key (optional, for web search)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/flatfinderfintech-lab/agent-architect.git
   cd agent-architect
   ```

2. **Run the setup script** (recommended)
   ```bash
   ./first-time.sh
   ```

   This interactive script will:
   - Check prerequisites
   - Collect your Supabase credentials
   - Collect AI API keys
   - Generate all necessary `.env` files

   **OR** manually copy `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   # OR use the Makefile
   make install
   ```

4. **Set up Supabase** (if not done via script)

   Get credentials from your [Supabase project](https://app.supabase.com):
   ```env
   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key

   # AI APIs
   ANTHROPIC_API_KEY=sk-ant-your-key
   OPENAI_API_KEY=sk-your-key

   # Application
   NODE_ENV=development
   JWT_SECRET=your_secure_random_string
   ```

4. **Start the services with Docker**
   ```bash
   npm run docker:up
   ```

   This will start:
   - PostgreSQL (port 5432)
   - Redis (port 6379)
   - Backend API (port 3001)
   - Web frontend (port 3000)

5. **Access the application**
   - Web: http://localhost:3000
   - API: http://localhost:3001
   - API Health: http://localhost:3001/health

### Development Without Docker

If you prefer to run services individually:

1. **Start PostgreSQL and Redis**
   ```bash
   docker-compose up postgres redis -d
   ```

2. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

3. **Start backend**
   ```bash
   npm run dev:backend
   ```

4. **Start web frontend (in another terminal)**
   ```bash
   npm run dev:web
   ```

5. **Start mobile (optional, in another terminal)**
   ```bash
   npm run dev:mobile
   ```

## 📱 Mobile Development

To run the mobile app:

1. **Install Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

2. **Start the mobile app**
   ```bash
   cd packages/mobile
   npm start
   ```

3. **Run on device**
   - Install Expo Go on your iOS/Android device
   - Scan the QR code from the terminal

## 🔑 API Endpoints

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

## 🎯 User Flows

### 1. Non-Coder: Building a Customer Support Agent

1. Sign up with Google/GitHub/Email
2. Select "Customer Support" template
3. Add tools (Email, FAQ, Slack)
4. Test in live preview chat
5. Deploy with one click
6. Embed on website via iframe

**Goal**: Create and deploy in under 90 seconds

### 2. Developer: Clone and Customize Marketplace Agent

1. Browse marketplace
2. Clone "Lead Qualifier" agent
3. Customize prompt and tools
4. Test with client scenarios
5. Publish to marketplace with pricing
6. Earn revenue from subscriptions

**Goal**: Clone, customize, and publish in under 15 minutes

## 🧪 Testing

Run tests for each package:

```bash
# All tests
npm test

# Backend tests
npm test --workspace=packages/backend

# Web tests
npm test --workspace=packages/web
```

## 📊 Database Schema

The platform uses PostgreSQL with the following main tables:

- `users` - User accounts (synced with Clerk)
- `agents` - AI agent configurations
- `tools` - Available tools for agents
- `agent_tools` - Agent-tool associations
- `executions` - Execution records
- `execution_logs` - Step-by-step execution logs (ReAct)
- `marketplace_listings` - Marketplace agent listings
- `subscriptions` - User subscriptions to marketplace agents
- `usage_tracking` - Token usage and costs

## 🔐 Security

- Clerk OAuth for authentication
- JWT tokens for API access
- Rate limiting on API endpoints
- SQL injection prevention with parameterized queries
- Environment variable management for secrets
- CORS configuration for cross-origin requests

## 🚢 Deployment

### Docker Production Build

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes

Ready for deployment on:
- AWS EKS
- Google Cloud GKE
- Azure AKS

See `k8s/` directory for Kubernetes manifests (to be added).

## 📈 Monitoring & Logging

- Winston logger for backend
- Structured JSON logging
- Execution tracking with detailed steps
- Cost tracking per execution
- Usage analytics per user

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add some feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a pull request

## 📝 License

This project is licensed under the MIT License.

## 🔗 Resources

### Best Practices Research (2025)

This platform was built following 2025 best practices for AI agent architectures:

- **ReAct Pattern**: Implements Reasoning → Action → Observation loops for autonomous problem-solving
- **Iteration Limits**: Maximum iteration safeguards to prevent infinite loops
- **Execution Timeouts**: Timeout protection for long-running executions
- **Stateful Workflows**: Support for complex multi-step agent workflows
- **Cost Optimization**: Token usage tracking and cost calculation per execution
- **Error Handling**: Comprehensive error handling and graceful degradation
- **Observability**: Detailed logging and execution step tracking

Sources:
- [LangChain ReAct Agent: Complete Implementation Guide 2025](https://latenode.com/blog/ai-frameworks-technical-infrastructure/langchain-setup-tools-agents-memory/langchain-react-agent-complete-implementation-guide-working-examples-2025)
- [The ultimate guide to AI agent architectures in 2025](https://dev.to/sohail-akbar/the-ultimate-guide-to-ai-agent-architectures-in-2025-2j1c)
- [How to Build AI Agents (Complete 2025 Guide)](https://superprompt.com/blog/how-to-build-ai-agents-2025-guide)

## 📞 Support

For issues and questions:
- Create an issue in the GitHub repository
- Email: support@prototype.cafe
- Documentation: https://docs.prototype.cafe

---

Built with ❤️ by the Prototype.Cafe team