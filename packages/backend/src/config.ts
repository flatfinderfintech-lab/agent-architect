import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.API_PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/agent_architect',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  clerk: {
    secretKey: process.env.CLERK_SECRET_KEY || '',
  },

  llm: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || '',
  },

  execution: {
    maxIterations: 10,
    timeoutSeconds: 300,
    defaultModel: 'gpt-4-turbo-preview',
  },
};
