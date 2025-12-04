FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/

# Install dependencies
RUN npm install

# Copy backend source
COPY packages/backend ./packages/backend

WORKDIR /app/packages/backend

EXPOSE 3001

CMD ["npm", "run", "dev"]
