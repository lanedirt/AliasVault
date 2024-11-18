#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# File paths
ENV_FILE=".env"
ENV_EXAMPLE_FILE=".env.example"

# Function to parse command line arguments
parse_args() {
    RESET_PASSWORD=false
    VERBOSE=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --reset-admin-password|--reset-password)
                RESET_PASSWORD=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# Function to print the logo
print_logo() {
    printf "${BLUE}"
    printf "    _    _ _           __      __         _ _   \n"
    printf "   / \  | (_) __ _ ___ \ \    / /_ _ _   _| | |_\n"
    printf "  / _ \ | | |/ _\` / __| \ \/\/ / _\` | | | | | __|\n"
    printf " / ___ \| | | (_| \__ \  \  /  (_| | |_| | | |_ \n"
    printf "/_/   \_\_|_|\__,_|___/   \/  \__,_|\__,_|_|\__|\n"
    printf "${NC}\n"
}

# Function to create .env file
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

# Environment setup functions
populate_hostname() {
    printf "${CYAN}> Checking HOSTNAME...${NC}\n"
    if ! grep -q "^HOSTNAME=" "$ENV_FILE" || [ -z "$(grep "^HOSTNAME=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        DEFAULT_HOSTNAME="localhost"
        read -p "Enter the hostname where AliasVault will be hosted (press Enter for default: $DEFAULT_HOSTNAME): " USER_HOSTNAME
        HOSTNAME=${USER_HOSTNAME:-$DEFAULT_HOSTNAME}
        update_env_var "HOSTNAME" "$HOSTNAME"
    else
        HOSTNAME=$(grep "^HOSTNAME=" "$ENV_FILE" | cut -d '=' -f2)
    fi
}

populate_jwt_key() {
    printf "${CYAN}> Checking JWT_KEY...${NC}\n"
    if ! grep -q "^JWT_KEY=" "$ENV_FILE" || [ -z "$(grep "^JWT_KEY=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        JWT_KEY=$(openssl rand -base64 32)
        update_env_var "JWT_KEY" "$JWT_KEY"
    fi
}

populate_data_protection_cert_pass() {
    printf "${CYAN}> Checking DATA_PROTECTION_CERT_PASS...${NC}\n"
    if ! grep -q "^DATA_PROTECTION_CERT_PASS=" "$ENV_FILE" || [ -z "$(grep "^DATA_PROTECTION_CERT_PASS=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        CERT_PASS=$(openssl rand -base64 32)
        update_env_var "DATA_PROTECTION_CERT_PASS" "$CERT_PASS"
    fi
}

set_private_email_domains() {
    printf "${CYAN}> Checking PRIVATE_EMAIL_DOMAINS...${NC}\n"
    if ! grep -q "^PRIVATE_EMAIL_DOMAINS=" "$ENV_FILE" || [ -z "$(grep "^PRIVATE_EMAIL_DOMAINS=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        DEFAULT_DOMAINS="localmail.tld"
        read -p "Enter comma-separated list of private email domains (press Enter for default: $DEFAULT_DOMAINS): " USER_DOMAINS
        DOMAINS=${USER_DOMAINS:-$DEFAULT_DOMAINS}
        update_env_var "PRIVATE_EMAIL_DOMAINS" "$DOMAINS"
    fi
}

set_smtp_tls_enabled() {
    printf "${CYAN}> Checking SMTP_TLS_ENABLED...${NC}\n"
    if ! grep -q "^SMTP_TLS_ENABLED=" "$ENV_FILE"; then
        update_env_var "SMTP_TLS_ENABLED" "false"
    fi
}

set_support_email() {
    printf "${CYAN}> Checking SUPPORT_EMAIL...${NC}\n"
    if ! grep -q "^SUPPORT_EMAIL=" "$ENV_FILE"; then
        read -p "Enter support email address (optional, press Enter to skip): " SUPPORT_EMAIL
        update_env_var "SUPPORT_EMAIL" "$SUPPORT_EMAIL"
    fi
}

# Function to generate admin password
generate_admin_password() {
    printf "${CYAN}> Generating admin password...${NC}\n"
    PASSWORD=$(openssl rand -base64 12)

    # Use pre-built image from GitHub Container Registry
    if ! docker pull ghcr.io/lanedirt/aliasvault-installcli:latest > /dev/null 2>&1; then
        printf "${YELLOW}> Pre-built image not found, building locally...${NC}"
        if [ "$VERBOSE" = true ]; then
            docker build -t installcli -f src/Utilities/AliasVault.InstallCli/Dockerfile .
        else
            (
                docker build -t installcli -f src/Utilities/AliasVault.InstallCli/Dockerfile . > install_build_output.log 2>&1 &
                BUILD_PID=$!
                while kill -0 $BUILD_PID 2>/dev/null; do
                    printf "."
                    sleep 1
                done
                printf "\n"
                wait $BUILD_PID
                BUILD_EXIT_CODE=$?
                if [ $BUILD_EXIT_CODE -ne 0 ]; then
                    printf "\n${RED}> Error building Docker image. Check install_build_output.log for details.${NC}\n"
                    exit $BUILD_EXIT_CODE
                fi
            )
        fi
        # Store hash in a variable and check if it's not empty
        HASH=$(docker run --rm installcli "$PASSWORD")
        if [ -z "$HASH" ]; then
            printf "${RED}> Error: Failed to generate password hash${NC}\n"
            exit 1
        fi
    else
        # Store hash in a variable and check if it's not empty
        HASH=$(docker run --rm ghcr.io/lanedirt/aliasvault-installcli:latest "$PASSWORD")
        if [ -z "$HASH" ]; then
            printf "${RED}> Error: Failed to generate password hash${NC}\n"
            exit 1
        fi
    fi

    # Update env vars (only if we have a valid hash)
    if [ -n "$HASH" ]; then
        update_env_var "ADMIN_PASSWORD_HASH" "$HASH"
        update_env_var "ADMIN_PASSWORD_GENERATED" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
        printf "   ==> New admin password: $PASSWORD\n"
    fi
}

# Helper function to update environment variables
update_env_var() {
    local key=$1
    local value=$2

    # Remove existing line with this key if it exists
    if [ -f "$ENV_FILE" ]; then
        sed -i.bak "/^${key}=/d" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
    fi

    # Append the new key-value pair
    echo "$key=$value" >> "$ENV_FILE"
    printf "${GREEN}> $key has been set in $ENV_FILE.${NC}\n"
}

# Function to print success message
print_success_message() {
    printf "\n"
    printf "${MAGENTA}=========================================================${NC}\n"
    printf "\n"
    printf "${GREEN}AliasVault is successfully installed!${NC}\n"
    printf "\n"
    printf "${CYAN}To configure the server, login to the admin panel:${NC}\n"
    printf "\n"
    if [ -n "$PASSWORD" ]; then
        printf "Admin Panel: https://${HOSTNAME}/admin\n"
        printf "Username: admin\n"
        printf "Password: $PASSWORD\n"
        printf "\n"
        printf "${YELLOW}(!) Caution: Make sure to backup the above credentials in a safe place, they won't be shown again!${NC}\n"
    else
        printf "Admin Panel: https://${HOSTNAME}/admin\n"
        printf "Username: admin\n"
        printf "Password: (Previously set. Use --reset-password to generate new one.)\n"
    fi
    printf "\n"
    printf "${CYAN}===========================${NC}\n"
    printf "\n"
    printf "${CYAN}In order to start using AliasVault, log into the client website:${NC}\n"
    printf "\n"
    printf "Client Website: https://${HOSTNAME}/\n"
    printf "\n"
    printf "${MAGENTA}=========================================================${NC}\n"
}

# Function to restart Docker containers
restart_docker_containers() {
    printf "${CYAN}> Restarting Docker containers...${NC}\n"
    if [ "$VERBOSE" = true ]; then
        docker compose restart
    else
        docker compose restart > /dev/null 2>&1
    fi
    printf "${GREEN}> Docker containers restarted.${NC}\n"
}

# Function to print password reset success message
print_password_reset_message() {
    printf "\n"
    printf "${MAGENTA}=========================================================${NC}\n"
    printf "\n"
    printf "${GREEN}The admin password is successfully reset, see the output above. You can now login to the admin panel using this new password.${NC}\n"
    printf "\n"
    printf "${MAGENTA}=========================================================${NC}\n"
    printf "\n"
}