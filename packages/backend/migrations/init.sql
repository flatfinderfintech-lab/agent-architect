-- Agent Architect Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced with Clerk)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    autonomy_level VARCHAR(50) DEFAULT 'supervised',
    model VARCHAR(100) DEFAULT 'gpt-4-turbo-preview',
    max_iterations INTEGER DEFAULT 10,
    timeout_seconds INTEGER DEFAULT 300,
    is_public BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    parent_agent_id UUID REFERENCES agents(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tools table
CREATE TABLE tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_official BOOLEAN DEFAULT FALSE,
    schema JSONB NOT NULL,
    implementation_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent-Tool associations
CREATE TABLE agent_tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    configuration JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent_id, tool_id)
);

-- Executions table
CREATE TABLE executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    output TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    iterations INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0,
    execution_time_ms INTEGER,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Execution logs table
CREATE TABLE execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL,
    reasoning TEXT,
    action JSONB,
    observation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace listings table
CREATE TABLE marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    pricing_model VARCHAR(50) DEFAULT 'subscription',
    price_monthly DECIMAL(10, 2),
    revenue_share DECIMAL(5, 2) DEFAULT 70.00,
    total_subscriptions INTEGER DEFAULT 0,
    total_revenue DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    UNIQUE(user_id, listing_id)
);

-- API Keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage tracking table
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    execution_id UUID REFERENCES executions(id) ON DELETE CASCADE,
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_published ON agents(is_published) WHERE is_published = TRUE;
CREATE INDEX idx_executions_agent_id ON executions(agent_id);
CREATE INDEX idx_executions_user_id ON executions(user_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_execution_logs_execution_id ON execution_logs(execution_id);
CREATE INDEX idx_marketplace_listings_creator_id ON marketplace_listings(creator_id);
CREATE INDEX idx_marketplace_listings_active ON marketplace_listings(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_listing_id ON subscriptions(listing_id);
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);

-- Insert official tools
INSERT INTO tools (name, description, category, is_official, schema) VALUES
('web_search', 'Search the web for information using Perplexity API', 'search', TRUE, '{"type": "function", "function": {"name": "web_search", "parameters": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}}}'),
('send_email', 'Send emails to recipients', 'communication', TRUE, '{"type": "function", "function": {"name": "send_email", "parameters": {"type": "object", "properties": {"to": {"type": "string"}, "subject": {"type": "string"}, "body": {"type": "string"}}, "required": ["to", "subject", "body"]}}}'),
('database_query', 'Execute SQL queries on connected databases', 'data', TRUE, '{"type": "function", "function": {"name": "database_query", "parameters": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}}}'),
('http_request', 'Make HTTP requests to external APIs', 'integration', TRUE, '{"type": "function", "function": {"name": "http_request", "parameters": {"type": "object", "properties": {"method": {"type": "string"}, "url": {"type": "string"}, "headers": {"type": "object"}, "body": {"type": "object"}}, "required": ["method", "url"]}}}'),
('slack_notify', 'Send notifications to Slack channels', 'communication', TRUE, '{"type": "function", "function": {"name": "slack_notify", "parameters": {"type": "object", "properties": {"channel": {"type": "string"}, "message": {"type": "string"}}, "required": ["channel", "message"]}}}');
