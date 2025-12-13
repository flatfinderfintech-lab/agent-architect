FROM node:20-alpine

# Create non-root user for security
RUN adduser -S -D -H -h /app appuser

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY packages/web/package*.json ./packages/web/

# Install dependencies
RUN npm install

# Copy web source
COPY packages/web ./packages/web

# Set ownership to non-root user
RUN chown -R appuser /app

WORKDIR /app/packages/web

# Switch to non-root user
USER appuser

EXPOSE 3000

CMD ["npm", "run", "dev"]
