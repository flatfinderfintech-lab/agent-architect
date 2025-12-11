.PHONY: dev dev-web dev-backend install build clean help
.PHONY: db-migration-new db-apply db-list db-push db-status db-link

# Default target
.DEFAULT_GOAL := help

# Colors for terminal output
GREEN=\033[0;32m
YELLOW=\033[0;33m
RED=\033[0;31m
CYAN=\033[0;36m
NC=\033[0m # No Color

# Development
dev: ## Start full development environment (frontend + backend)
	@echo "${GREEN}Starting Agent Architect development environment...${NC}"
	npm run dev

dev-web: ## Start only the web frontend (Next.js)
	@echo "${GREEN}Starting frontend development server...${NC}"
	npm run dev:web

dev-backend: ## Start only the backend API (Express)
	@echo "${GREEN}Starting backend development server...${NC}"
	npm run dev:backend

# Installation
install: ## Install all dependencies
	@echo "${GREEN}Installing dependencies...${NC}"
	npm install --legacy-peer-deps

install-web: ## Install frontend dependencies only
	@echo "${GREEN}Installing frontend dependencies...${NC}"
	cd packages/web && npm install

install-backend: ## Install backend dependencies only
	@echo "${GREEN}Installing backend dependencies...${NC}"
	cd packages/backend && npm install

# Build
build: ## Build all packages for production
	@echo "${GREEN}Building all packages...${NC}"
	npm run build

build-web: ## Build frontend for production
	@echo "${GREEN}Building frontend...${NC}"
	npm run build --workspace=packages/web

build-backend: ## Build backend for production
	@echo "${GREEN}Building backend...${NC}"
	npm run build --workspace=packages/backend

# Database migrations (Supabase)
db-link: ## Link to your Supabase project
	@echo "${CYAN}Linking to Supabase project...${NC}"
	@echo "${YELLOW}You'll need your project ref from Supabase dashboard${NC}"
	supabase link

db-migration-new: ## Create a new migration file (Usage: make db-migration-new name=create_agents_table)
	@echo "${GREEN}Creating new migration: $(name)${NC}"
	@if [ -z "$(name)" ]; then \
		echo "${RED}Error: Please provide a migration name${NC}"; \
		echo "Usage: make db-migration-new name=create_agents_table"; \
		exit 1; \
	fi
	supabase migration new $(name)

db-apply: ## Apply pending migrations to remote Supabase database
	@echo "${GREEN}Applying migrations to Supabase...${NC}"
	supabase db push

db-push: ## Push migrations to Supabase (same as db-apply)
	@echo "${GREEN}Pushing migrations to Supabase...${NC}"
	supabase db push

db-list: ## List all applied migrations
	@echo "${GREEN}Listing applied migrations...${NC}"
	supabase migration list

db-status: ## Show migration status
	@echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
	@echo "${YELLOW}Migration status:${NC}"
	@supabase migration list || echo "${RED}  Not linked to Supabase. Run 'make db-link' first${NC}"
	@echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
	@echo "${YELLOW}Migration files in project:${NC}"
	@ls -1 supabase/migrations/*.sql 2>/dev/null | sed 's/.*\//  /' || echo "${RED}  None${NC}"

db-seed: ## Run database seed file
	@echo "${GREEN}Seeding database...${NC}"
	supabase db seed

# Docker
docker-up: ## Start Docker services
	@echo "${GREEN}Starting Docker services...${NC}"
	docker-compose up -d

docker-down: ## Stop Docker services
	@echo "${YELLOW}Stopping Docker services...${NC}"
	docker-compose down

# Clean
clean: ## Remove node_modules and build artifacts
	@echo "${YELLOW}Cleaning up...${NC}"
	rm -rf node_modules
	rm -rf packages/*/node_modules
	rm -rf packages/*/.next
	rm -rf packages/*/dist
	@echo "${GREEN}Cleanup complete!${NC}"

# Setup
setup: ## Run first-time setup script
	@echo "${CYAN}Running first-time setup...${NC}"
	./first-time.sh

# Vercel
vercel-dev: ## Start Vercel development server
	@echo "${GREEN}Starting Vercel development server...${NC}"
	vercel dev

vercel-deploy: ## Deploy to Vercel (production)
	@echo "${GREEN}Deploying to Vercel...${NC}"
	vercel --prod

vercel-preview: ## Deploy preview to Vercel
	@echo "${GREEN}Creating Vercel preview deployment...${NC}"
	vercel

# Help
help: ## Show this help message
	@echo "${CYAN}Agent Architect - Available Commands${NC}"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  ${GREEN}%-20s${NC} %s\n", $$1, $$2}'
	@echo ""
	@echo "${YELLOW}Quick Start:${NC}"
	@echo "  1. Run: ${GREEN}make setup${NC}        (First time only)"
	@echo "  2. Run: ${GREEN}make install${NC}      (Install dependencies)"
	@echo "  3. Run: ${GREEN}make db-link${NC}      (Link to Supabase)"
	@echo "  4. Run: ${GREEN}make db-apply${NC}     (Apply migrations)"
	@echo "  5. Run: ${GREEN}make dev${NC}          (Start development)"
