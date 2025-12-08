import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './utils/logger';
import { clerkMiddleware, authenticateUser } from './auth/middleware';
import agentsRouter from './agents/routes';
import executionsRouter from './execution/routes';
import toolsRouter from './tools/routes';
import marketplaceRouter from './marketplace/routes';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.WEB_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
  });
  next();
});

// Clerk authentication
if (config.clerk.secretKey) {
  app.use(clerkMiddleware);
  app.use(authenticateUser);
} else {
  logger.warn('Clerk secret key not configured - authentication disabled');
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
app.use('/api/agents', agentsRouter);
app.use('/api/executions', executionsRouter);
app.use('/api/tools', toolsRouter);
app.use('/api/marketplace', marketplaceRouter);

// WebSocket for real-time execution updates
io.on('connection', (socket) => {
  logger.info('Client connected to WebSocket', { socketId: socket.id });

  socket.on('subscribe_execution', (executionId: string) => {
    socket.join(`execution:${executionId}`);
    logger.debug('Client subscribed to execution', { socketId: socket.id, executionId });
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected from WebSocket', { socketId: socket.id });
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const start = async () => {
  try {
    server.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📊 Health check: http://localhost:${config.port}/health`);
      logger.info(`🔌 WebSocket server ready`);
      logger.info(`📝 API documentation: http://localhost:${config.port}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

export { app, io };
