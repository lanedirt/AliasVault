#!/bin/sh

# Define colors for CLI output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Define the path to the .env and .env.example files
ENV_FILE=".env"
ENV_EXAMPLE_FILE=".env.example"

# Function to generate a new 32-character JWT key
generate_jwt_key() {
  dd if=/dev/urandom bs=1 count=32 2>/dev/null | base64 | head -c 32
}

# Function to create .env file from .env.example if it doesn't exist
create_env_file() {
  if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$ENV_EXAMPLE_FILE" ]; then
      cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
      echo "${GREEN}> .env file created from .env.example.${NC}"
    else
      touch "$ENV_FILE"
      echo "${YELLOW}> .env file created as empty because .env.example was not found.${NC}"
    fi
  else
    echo "${CYAN}> .env file already exists.${NC}"
  fi
}

# Function to check and populate the .env file with JWT_KEY
populate_jwt_key() {
  if ! grep -q "^JWT_KEY=" "$ENV_FILE" || [ -z "$(grep "^JWT_KEY=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
    echo "${YELLOW}JWT_KEY not found or empty in $ENV_FILE. Generating a new JWT key...${NC}"
    JWT_KEY=$(generate_jwt_key)
    if grep -q "^JWT_KEY=" "$ENV_FILE"; then
      awk -v key="$JWT_KEY" '/^JWT_KEY=/ {$0="JWT_KEY="key} 1' "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    else
      echo "JWT_KEY=${JWT_KEY}" >> "$ENV_FILE"
    fi
    echo "${GREEN}> JWT_KEY has been added to $ENV_FILE.${NC}"
  else
    echo "${CYAN}> JWT_KEY already exists and has a value in $ENV_FILE.${NC}"
  fi
}

# Function to print the CLI logo
print_logo() {
  echo "${MAGENTA}"
  echo "========================================================="
  echo "           _ _        __      __         _ _   "
  echo "     /\   | (_)       \ \    / /        | | |  "
  echo "    /  \  | |_  __ _ __\ \  / /_ _ _   _| | |_"
  echo "   / /\ \ | | |/ _  / __\ \/ / _  | | | | | __|"
  echo "  / ____ \| | | (_| \__ \\   / (_| | |_| | | |_ "
  echo " /_/    \_\_|_|\__,_|___/ \/ \__,_|\__,_|_|\__|"
  echo ""
  echo "========================================================="
  echo "${NC}"
}

# Run the functions and print status
print_logo
echo "${BLUE}Initializing AliasVault...${NC}"
create_env_file
populate_jwt_key
echo "${BLUE}Initialization complete.${NC}"
echo ""
echo "To build the images and start the containers, run the following command:"
echo ""
echo "${CYAN}$ docker compose up -d --build --force-recreate${NC}"
echo ""
echo ""
