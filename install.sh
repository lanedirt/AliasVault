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

# Define verbose flag and reset password flag
VERBOSE=false
RESET_PASSWORD=false

# Function to parse command-line arguments
parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --verbose)
        VERBOSE=true
        ;;
      --reset-password)
        RESET_PASSWORD=true
        ;;
      *)
        printf "${RED}Unknown argument: $1${NC}\n"
        exit 1
        ;;
    esac
    shift
  done
}

# Function to generate a random admin password and store its hash in the .env file
generate_admin_password() {
    if grep -q "^ADMIN_PASSWORD_HASH=" ".env" && [ "$RESET_PASSWORD" = false ]; then
        printf "${CYAN}> Checking admin password...${NC}\n"
        printf "${GREEN}> ADMIN_PASSWORD_HASH already exists in .env. Use --reset-password to generate a new one.${NC}\n"
        return 0
    fi

    printf "${CYAN}> Generating new admin password...${NC}\n"

    ADMIN_PASSWORD=$(openssl rand -base64 12)
    printf "${CYAN}> Building Docker image for password generation...${NC}"

    if [ "$VERBOSE" = true ]; then
      printf "\n"
      docker build -t initcli -f src/Utilities/InitializationCLI/Dockerfile .
    else
    (
        # Run docker build and capture its output
        docker build -t initcli -f src/Utilities/InitializationCLI/Dockerfile . > install_build_output.log 2>&1 &
        BUILD_PID=$!

        printf "${CYAN}"

        # Print dots while the build is running
        while kill -0 $BUILD_PID 2>/dev/null; do
          printf "."
          sleep 1
        done

        printf "${NC}\n"

        # Wait for the build to finish and capture its exit code
        wait $BUILD_PID
        BUILD_EXIT_CODE=$?

        # If there was an error, display it
        if [ $BUILD_EXIT_CODE -ne 0 ]; then
          printf "\n${RED}  An error occurred while building the Docker image for password generation. Check the output above.${NC}\n"
          printf "\n"
          cat install_build_output.log
          exit $BUILD_EXIT_CODE
        fi
    )
    fi

    printf "${GREEN}> Docker image built successfully.${NC}\n"

    printf "${CYAN}> Running Docker container to generate admin password hash...${NC}\n"

    # Run the Docker container to generate the password hash
    ADMIN_PASSWORD_HASH=$(docker run --rm initcli "$ADMIN_PASSWORD" 2> install_run_output.log)
    RUN_EXIT_CODE=$?

    if [ $RUN_EXIT_CODE -ne 0 ]; then
      printf "${RED}> Error occurred while running the Docker container. Check install_run_output.log for details.${NC}\n"
      return $RUN_EXIT_CODE
    fi

    # Remove existing ADMIN_PASSWORD_HASH and ADMIN_PASSWORD_GENERATED if it exists
    sed -i '' '/^ADMIN_PASSWORD_HASH=/d' .env
    sed -i '' '/^ADMIN_PASSWORD_GENERATED=/d' .env

    # Append new entries
    echo "ADMIN_PASSWORD_HASH=$ADMIN_PASSWORD_HASH" >> .env
    echo "ADMIN_PASSWORD_GENERATED=$(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> .env

    printf "${GREEN}> New admin password generated and hash stored in .env${NC}\n"
}

# Function to restart Docker containers
restart_docker_containers() {
    printf "${CYAN}> Restarting Docker containers...${NC}\n"
    docker compose down
    docker compose up -d
    printf "${GREEN}> Docker containers restarted successfully.${NC}\n"
}

# Function to generate a new 32-character JWT key
generate_jwt_key() {
  dd if=/dev/urandom bs=1 count=32 2>/dev/null | base64 | head -c 32
}

# Function to generate a new 60-character DATA_PROTECTION_CERT_PASS
generate_data_protection_cert_pass() {
  dd if=/dev/urandom bs=1 count=60 2>/dev/null | base64 | head -c 60
}

# Function to create .env file from .env.example if it doesn't exist
create_env_file() {
  printf "${CYAN}> Creating .env file...${NC}\n"
  if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$ENV_EXAMPLE_FILE" ]; then
      cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
      printf "${GREEN}> .env file created from .env.example.${NC}\n"
    else
      touch "$ENV_FILE"
      printf "${YELLOW}> .env file created as empty because .env.example was not found.${NC}\n"
    fi
  else
    printf "${GREEN}> .env file already exists.${NC}\n"
  fi
}

# Function to check and populate the .env file with API_URL
populate_api_url() {
  printf "${CYAN}> Checking API_URL...${NC}\n"
  if ! grep -q "^API_URL=" "$ENV_FILE" || [ -z "$(grep "^API_URL=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
    DEFAULT_API_URL="http://localhost:81"
    read -p "Enter the base URL where the API will be hosted (press Enter for default: $DEFAULT_API_URL): " USER_API_URL
    API_URL=${USER_API_URL:-$DEFAULT_API_URL}
    if grep -q "^API_URL=" "$ENV_FILE"; then
      awk -v url="$API_URL" '/^API_URL=/ {$0="API_URL="url} 1' "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    else
      echo "API_URL=${API_URL}" >> "$ENV_FILE"
    fi
    printf "${GREEN}> API_URL has been set to $API_URL in $ENV_FILE.${NC}\n"
  else
    API_URL=$(grep "^API_URL=" "$ENV_FILE" | cut -d '=' -f2)
    printf "${GREEN}> API_URL already exists in $ENV_FILE with value: $API_URL${NC}\n"
  fi
}

# Function to check and populate the .env file with JWT_KEY
populate_jwt_key() {
  printf "${CYAN}> Checking JWT_KEY...${NC}\n"
  if ! grep -q "^JWT_KEY=" "$ENV_FILE" || [ -z "$(grep "^JWT_KEY=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
    JWT_KEY=$(generate_jwt_key)
    if grep -q "^JWT_KEY=" "$ENV_FILE"; then
      awk -v key="$JWT_KEY" '/^JWT_KEY=/ {$0="JWT_KEY="key} 1' "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    else
      echo "JWT_KEY=${JWT_KEY}" >> "$ENV_FILE"
    fi
    printf "${GREEN}> JWT_KEY has been generated and added to $ENV_FILE.${NC}\n"
  else
    printf "${GREEN}> JWT_KEY already exists and has a value in $ENV_FILE.${NC}\n"
  fi
}

# Function to check and populate the .env file with DATA_PROTECTION_CERT_PASS
populate_data_protection_cert_pass() {
  printf "${CYAN}> Checking DATA_PROTECTION_CERT_PASS...${NC}\n"
  if ! grep -q "^DATA_PROTECTION_CERT_PASS=" "$ENV_FILE" || [ -z "$(grep "^DATA_PROTECTION_CERT_PASS=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
    DATA_PROTECTION_CERT_PASS=$(generate_data_protection_cert_pass)
    if grep -q "^DATA_PROTECTION_CERT_PASS=" "$ENV_FILE"; then
      awk -v key="DATA_PROTECTION_CERT_PASS" '/^DATA_PROTECTION_CERT_PASS=/ {$0="DATA_PROTECTION_CERT_PASS="key} 1' "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    else
      echo "DATA_PROTECTION_CERT_PASS=${DATA_PROTECTION_CERT_PASS}" >> "$ENV_FILE"
    fi
    printf "${GREEN}> DATA_PROTECTION_CERT_PASS has been generated and added to $ENV_FILE.${NC}\n"
  else
    printf "${GREEN}> DATA_PROTECTION_CERT_PASS already exists and has a value in $ENV_FILE.${NC}\n"
  fi
}

# Function to ask the user for PRIVATE_EMAIL_DOMAINS
set_private_email_domains() {
  printf "${CYAN}> Setting PRIVATE_EMAIL_DOMAINS...${NC}\n"
  if ! grep -q "^PRIVATE_EMAIL_DOMAINS=" "$ENV_FILE" || [ -z "$(grep "^PRIVATE_EMAIL_DOMAINS=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
    printf "Please enter the domains that should be allowed to receive email, separated by commas (press Enter to disable email support): "
    read -r private_email_domains

    # Set default value if user input is empty
    private_email_domains=${private_email_domains:-"DISABLED.TLD"}

    if grep -q "^PRIVATE_EMAIL_DOMAINS=" "$ENV_FILE"; then
      awk -v domains="$private_email_domains" '/^PRIVATE_EMAIL_DOMAINS=/ {$0="PRIVATE_EMAIL_DOMAINS="domains} 1' "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    else
      echo "PRIVATE_EMAIL_DOMAINS=${private_email_domains}" >> "$ENV_FILE"
    fi

    if [ "$private_email_domains" = "DISABLED.TLD" ]; then
      printf "${GREEN}> PRIVATE_EMAIL_DOMAINS has been set to 'DISABLED.TLD' in $ENV_FILE.${NC} ${RED}SMTP is disabled.${NC}\n"
    else
      printf "${GREEN}> PRIVATE_EMAIL_DOMAINS has been set to '${private_email_domains}' in $ENV_FILE.${NC}\n"
    fi
  else
    private_email_domains=$(grep "^private_email_domains=" "$ENV_FILE" | cut -d '=' -f2)
    if [ "$private_email_domains" = "DISABLED.TLD" ]; then
      printf "${GREEN}> PRIVATE_EMAIL_DOMAINS already exists in $ENV_FILE.${NC} ${RED}SMTP is disabled.${NC}\n"
    else
      printf "${GREEN}> PRIVATE_EMAIL_DOMAINS already exists in $ENV_FILE with value: ${private_email_domains}${NC}\n"
    fi
  fi
}

# Function to ask the user if TLS should be enabled for email
set_smtp_tls_enabled() {
  printf "${CYAN}> Setting SMTP_TLS_ENABLED...${NC}\n"
  if ! grep -q "^SMTP_TLS_ENABLED=" "$ENV_FILE" || [ -z "$(grep "^SMTP_TLS_ENABLED=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
    printf "Do you want TLS enabled for email? (yes/no): "
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
      echo "SMTP_TLS_ENABLED=${tls_enabled}" >> "$ENV_FILE"
    fi
    printf "${GREEN}> SMTP_TLS_ENABLED has been set to ${tls_enabled} in $ENV_FILE.${NC}\n"
  else
    printf "${GREEN}> SMTP_TLS_ENABLED already exists and has a value in $ENV_FILE.${NC}\n"
  fi
}

# Function to build and run the Docker Compose stack with muted output unless an error occurs, showing progress indication
build_and_run_docker_compose() {
    printf "${CYAN}> Building Docker Compose stack..."
    if [ "$VERBOSE" = true ]; then
      docker compose build
    else
      (
        # Run docker compose build and capture its output
        docker compose build > install_compose_build_output.log 2>&1 &
        BUILD_PID=$!

        # Print dots while the build is running
        while kill -0 $BUILD_PID 2>/dev/null; do
            printf "."
            sleep 1
        done

        printf "${NC}"

        # Wait for the build to finish and capture its exit code
        wait $BUILD_PID
        BUILD_EXIT_CODE=$?

        # If there was an error, display it
        if [ $BUILD_EXIT_CODE -ne 0 ]; then
            printf "\n${RED}> An error occurred while building the Docker Compose stack. Check install_compose_build_output.log for details.${NC}\n"
            exit $BUILD_EXIT_CODE
        fi
      )
    fi

    printf "\n${GREEN}> Docker Compose stack built successfully.${NC}\n"

    printf "${CYAN}> Starting Docker Compose stack...${NC}\n"
    if [ "$VERBOSE" = true ]; then
      docker compose up -d
    else
      docker compose up -d > install_compose_up_output.log 2>&1
    fi
    UP_EXIT_CODE=$?

    if [ $UP_EXIT_CODE -ne 0 ]; then
      printf "${RED}> An error occurred while starting the Docker Compose stack. Check install_compose_up_output.log for details.${NC}\n"
      exit $UP_EXIT_CODE
    fi

    printf "${GREEN}> Docker Compose stack started successfully.${NC}\n"
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
  printf "                    Install Script\n"
  printf "=========================================================\n"
  printf "${NC}\n"
}

# Main execution flow
main() {
    parse_args "$@"

    if [ "$RESET_PASSWORD" = true ]; then
        print_logo
        generate_admin_password
        if [ $? -eq 0 ]; then
            restart_docker_containers
        fi

        printf "\n"
        printf "${MAGENTA}=========================================================${NC}\n"
        printf "\n"
        printf "${GREEN}The admin password is successfully reset!${NC}\n"
        printf "\n"
        printf "${MAGENTA}=========================================================${NC}\n"
        printf "\n"
    else
        # Run the original initialization process
        print_logo

        printf "${YELLOW}+++ Initializing .env file +++${NC}\n"
        printf "\n"
        create_env_file || exit $?
        populate_api_url || exit $?
        populate_jwt_key || exit $?
        populate_data_protection_cert_pass || exit $?
        set_private_email_domains || exit $?
        set_smtp_tls_enabled || exit $?
        generate_admin_password || exit $?
        printf "\n${YELLOW}+++ Building Docker containers +++${NC}\n"
        printf "\n"
        build_and_run_docker_compose || exit $?
        printf "\n"
        printf "${MAGENTA}=========================================================${NC}\n"
        printf "\n"
        printf "${GREEN}AliasVault is successfully installed!${NC}\n"
        printf "\n"
        printf "${MAGENTA}=========================================================${NC}\n"
        printf "\n"
    fi

    printf "${CYAN}To configure the server, login to the admin panel:${NC}\n"
    printf "\n"
    if [ "$ADMIN_PASSWORD" != "" ]; then
      printf "Admin Panel: http://localhost:8080/\n"
      printf "Username: admin\n"
      printf "Password: $ADMIN_PASSWORD\n"
      printf "\n"
      printf "${YELLOW}(!) Caution: Make sure to backup the above credentials in a safe place, they won't be shown again!${NC}\n"
      printf "\n"
    else
      printf "Admin Panel: http://localhost:8080/\n"
      printf "Username: admin\n"
      printf "Password: (Previously set. Run this command with --reset-password to generate a new one.)\n"
      printf "\n"
    fi
    printf "${CYAN}===========================${NC}\n"
    printf "\n"
    printf "${CYAN}In order to start using AliasVault and create your own vault, log into the client website:${NC}\n"
    printf "\n"
    printf "Client Website: http://localhost:80/\n"
    printf "You can create your own account from there.\n"
    printf "\n"
    printf "${MAGENTA}=========================================================${NC}\n"
}

# Run the main function
main "$@"
