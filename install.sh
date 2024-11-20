#!/bin/bash

# Repository information used for downloading files and images from GitHub
REPO_OWNER="lanedirt"
REPO_NAME="AliasVault"
REPO_BRANCH="main"
GITHUB_RAW_URL="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}"
GITHUB_CONTAINER_REGISTRY="ghcr.io/$(echo "$REPO_OWNER" | tr '[:upper:]' '[:lower:]')/$(echo "$REPO_NAME" | tr '[:upper:]' '[:lower:]')"

# Required files and directories
REQUIRED_DIRS=(
    "certificates/ssl"
    "certificates/app"
    "certificates/letsencrypt"
    "certificates/letsencrypt/www"
    "database"
    "logs"
    "logs/msbuild"
)

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
    printf "  /configure-ssl     Configure SSL certificates (Let's Encrypt or self-signed)\n"

    printf "\n"
    printf "Options:\n"
    printf "  --verbose         Show detailed output\n"
    printf "  -y, --yes        Automatic yes to prompts (for uninstall)\n"
    printf "  --help            Show this help message\n"
}

# Function to parse command line arguments
parse_args() {
    COMMAND=""  # Remove default command
    VERBOSE=false
    FORCE_YES=false

    # Show usage if no arguments provided
    if [ $# -eq 0 ]; then
        show_usage
        exit 0
    fi

    while [[ $# -gt 0 ]]; do
        case $1 in
            install|i)
                COMMAND="install"
                shift
                ;;
            build|b)
                COMMAND="build"
                shift
                ;;
            uninstall|u)
                COMMAND="uninstall"
                shift
                ;;
            reset-password|reset-admin-password|rp)
                COMMAND="reset-password"
                shift
                ;;
            configure-ssl|ssl)
                COMMAND="configure-ssl"
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            -y|--yes)
                FORCE_YES=true
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

    # Check if command is empty (should not happen with updated parse_args)
    if [ -z "$COMMAND" ]; then
        show_usage
        exit 1
    fi

    print_logo
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
                recreate_docker_containers
                print_password_reset_message
            fi
            ;;
        "configure-ssl")
            handle_ssl_configuration
            ;;
    esac
}

# Function to create required directories
create_directories() {
    printf "${CYAN}> Checking workspace...${NC}\n"

    local dirs_needed=false
    for dir in "${REQUIRED_DIRS[@]}"; do
        if [ ! -d "$dir" ]; then
            if [ "$dirs_needed" = false ]; then
                printf "  ${CYAN}> Creating required directories...${NC}\n"
                dirs_needed=true
            fi
            mkdir -p "$dir"
            chmod -R 755 "$dir"
            if [ $? -ne 0 ]; then
                printf "  ${RED}> Failed to create directory: $dir${NC}\n"
                exit 1
            fi
        fi
    done
    if [ "$dirs_needed" = true ]; then
        printf "  ${GREEN}> Directories created successfully.${NC}\n"
    else
        printf "  ${GREEN}> All required directories already exist.${NC}\n"
    fi
}

# Function to initialize workspace
initialize_workspace() {
    create_directories
    handle_docker_compose
}

# Function to handle docker-compose.yml
handle_docker_compose() {
    printf "${CYAN}> Checking docker-compose.yml...${NC}\n"

    if [ -f "docker-compose.yml" ]; then
        printf "  ${GREEN}> docker-compose.yml already exists.${NC}\n"
        return 0
    fi

    printf "  ${CYAN}> Downloading docker-compose.yml...${NC}"
    if curl -sSf "${GITHUB_RAW_URL}/docker-compose.yml" -o "docker-compose.yml" > /dev/null 2>&1; then
        printf "\n  ${GREEN}> docker-compose.yml downloaded successfully.${NC}\n"
        return 0
    else
        printf "\n  ${YELLOW}> Failed to download docker-compose.yml, please check your internet connection and try again. Alternatively, you can download it manually from https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/main/docker-compose.yml and place it in the root directory of AliasVault.${NC}\n"
        exit 1
    fi
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
    printf "${CYAN}> Checking .env file...${NC}\n"
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "$ENV_EXAMPLE_FILE" ]; then
            cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
            printf "  ${GREEN}> New.env file created from .env.example.${NC}\n"
        else
            touch "$ENV_FILE"
            printf "  ${YELLOW}> New blank .env file created.${NC}\n"
        fi
    else
        printf "  ${GREEN}> .env file already exists.${NC}\n"
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
        printf "  ${GREEN}> HOSTNAME already exists.${NC}\n"
    fi
}

populate_jwt_key() {
    printf "${CYAN}> Checking JWT_KEY...${NC}\n"
    if ! grep -q "^JWT_KEY=" "$ENV_FILE" || [ -z "$(grep "^JWT_KEY=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        JWT_KEY=$(openssl rand -base64 32)
        update_env_var "JWT_KEY" "$JWT_KEY"
    else
        printf "  ${GREEN}> JWT_KEY already exists.${NC}\n"
    fi
}

populate_data_protection_cert_pass() {
    printf "${CYAN}> Checking DATA_PROTECTION_CERT_PASS...${NC}\n"
    if ! grep -q "^DATA_PROTECTION_CERT_PASS=" "$ENV_FILE" || [ -z "$(grep "^DATA_PROTECTION_CERT_PASS=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        CERT_PASS=$(openssl rand -base64 32)
        update_env_var "DATA_PROTECTION_CERT_PASS" "$CERT_PASS"
    else
        printf "  ${GREEN}> DATA_PROTECTION_CERT_PASS already exists.${NC}\n"
    fi
}

set_private_email_domains() {
    printf "${CYAN}> Checking PRIVATE_EMAIL_DOMAINS...${NC}\n"
    if ! grep -q "^PRIVATE_EMAIL_DOMAINS=" "$ENV_FILE" || [ -z "$(grep "^PRIVATE_EMAIL_DOMAINS=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        printf "Please enter the domains that should be allowed to receive email, separated by commas (press Enter to disable email support): "
        read -r private_email_domains

        private_email_domains=${private_email_domains:-"DISABLED.TLD"}
        update_env_var "PRIVATE_EMAIL_DOMAINS" "$private_email_domains"

        if [ "$private_email_domains" = "DISABLED.TLD" ]; then
            printf "  ${RED}SMTP is disabled.${NC}\n"
        fi
    else
        private_email_domains=$(grep "^PRIVATE_EMAIL_DOMAINS=" "$ENV_FILE" | cut -d '=' -f2)
        if [ "$private_email_domains" = "DISABLED.TLD" ]; then
            printf "  ${GREEN}> PRIVATE_EMAIL_DOMAINS already exists.${NC} ${RED}Private email domains are disabled.${NC}\n"
        else
            printf "  ${GREEN}> PRIVATE_EMAIL_DOMAINS already exists.${NC}\n"
        fi
    fi
}

set_smtp_tls_enabled() {
    printf "${CYAN}> Checking SMTP_TLS_ENABLED...${NC}\n"
    if ! grep -q "^SMTP_TLS_ENABLED=" "$ENV_FILE"; then
        update_env_var "SMTP_TLS_ENABLED" "false"
    else
        printf "  ${GREEN}> SMTP_TLS_ENABLED already exists.${NC}\n"
    fi
}

set_support_email() {
    printf "${CYAN}> Checking SUPPORT_EMAIL...${NC}\n"
    if ! grep -q "^SUPPORT_EMAIL=" "$ENV_FILE"; then
        read -p "Enter support email address (optional, press Enter to skip): " SUPPORT_EMAIL
        update_env_var "SUPPORT_EMAIL" "$SUPPORT_EMAIL"
    else
        printf "  ${GREEN}> SUPPORT_EMAIL already exists.${NC}\n"
    fi
}

# Function to generate admin password
generate_admin_password() {
    printf "${CYAN}> Generating admin password...${NC}\n"
    PASSWORD=$(openssl rand -base64 12)

    if ! docker pull ${GITHUB_CONTAINER_REGISTRY}-installcli:latest > /dev/null 2>&1; then
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
        HASH=$(docker run --rm installcli "$PASSWORD")
        if [ -z "$HASH" ]; then
            printf "${RED}> Error: Failed to generate password hash${NC}\n"
            exit 1
        fi
    else
        HASH=$(docker run --rm ${GITHUB_CONTAINER_REGISTRY}-installcli:latest "$PASSWORD")
        if [ -z "$HASH" ]; then
            printf "${RED}> Error: Failed to generate password hash${NC}\n"
            exit 1
        fi
    fi

    if [ -n "$HASH" ]; then
        update_env_var "ADMIN_PASSWORD_HASH" "$HASH"
        update_env_var "ADMIN_PASSWORD_GENERATED" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
        printf "  ==> New admin password: $PASSWORD\n"
    fi
}

# Helper function to update environment variables
update_env_var() {
    local key=$1
    local value=$2

    if [ -f "$ENV_FILE" ]; then
        sed -i.bak "/^${key}=/d" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
    fi

    echo "$key=$value" >> "$ENV_FILE"
    printf "  ${GREEN}> $key has been set in $ENV_FILE.${NC}\n"
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
        printf "Password: (Previously set. Use ./install.sh reset-password to generate new one.)\n"
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

# Function to recreate (restart) Docker containers
recreate_docker_containers() {
    printf "${CYAN}> Recreating Docker containers...${NC}\n"
    if [ "$VERBOSE" = true ]; then
        docker compose up -d --force-recreate
    else
        docker compose up -d --force-recreate > /dev/null 2>&1
    fi
    printf "${GREEN}> Docker containers recreated.${NC}\n"
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

# Function to get docker compose command with appropriate config files
get_docker_compose_command() {
    local base_command="docker compose -f docker-compose.yml"

    # Check if using build configuration
    if [ "$1" = "build" ]; then
        base_command="$base_command -f docker-compose.build.yml"
    fi

    # Check if Let's Encrypt is enabled
    if grep -q "^LETSENCRYPT_ENABLED=true" "$ENV_FILE" 2>/dev/null; then
        base_command="$base_command -f docker-compose.letsencrypt.yml"
    fi

    echo "$base_command"
}

# Function to handle installation
handle_install() {
    printf "${YELLOW}+++ Installing AliasVault +++${NC}\n"
    printf "\n"

    # Initialize workspace which makes sure all required directories and files exist
    initialize_workspace

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
        "${GITHUB_CONTAINER_REGISTRY}-reverse-proxy:latest"
        "${GITHUB_CONTAINER_REGISTRY}-api:latest"
        "${GITHUB_CONTAINER_REGISTRY}-client:latest"
        "${GITHUB_CONTAINER_REGISTRY}-admin:latest"
        "${GITHUB_CONTAINER_REGISTRY}-smtp:latest"
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
        $(get_docker_compose_command) up -d || { printf "${RED}> Failed to start Docker containers${NC}\n"; exit 1; }
    else
        $(get_docker_compose_command) up -d > /dev/null 2>&1 || { printf "${RED}> Failed to start Docker containers${NC}\n"; exit 1; }
    fi

    # Only show success message if we made it here without errors
    print_success_message
}

# Function to handle build
handle_build() {
    printf "${YELLOW}+++ Building AliasVault from source +++${NC}\n"
    printf "\n"

    # Check for required build files
    if [ ! -f "docker-compose.build.yml" ] || [ ! -d "src" ]; then
        printf "${RED}Error: Required files for building from source are missing.${NC}\n"
        printf "\n"
        printf "To build AliasVault from source, you need:\n"
        printf "1. docker-compose.build.yml file\n"
        printf "2. src/ directory with the complete source code\n"
        printf "\n"
        printf "Please clone the complete repository using:\n"
        printf "git clone https://github.com/${REPO_OWNER}/${REPO_NAME}.git\n"
        printf "\n"
        printf "Alternatively, you can use '/install' to pull pre-built images.\n"
        exit 1
    fi

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
        $(get_docker_compose_command "build") build || {
            printf "\n${RED}> Failed to build Docker Compose stack${NC}\n"
            exit 1
        }
    else
        (
            $(get_docker_compose_command "build") build > install_compose_build_output.log 2>&1 &
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
        $(get_docker_compose_command "build") up -d || {
            printf "${RED}> Failed to start Docker Compose stack${NC}\n"
            exit 1
        }
    else
        $(get_docker_compose_command "build") up -d > /dev/null 2>&1 || {
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

    # Check if -y flag was passed
    if [ "$FORCE_YES" != "true" ]; then
        # Ask for confirmation before proceeding
        read -p "Are you sure you want to uninstall AliasVault? This will remove all containers and images. [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            printf "${YELLOW}> Uninstall cancelled.${NC}\n"
            exit 0
        fi
    fi

    printf "${CYAN}> Stopping and removing Docker containers...${NC}\n"
    if [ "$VERBOSE" = true ]; then
        docker compose -f docker-compose.yml down -v || {
            printf "${RED}> Failed to stop and remove Docker containers${NC}\n"
            exit 1
        }
    else
        docker compose -f docker-compose.yml down -v > /dev/null 2>&1 || {
            printf "${RED}> Failed to stop and remove Docker containers${NC}\n"
            exit 1
        }
    fi
    printf "${GREEN}> Docker containers stopped and removed.${NC}\n"

    printf "${CYAN}> Removing Docker images...${NC}\n"
    if [ "$VERBOSE" = true ]; then
        docker compose -f docker-compose.yml down --rmi all || {
            printf "${RED}> Failed to remove Docker images${NC}\n"
            exit 1
        }
    else
        docker compose -f docker-compose.yml down --rmi all > /dev/null 2>&1 || {
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

# Function to handle SSL configuration
handle_ssl_configuration() {
    printf "${YELLOW}+++ SSL Certificate Configuration +++${NC}\n"
    printf "\n"

    # Check if AliasVault is installed
    if [ ! -f "docker-compose.yml" ]; then
        printf "${RED}Error: AliasVault must be installed first.${NC}\n"
        exit 1
    fi

    # Get the current hostname from .env
    CURRENT_HOSTNAME=$(grep "^HOSTNAME=" "$ENV_FILE" | cut -d '=' -f2)

    printf "Current hostname: ${CYAN}${CURRENT_HOSTNAME}${NC}\n"
    printf "\n"
    printf "SSL Options:\n"
    printf "1) Configure Let's Encrypt (recommended for production)\n"
    printf "2) Generate new self-signed certificate\n"
    printf "3) Cancel\n"
    printf "\n"

    read -p "Select an option [1-3]: " ssl_option

    case $ssl_option in
        1)
            configure_letsencrypt
            ;;
        2)
            generate_self_signed_cert
            ;;
        3)
            printf "${YELLOW}SSL configuration cancelled.${NC}\n"
            exit 0
            ;;
        *)
            printf "${RED}Invalid option selected.${NC}\n"
            exit 1
            ;;
    esac
}

# Function to configure Let's Encrypt
configure_letsencrypt() {
    printf "${CYAN}> Configuring Let's Encrypt SSL certificate...${NC}\n"

    # Check if hostname is localhost
    if [ "$CURRENT_HOSTNAME" = "localhost" ]; then
        printf "${RED}Error: Let's Encrypt certificates cannot be issued for 'localhost'.${NC}\n"
        printf "${YELLOW}Please configure a valid publically resolvable domain name (e.g. mydomain.com) before setting up Let's Encrypt.${NC}\n"
        exit 1
    fi

    # Check if hostname is a valid domain
    if ! [[ "$CURRENT_HOSTNAME" =~ \.[a-zA-Z]{2,}$ ]]; then
        printf "${RED}Error: Invalid hostname '${CURRENT_HOSTNAME}'.${NC}\n"
        printf "${YELLOW}Please configure a valid publically resolvable domain name (e.g. mydomain.com) before setting up Let's Encrypt.${NC}\n"
        exit 1
    fi

    # Verify DNS is properly configured
    printf "\n${YELLOW}Important: Before proceeding, ensure that:${NC}\n"
    printf "1. Your domain (${CYAN}${CURRENT_HOSTNAME}${NC}) is externally resolvable to this server's IP address\n"
    printf "2. Ports 80 and 443 are open and accessible from the internet\n"
    printf "\n"

    read -p "Have you completed these steps? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        printf "${YELLOW}> Let's Encrypt configuration cancelled.${NC}\n"
        exit 0
    fi

    # Get contact email for Let's Encrypt
    SUPPORT_EMAIL=$(grep "^SUPPORT_EMAIL=" "$ENV_FILE" | cut -d '=' -f2)
    LETSENCRYPT_EMAIL=""

    while true; do
        printf "\nPlease enter a valid email address that will be used for Let's Encrypt certificate notifications:\n"
        read -p "Email: " LETSENCRYPT_EMAIL
        if [[ "$LETSENCRYPT_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
            printf "Confirm using ${CYAN}${LETSENCRYPT_EMAIL}${NC} for Let's Encrypt notifications? [y/N] "
            read -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                break
            fi
        else
            printf "${RED}Invalid email format. Please try again.${NC}\n"
        fi
    done

    # Update .env to indicate Let's Encrypt is enabled
    update_env_var "LETSENCRYPT_ENABLED" "true"

    # Create certbot directories
    printf "${CYAN}> Creating Let's Encrypt directories...${NC}\n"
    mkdir -p ./certificates/letsencrypt/www

    # Create Docker network if it doesn't exist
    printf "${CYAN}> Creating Docker network...${NC}\n"
    docker network create aliasvault_default \
        --label com.docker.compose.network=default \
        --label com.docker.compose.project=aliasvault 2>/dev/null || true

    # Start the reverse proxy first to handle ACME challenge
    printf "${CYAN}> Starting reverse proxy for ACME challenge...${NC}\n"
    $(get_docker_compose_command) up -d reverse-proxy
    sleep 5  # Give nginx time to start

    # Request initial certificate using a temporary certbot container
    printf "${CYAN}> Requesting initial Let's Encrypt certificate...${NC}\n"
    docker run --rm \
        --network aliasvault_default \
        -v ./certificates/letsencrypt:/etc/letsencrypt:rw \
        -v ./certificates/letsencrypt/www:/var/www/certbot:rw \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$LETSENCRYPT_EMAIL" \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        --domains ${CURRENT_HOSTNAME} \
        --force-renewal

    if [ $? -ne 0 ]; then
        printf "${RED}Failed to obtain Let's Encrypt certificate.${NC}\n"
        exit 1
    fi

    # Restart only the reverse proxy with new configuration
    printf "${CYAN}> Restarting reverse proxy with Let's Encrypt configuration...${NC}\n"
    $(get_docker_compose_command) up -d reverse-proxy

    printf "${GREEN}> Let's Encrypt SSL certificate has been configured successfully!${NC}\n"
}

# Function to generate self-signed certificate
generate_self_signed_cert() {
    printf "${CYAN}> Generating new self-signed certificate...${NC}\n"

    # Disable Let's Encrypt
    update_env_var "LETSENCRYPT_ENABLED" "false"

    # Stop existing containers
    printf "${CYAN}> Stopping existing containers...${NC}\n"
    docker compose down

    # Remove existing certificates
    rm -f ./certificates/ssl/cert.pem ./certificates/ssl/key.pem

    # Start containers (which will generate new self-signed certs)
    printf "${CYAN}> Restarting services...${NC}\n"
    docker compose up -d

    printf "${GREEN}> New self-signed certificate has been generated successfully!${NC}\n"
}

main "$@"
