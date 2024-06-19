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
      printf "${GREEN}> .env file created from .env.example.${NC}\n"
    else
      touch "$ENV_FILE"
      printf "${YELLOW}> .env file created as empty because .env.example was not found.${NC}\n"
    fi
  else
    printf "${CYAN}> .env file already exists.${NC}\n"
  fi
}

# Function to check and populate the .env file with JWT_KEY
populate_jwt_key() {
  if ! grep -q "^JWT_KEY=" "$ENV_FILE" || [ -z "$(grep "^JWT_KEY=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
    printf "${YELLOW}JWT_KEY not found or empty in $ENV_FILE. Generating a new JWT key...${NC}\n"
    JWT_KEY=$(generate_jwt_key)
    if grep -q "^JWT_KEY=" "$ENV_FILE"; then
      awk -v key="$JWT_KEY" '/^JWT_KEY=/ {$0="JWT_KEY="key} 1' "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    else
      printf "JWT_KEY=${JWT_KEY}" >> "$ENV_FILE\n"
    fi
    printf "${GREEN}> JWT_KEY has been added to $ENV_FILE.${NC}\n"
  else
    printf "${CYAN}> JWT_KEY already exists and has a value in $ENV_FILE.${NC}\n"
  fi
}

# Function to print the CLI logo
print_logo() {
  printf "${MAGENTA}\n"
  printf "=========================================================\n"
  printf "           _ _        __      __         _ _   \n"
  printf "     /\   | (_)       \ \    / /        | | |  \n"
  printf "    /  \  | |_  __ _ __\ \  / /_ _ _   _| | |_\n"
  printf "   / /\ \ | | |/ _  / __\ \/ / _  | | | | | __|\n"
  printf "  / ____ \| | | (_| \__ \\   / (_| | |_| | | |_ \n"
  printf " /_/    \_\_|_|\__,_|___/ \/ \__,_|\__,_|_|\__|\n"
  printf "\n"
  printf "=========================================================\n"
  printf "${NC}\n"
}

# Run the functions and print status
print_logo
printf "${BLUE}Initializing AliasVault...${NC}\n"
create_env_file
populate_jwt_key
printf "${BLUE}Initialization complete.${NC}\n"
printf "\n"
printf "To build the images and start the containers, run the following command:\n"
printf "\n"
printf "${CYAN}$ docker compose up -d --build --force-recreate${NC}\n"
printf "\n"
printf "\n"
