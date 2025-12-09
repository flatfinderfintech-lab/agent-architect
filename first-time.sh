#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print a styled message
print_message() {
  echo -e "${GREEN}==>${NC} $1"
}

# Print a section header
print_header() {
  echo -e "\n${BLUE}===== $1 =====${NC}\n"
}

# Print a warning
print_warning() {
  echo -e "${YELLOW}Warning:${NC} $1"
}

# Print an error
print_error() {
  echo -e "${RED}Error:${NC} $1"
}

# Ask yes/no question
ask_yes_no() {
  while true; do
    read -p "$1 (y/n): " yn
    case $yn in
      [Yy]* ) return 0;;
      [Nn]* ) return 1;;
      * ) echo "Please answer y or n.";;
    esac
  done
}

# Ask for API key
ask_for_key() {
  local key_name=$1
  local skip_option=$2
  local default_value=$3

  if [ "$skip_option" = true ]; then
    if ask_yes_no "Do you want to provide a $key_name API key?"; then
      read -p "Enter your $key_name API key: " api_key
      echo "$api_key"
    else
      echo "$default_value"
    fi
  else
    read -p "Enter your $key_name API key: " api_key
    if [ -z "$api_key" ]; then
      echo "$default_value"
    else
      echo "$api_key"
    fi
  fi
}

clear
echo -e "${CYAN}"
cat << "EOF"
     _                    _      _             _     _ _            _
    / \   __ _  ___ _ __ | |_   / \   _ __ ___| |__ (_) |_ ___  ___| |_
   / _ \ / _` |/ _ \ '_ \| __| / _ \ | '__/ __| '_ \| | __/ _ \/ __| __|
  / ___ \ (_| |  __/ | | | |_ / ___ \| | | (__| | | | | ||  __/ (__| |_
 /_/   \_\__, |\___|_| |_|\__/_/   \_\_|  \___|_| |_|_|\__\___|\___|\__|
         |___/

EOF
echo -e "${NC}"

print_header "Welcome to Agent Architect Setup"

print_message "This script will help you set up your Agent Architect platform with Supabase."
print_message "We'll generate the necessary environment files for Vercel deployment."
echo

# Check for required tools
print_header "Checking Prerequisites"

# Check for Node.js
if ! command -v node &> /dev/null; then
  print_warning "Node.js not found. Please install Node.js 20+ from https://nodejs.org/"
else
  node_version=$(node -v)
  print_message "Node.js is installed (${node_version})."
fi

# Check for npm
if ! command -v npm &> /dev/null; then
  print_warning "npm not found."
else
  npm_version=$(npm -v)
  print_message "npm is installed (${npm_version})."
fi

# Check for Supabase CLI (optional)
if ! command -v supabase &> /dev/null; then
  print_warning "Supabase CLI not found. You'll need it for database migrations."
  print_message "Install with: brew install supabase/tap/supabase"
  print_message "Or see: https://supabase.com/docs/guides/cli"
else
  print_message "Supabase CLI is installed."
fi

# Set up Supabase
print_header "Supabase Configuration"
print_message "Supabase provides authentication, database, and storage for Agent Architect."
print_message "Visit https://supabase.com/ to create a free project."

if ask_yes_no "Do you have a Supabase project?"; then
  read -p "Enter your Supabase URL: " supabase_url
  read -p "Enter your Supabase anon key: " supabase_anon_key
  read -p "Enter your Supabase service key: " supabase_service_key
else
  print_message "Skipping Supabase configuration. You can update the .env files later."
  supabase_url="https://your-project.supabase.co"
  supabase_anon_key="your-anon-key"
  supabase_service_key="your-service-key"
fi

# Set up LLM keys
print_header "AI Configuration"
print_message "Agent Architect supports Anthropic Claude and OpenAI models."

anthropic_api_key=$(ask_for_key "Anthropic (Claude)" false "sk-ant-your-anthropic-key")
openai_api_key=$(ask_for_key "OpenAI" true "sk-your-openai-key")

# Generate .env file
print_header "Generating Environment Files"

# Create root .env file
cat > .env << EOF
# Supabase configuration
SUPABASE_URL=${supabase_url}
SUPABASE_ANON_KEY=${supabase_anon_key}
SUPABASE_SERVICE_KEY=${supabase_service_key}

# AI Configuration
ANTHROPIC_API_KEY=${anthropic_api_key}
OPENAI_API_KEY=${openai_api_key}

# Application configuration
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000
EOF

# Create backend .env
cat > packages/backend/.env << EOF
# Supabase configuration
SUPABASE_URL=${supabase_url}
SUPABASE_ANON_KEY=${supabase_anon_key}
SUPABASE_SERVICE_KEY=${supabase_service_key}

# AI Configuration
ANTHROPIC_API_KEY=${anthropic_api_key}
OPENAI_API_KEY=${openai_api_key}

# Backend configuration
PORT=3001
NODE_ENV=development
WEB_URL=http://localhost:3000
EOF

# Create web frontend .env
cat > packages/web/.env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=${supabase_url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabase_anon_key}
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

print_message "Environment files generated successfully!"
print_message "✓ .env - Root environment file"
print_message "✓ packages/backend/.env - Backend environment"
print_message "✓ packages/web/.env.local - Frontend environment"

# Database migrations information
print_header "Database Migrations"
print_message "To set up your database schema:"
echo
echo "1. Link to your Supabase project:"
echo -e "   ${GREEN}supabase login${NC}"
echo -e "   ${GREEN}supabase link --project-ref YOUR_PROJECT_REF${NC}"
echo
echo "2. Apply migrations:"
echo -e "   ${GREEN}supabase db push${NC}"
echo
echo "3. (Optional) Seed initial data:"
echo -e "   ${GREEN}supabase db seed${NC}"
echo

# Installation instructions
print_header "Install Dependencies"
print_message "Install all project dependencies:"
echo -e "   ${GREEN}npm install${NC}"
echo

# Development instructions
print_header "Development"
print_message "Start the development servers:"
echo -e "   ${GREEN}npm run dev${NC}              ${YELLOW}# Start both frontend and backend${NC}"
echo -e "   ${GREEN}npm run dev:web${NC}          ${YELLOW}# Frontend only (localhost:3000)${NC}"
echo -e "   ${GREEN}npm run dev:backend${NC}      ${YELLOW}# Backend only (localhost:3001)${NC}"
echo

# Vercel deployment instructions
print_header "Vercel Deployment"
print_message "To deploy to Vercel:"
echo
echo "1. Push your changes to GitHub"
echo "2. Import your repository in Vercel"
echo "3. Add environment variables in Vercel dashboard:"
echo -e "   ${YELLOW}SUPABASE_URL${NC}"
echo -e "   ${YELLOW}SUPABASE_ANON_KEY${NC}"
echo -e "   ${YELLOW}SUPABASE_SERVICE_KEY${NC}"
echo -e "   ${YELLOW}ANTHROPIC_API_KEY${NC}"
echo -e "   ${YELLOW}OPENAI_API_KEY${NC}"
echo "4. Deploy!"
echo
print_message "See DEPLOYMENT.md for detailed deployment instructions."

# Final message
echo -e "${CYAN}"
cat << "EOF"
  ____                _       _
 |  _ \ ___  __ _  __| |_   _| |
 | |_) / _ \/ _` |/ _` | | | | |
 |  _ <  __/ (_| | (_| | |_| |_|
 |_| \_\___|\__,_|\__,_|\__, (_)
                        |___/

EOF
echo -e "${NC}"

echo "Setup complete! Happy building! 🚀"
echo
