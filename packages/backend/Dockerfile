FROM node:20-alpine

# Create non-root user for security
RUN adduser -S -D -H -h /app appuser

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/

# Install dependencies
RUN npm install

# Copy backend source
COPY packages/backend ./packages/backend

# Set ownership to non-root user
RUN chown -R appuser /app

WORKDIR /app/packages/backend

# Switch to non-root user
USER appuser

EXPOSE 3001

CMD ["npm", "run", "dev"]
