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

# Define verbose flag
VERBOSE=false

# Function to parse command-line arguments
parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --verbose)
        VERBOSE=true
        ;;
      *)
        printf "${RED}Unknown argument: $1${NC}\n"
        exit 1
        ;;
    esac
    shift
  done
}

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

# Function to ask the user for SMTP_ALLOWED_DOMAINS
set_smtp_allowed_domains() {
  if ! grep -q "^SMTP_ALLOWED_DOMAINS=" "$ENV_FILE" || [ -z "$(grep "^SMTP_ALLOWED_DOMAINS=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
    printf "${YELLOW}Please enter the domains that should be allowed to send email, separated by commas:${NC}\n"
    read -r smtp_allowed_domains
    if grep -q "^SMTP_ALLOWED_DOMAINS=" "$ENV_FILE"; then
      awk -v domains="$smtp_allowed_domains" '/^SMTP_ALLOWED_DOMAINS=/ {$0="SMTP_ALLOWED_DOMAINS="domains} 1' "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    else
      printf "SMTP_ALLOWED_DOMAINS=${smtp_allowed_domains}\n" >> "$ENV_FILE"
    fi
    printf "${GREEN}> SMTP_ALLOWED_DOMAINS has been set in $ENV_FILE.${NC}\n"
  else
    printf "${CYAN}> SMTP_ALLOWED_DOMAINS already exists and has a value in $ENV_FILE.${NC}\n"
  fi
}

# Function to ask the user if TLS should be enabled for email
set_smtp_tls_enabled() {
  if ! grep -q "^SMTP_TLS_ENABLED=" "$ENV_FILE" || [ -z "$(grep "^SMTP_TLS_ENABLED=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
    printf "${YELLOW}Do you want TLS enabled for email? (yes/no):${NC}\n"
    read -r tls_enabled
    tls_enabled=$(echo "$tls_enabled" | tr '[:upper:]' '[:lower:]')
    if [ "$tls_enabled" = "yes" ] || [ "$tls_enabled" = "y" ]; then
      tls_enabled="true"
    else
      tls_enabled="false"
    fi
    if grep -q "^SMTP_TLS_ENABLED=" "$ENV_FILE"; then
      awk -v tls="$tls_enabled" '/^SMTP_TLS_ENABLED=/ {$0="SMTP_TLS_ENABLED="tls} 1' "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    else
      printf "SMTP_TLS_ENABLED=${tls_enabled}\n" >> "$ENV_FILE"
    fi
    printf "${GREEN}> SMTP_TLS_ENABLED has been set to ${tls_enabled} in $ENV_FILE.${NC}\n"
  else
    printf "${CYAN}> SMTP_TLS_ENABLED already exists and has a value in $ENV_FILE.${NC}\n"
  fi
}

# Function to generate a random admin password and store its hash in the .env file with progress indication
generate_admin_password() {
  if grep -q "^ADMIN_PASSWORD_HASH=" ".env"; then
    ADMIN_PASSWORD_GENERATED=$(grep "^ADMIN_PASSWORD_GENERATED=" ".env" | cut -d '=' -f2)

    printf "${CYAN}> ADMIN_PASSWORD_HASH already exists in .env. Last generated at ${ADMIN_PASSWORD_GENERATED}.${NC}\n"

    printf "\n"
    read -p "   Do you want to update the admin password? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
      printf "${CYAN}> Admin password will not be changed.${NC}\n"
      return 0
    fi

    # Remove existing entries
    sed -i '' '/^ADMIN_PASSWORD_HASH=/d' .env
    sed -i '' '/^ADMIN_PASSWORD_GENERATED=/d' .env
  fi

  ADMIN_PASSWORD=$(openssl rand -base64 12)
  printf "\n"
  printf "${BLUE}   Building Docker image for password generation...${NC}\n   "
  if [ "$VERBOSE" = true ]; then
    docker build -t initcli -f src/Utilities/InitializationCLI/Dockerfile .
  else
    {
      docker build -t initcli -f src/Utilities/InitializationCLI/Dockerfile . | while IFS= read -r line; do
        printf "."
      done
    } > init_build_output.log 2>&1 &
    BUILD_PID=$!
    while kill -0 $BUILD_PID 2> /dev/null; do
      printf "."
      sleep 1
    done
    wait $BUILD_PID
    BUILD_EXIT_CODE=$?
    if [ $BUILD_EXIT_CODE -ne 0 ]; then
      printf "\n${RED}  Error occurred while building Docker image:${NC}\n"
      cat init_build_output.log
      return 1
    fi
  fi

  printf "\n"
  printf "${BLUE}   Running Docker container to generate admin password hash...${NC}\n"
  {
    ADMIN_PASSWORD_HASH=$(docker run --rm initcli "$ADMIN_PASSWORD")
  } &> init_run_output.log
  if [ $? -ne 0 ]; then
    printf "${RED}  Error occurred while running Docker container:${NC}\n"
    cat init_run_output.log
    return 1
  fi

  CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Append new entries
  echo "ADMIN_PASSWORD_HASH=$ADMIN_PASSWORD_HASH" >> .env
  echo "ADMIN_PASSWORD_GENERATED=$CURRENT_TIME" >> .env

  printf "\n"
  printf "${CYAN}> New admin password generated successfully.${NC}\n"
}

# Function to build and run the Docker Compose stack with muted output unless an error occurs, showing progress indication
build_and_run_docker_compose() {
  printf "\n"
  printf "${BLUE}Building Docker Compose stack...${NC}\n"
  if [ "$VERBOSE" = true ]; then
    docker-compose build
  else
    {
      docker-compose build | while IFS= read -r line; do
        printf "."
      done
    } > compose_build_output.log 2>&1 &
    BUILD_PID=$!
    while kill -0 $BUILD_PID 2> /dev/null; do
      printf "."
      sleep 1
    done
    wait $BUILD_PID
    BUILD_EXIT_CODE=$?
    if [ $BUILD_EXIT_CODE -ne 0 ]; then
      printf "\n${RED}Error occurred while building Docker Compose stack:${NC}\n"
      cat compose_build_output.log
      return 1
    fi
  fi

  printf "\n"
  printf "\n${BLUE}Starting Docker Compose stack...${NC}\n"
  if [ "$VERBOSE" = true ]; then
    docker-compose up -d
  else
    {
      docker-compose up -d | while IFS= read -r line; do
        printf "."
      done
    } > compose_up_output.log 2>&1 &
    UP_PID=$!
    while kill -0 $UP_PID 2> /dev/null; do
      printf "."
      sleep 1
    done
    wait $UP_PID
    UP_EXIT_CODE=$?
    if [ $UP_EXIT_CODE -ne 0 ]; then
      printf "\n${RED}Error occurred while starting Docker Compose stack:${NC}\n"
      cat compose_up_output.log
      return 1
    fi
  fi

  printf "\n${GREEN}Docker Compose stack built and started successfully.${NC}\n"
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

# Parse arguments
parse_args "$@"

# Run the functions and print status
print_logo
printf "${BLUE}+++ Initializing .env file...${NC}\n"
printf "\n"
create_env_file
populate_jwt_key
set_smtp_allowed_domains
set_smtp_tls_enabled
generate_admin_password
printf "\n${BLUE}+++ Finish initializing .env file...${NC}\n"
build_and_run_docker_compose
printf "${BLUE}If no errors are reported, the AliasVault Docker containers should have started successfully.${NC}\n"
printf "\n"
printf "${MAGENTA}=========================================================${NC}\n"
printf "\n"
printf "AliasVault is successfully initialized!\n"
printf "\n"
printf "You can now login to the admin panel:\n"
printf "\n"
if [ "$ADMIN_PASSWORD" != "" ]; then
  printf "${CYAN}Admin Panel: http://localhost:8080/${NC}\n"
  printf "${CYAN}Username: admin${NC}\n"
  printf "${CYAN}Password: $ADMIN_PASSWORD${NC}\n"
  printf "\n"
  printf "(!) Caution: Make sure to backup the above credentials in a safe place, they won't be shown again!\n"
  printf "\n"
else
  printf "${CYAN}Admin Panel: http://localhost:8080/${NC}\n"
  printf "${CYAN}Username: admin${NC}\n"
  printf "${CYAN}Password: (Previously set.)${NC}\n"
  printf "\n"
  printf "\n"
fi

