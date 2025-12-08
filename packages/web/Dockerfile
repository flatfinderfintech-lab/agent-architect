FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY packages/web/package*.json ./packages/web/

# Install dependencies
RUN npm install

# Copy web source
COPY packages/web ./packages/web

WORKDIR /app/packages/web

EXPOSE 3000

CMD ["npm", "run", "dev"]
