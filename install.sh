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

# Function to show usage
show_usage() {
    print_logo
    printf "Usage: $0 [COMMAND] [OPTIONS]\n"
    printf "\n"
    printf "Commands:\n"
    printf "  /install           Install AliasVault by pulling pre-built images from GitHub Container Registry (default)\n"
    printf "  /build             Build AliasVault from source (takes longer and requires sufficient specs)\n"
    printf "  /reset-password    Reset admin password\n"
    printf "  /uninstall         Uninstall AliasVault\n"

    printf "\n"
    printf "Options:\n"
    printf "  --verbose         Show detailed output\n"
    printf "  --help            Show this help message\n"
}

# Function to parse command line arguments
parse_args() {
    COMMAND=""  # Remove default command
    VERBOSE=false

    # Show usage if no arguments provided
    if [ $# -eq 0 ]; then
        show_usage
        exit 0
    fi

    while [[ $# -gt 0 ]]; do
        case $1 in
            /install|/i)
                COMMAND="install"
                shift
                ;;
            /build|/b)
                COMMAND="build"
                shift
                ;;
            /uninstall|/u)
                COMMAND="uninstall"
                shift
                ;;
            /reset-password|/reset-admin-password|/rp)
                COMMAND="reset-password"
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Main function
main() {
    parse_args "$@"
    print_logo

    # Check if command is empty (should not happen with updated parse_args)
    if [ -z "$COMMAND" ]; then
        show_usage
        exit 1
    fi

    case $COMMAND in
        "install")
            handle_install
            ;;
        "build")
            handle_build
            ;;
        "uninstall")
            handle_uninstall
            ;;
        "reset-password")
            generate_admin_password
            if [ $? -eq 0 ]; then
                restart_docker_containers
                print_password_reset_message
            fi
            ;;
    esac
}

# Function to print the logo
print_logo() {
    printf "${MAGENTA}"
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
    printf "${CYAN}> Setting PRIVATE_EMAIL_DOMAINS...${NC}\n"
    if ! grep -q "^PRIVATE_EMAIL_DOMAINS=" "$ENV_FILE" || [ -z "$(grep "^PRIVATE_EMAIL_DOMAINS=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        printf "Please enter the domains that should be allowed to receive email, separated by commas (press Enter to disable email support): "
        read -r private_email_domains

        # Set default value if user input is empty
        private_email_domains=${private_email_domains:-"DISABLED.TLD"}
        update_env_var "PRIVATE_EMAIL_DOMAINS" "$private_email_domains"

        if [ "$private_email_domains" = "DISABLED.TLD" ]; then
            printf "${RED}SMTP is disabled.${NC}\n"
        fi
    else
        private_email_domains=$(grep "^PRIVATE_EMAIL_DOMAINS=" "$ENV_FILE" | cut -d '=' -f2)
        if [ "$private_email_domains" = "DISABLED.TLD" ]; then
            printf "${GREEN}> PRIVATE_EMAIL_DOMAINS already exists in $ENV_FILE.${NC} ${RED}SMTP is disabled.${NC}\n"
        else
            printf "${GREEN}> PRIVATE_EMAIL_DOMAINS already exists in $ENV_FILE with value: ${private_email_domains}${NC}\n"
        fi
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

# Function to handle installation
handle_install() {
    printf "${YELLOW}+++ Installing AliasVault +++${NC}\n"
    printf "\n"

    # Initialize environment
    create_env_file || { printf "${RED}> Failed to create .env file${NC}\n"; exit 1; }
    populate_hostname || { printf "${RED}> Failed to set hostname${NC}\n"; exit 1; }
    populate_jwt_key || { printf "${RED}> Failed to set JWT key${NC}\n"; exit 1; }
    populate_data_protection_cert_pass || { printf "${RED}> Failed to set certificate password${NC}\n"; exit 1; }
    set_private_email_domains || { printf "${RED}> Failed to set email domains${NC}\n"; exit 1; }
    set_smtp_tls_enabled || { printf "${RED}> Failed to set SMTP TLS${NC}\n"; exit 1; }
    set_support_email || { printf "${RED}> Failed to set support email${NC}\n"; exit 1; }

    # Only generate admin password if not already set
    if ! grep -q "^ADMIN_PASSWORD_HASH=" "$ENV_FILE" || [ -z "$(grep "^ADMIN_PASSWORD_HASH=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        generate_admin_password || { printf "${RED}> Failed to generate admin password${NC}\n"; exit 1; }
    fi

    # Pull images from GitHub Container Registry
    printf "\n${YELLOW}+++ Pulling Docker images +++${NC}\n"
    printf "\n"

    images=(
        "ghcr.io/lanedirt/aliasvault-reverse-proxy:latest"
        "ghcr.io/lanedirt/aliasvault-api:latest"
        "ghcr.io/lanedirt/aliasvault-client:latest"
        "ghcr.io/lanedirt/aliasvault-admin:latest"
        "ghcr.io/lanedirt/aliasvault-smtp:latest"
    )

    for image in "${images[@]}"; do
        printf "${CYAN}> Pulling $image...${NC}\n"
        if [ "$VERBOSE" = true ]; then
            docker pull $image || { printf "${RED}> Failed to pull image: $image${NC}\n"; exit 1; }
        else
            docker pull $image > /dev/null 2>&1 || { printf "${RED}> Failed to pull image: $image${NC}\n"; exit 1; }
        fi
    done

    # Start containers
    printf "\n${YELLOW}+++ Starting services +++${NC}\n"
    printf "\n"
    if [ "$VERBOSE" = true ]; then
        docker compose up -d || { printf "${RED}> Failed to start Docker containers${NC}\n"; exit 1; }
    else
        docker compose up -d > /dev/null 2>&1 || { printf "${RED}> Failed to start Docker containers${NC}\n"; exit 1; }
    fi

    # Only show success message if we made it here without errors
    print_success_message
}

# Function to handle build
handle_build() {
    printf "${YELLOW}+++ Building AliasVault from source +++${NC}\n"
    printf "\n"

    # Initialize environment with proper error handling
    create_env_file || { printf "${RED}> Failed to create .env file${NC}\n"; exit 1; }
    populate_hostname || { printf "${RED}> Failed to set hostname${NC}\n"; exit 1; }
    populate_jwt_key || { printf "${RED}> Failed to set JWT key${NC}\n"; exit 1; }
    populate_data_protection_cert_pass || { printf "${RED}> Failed to set certificate password${NC}\n"; exit 1; }
    set_private_email_domains || { printf "${RED}> Failed to set email domains${NC}\n"; exit 1; }
    set_smtp_tls_enabled || { printf "${RED}> Failed to set SMTP TLS${NC}\n"; exit 1; }
    set_support_email || { printf "${RED}> Failed to set support email${NC}\n"; exit 1; }

    # Only generate admin password if not already set
    if ! grep -q "^ADMIN_PASSWORD_HASH=" "$ENV_FILE" || [ -z "$(grep "^ADMIN_PASSWORD_HASH=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        generate_admin_password || { printf "${RED}> Failed to generate admin password${NC}\n"; exit 1; }
    fi

    printf "\n${YELLOW}+++ Building and starting services +++${NC}\n"
    printf "\n"

    printf "${CYAN}> Building Docker Compose stack...${NC}"
    if [ "$VERBOSE" = true ]; then
        docker compose -f docker-compose.yml -f docker-compose.build.yml build || {
            printf "\n${RED}> Failed to build Docker Compose stack${NC}\n"
            exit 1
        }
    else
        (
            docker compose -f docker-compose.yml -f docker-compose.build.yml build > install_compose_build_output.log 2>&1 &
            BUILD_PID=$!
            while kill -0 $BUILD_PID 2>/dev/null; do
                printf "."
                sleep 1
            done
            wait $BUILD_PID
            BUILD_EXIT_CODE=$?
            if [ $BUILD_EXIT_CODE -ne 0 ]; then
                printf "\n${RED}> Failed to build Docker Compose stack. Check install_compose_build_output.log for details.${NC}\n"
                exit 1
            fi
        )
    fi
    printf "\n${GREEN}> Docker Compose stack built successfully.${NC}\n"

    printf "${CYAN}> Starting Docker Compose stack...${NC}\n"
    if [ "$VERBOSE" = true ]; then
        docker compose -f docker-compose.yml -f docker-compose.build.yml up -d || {
            printf "${RED}> Failed to start Docker Compose stack${NC}\n"
            exit 1
        }
    else
        docker compose -f docker-compose.yml -f docker-compose.build.yml up -d > /dev/null 2>&1 || {
            printf "${RED}> Failed to start Docker Compose stack${NC}\n"
            exit 1
        }
    fi
    printf "${GREEN}> Docker Compose stack started successfully.${NC}\n"

    # Only show success message if we made it here without errors
    print_success_message
}

# Function to handle uninstall
handle_uninstall() {
    printf "${YELLOW}+++ Uninstalling AliasVault +++${NC}\n"
    printf "\n"

    # Ask for confirmation before proceeding
    read -p "Are you sure you want to uninstall AliasVault? This will remove all containers and images. [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        printf "${YELLOW}> Uninstall cancelled.${NC}\n"
        exit 0
    fi

    printf "${CYAN}> Stopping and removing Docker containers...${NC}\n"
    if [ "$VERBOSE" = true ]; then
        docker compose -f docker-compose.yml -f docker-compose.build.yml down -v || {
            printf "${RED}> Failed to stop and remove Docker containers${NC}\n"
            exit 1
        }
    else
        docker compose -f docker-compose.yml -f docker-compose.build.yml down -v > /dev/null 2>&1 || {
            printf "${RED}> Failed to stop and remove Docker containers${NC}\n"
            exit 1
        }
    fi
    printf "${GREEN}> Docker containers stopped and removed.${NC}\n"

    printf "${CYAN}> Removing Docker images...${NC}\n"
    if [ "$VERBOSE" = true ]; then
        docker compose -f docker-compose.yml -f docker-compose.build.yml down --rmi all || {
            printf "${RED}> Failed to remove Docker images${NC}\n"
            exit 1
        }
    else
        docker compose -f docker-compose.yml -f docker-compose.build.yml down --rmi all > /dev/null 2>&1 || {
            printf "${RED}> Failed to remove Docker images${NC}\n"
            exit 1
        }
    fi
    printf "${GREEN}> Docker images removed.${NC}\n"

    printf "${CYAN}> Pruning Docker system...${NC}\n"
    if [ "$VERBOSE" = true ]; then
        docker system prune -af || {
            printf "${RED}> Failed to prune Docker system${NC}\n"
            exit 1
        }
    else
        docker system prune -af > /dev/null 2>&1 || {
            printf "${RED}> Failed to prune Docker system${NC}\n"
            exit 1
        }
    fi
    printf "${GREEN}> Docker system pruned.${NC}\n"

    # Only show success message if we made it here without errors
    printf "\n"
    printf "${MAGENTA}=========================================================${NC}\n"
    printf "\n"
    printf "${GREEN}AliasVault has been successfully uninstalled!${NC}\n"
    printf "\n"
    printf "All Docker containers and images related to AliasVault have been removed.\n"
    printf "The current directory, including logs and .env files, has been left intact.\n"
    printf "\n"
    printf "If you wish to remove the remaining files, you can do so manually.\n"
    printf "\n"
    printf "Thank you for using AliasVault!\n"
    printf "\n"
    printf "${MAGENTA}=========================================================${NC}\n"
}

main "$@"
