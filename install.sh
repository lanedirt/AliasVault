#!/bin/bash
# @version 0.8.3

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
    printf "  install               Install AliasVault by pulling pre-built images from GitHub Container Registry (recommended)\n"
    printf "  uninstall             Uninstall AliasVault\n"
    printf "  update                Update AliasVault to the latest version\n"
    printf "  update-installer      Check and update install.sh script if newer version available\n"
    printf "  configure-ssl         Configure SSL certificates (Let's Encrypt or self-signed)\n"
    printf "  configure-email       Configure email domains for receiving emails\n"
    printf "  start                 Start AliasVault containers\n"
    printf "  stop                  Stop AliasVault containers\n"
    printf "  restart               Restart AliasVault containers\n"
    printf "  reset-password        Reset admin password\n"
    printf "  build                 Build AliasVault from source (takes longer and requires sufficient specs)\n"

    printf "\n"
    printf "Options:\n"
    printf "  --verbose         Show detailed output\n"
    printf "  -y, --yes         Automatic yes to prompts (for uninstall)\n"
    printf "  --help            Show this help message\n"
}

# Function to parse command line arguments
parse_args() {
    COMMAND=""
    VERBOSE=false
    FORCE_YES=false
    COMMAND_ARG=""

    if [ $# -eq 0 ]; then
        show_usage
        exit 0
    fi

    # First argument is always the command
    case $1 in
        install|i)
            COMMAND="install"
            shift
            # Check for version argument
            if [ $# -gt 0 ] && [[ ! "$1" =~ ^- ]]; then
                COMMAND_ARG="$1"
                shift
            fi
            ;;
        # Other commands remain unchanged
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
        configure-email|email)
            COMMAND="configure-email"
            shift
            ;;
        start|s)
            COMMAND="start"
            shift
            ;;
        stop|st)
            COMMAND="stop"
            shift
            ;;
        restart|r)
            COMMAND="restart"
            shift
            ;;
        update|up)
            COMMAND="update"
            shift
            ;;
        update-installer|cs)
            COMMAND="update-installer"
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

    # Parse remaining flags
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose)
                VERBOSE=true
                shift
                ;;
            -y|--yes)
                FORCE_YES=true
                shift
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
            handle_install "$COMMAND_ARG"
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
        "configure-email")
            handle_email_configuration
            ;;
        "start")
            handle_start
            ;;
        "stop")
            handle_stop
            ;;
        "restart")
            handle_restart
            ;;
        "update")
            handle_update
            ;;
        "update-installer")
            check_install_script_update
            exit $?
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
    printf "${CYAN}> Checking docker-compose files...${NC}\n"

    # Check and download main docker-compose.yml
    if [ ! -f "docker-compose.yml" ]; then
        printf "  ${CYAN}> Downloading docker-compose.yml...${NC}"
        if curl -sSf "${GITHUB_RAW_URL}/docker-compose.yml" -o "docker-compose.yml.tmp" > /dev/null 2>&1; then
            # Replace the :latest tag with the specific version if provided
            if [ -n "$1" ] && [ "$1" != "latest" ]; then
                sed "s/:latest/:$1/g" docker-compose.yml.tmp > docker-compose.yml
                rm docker-compose.yml.tmp
            else
                mv docker-compose.yml.tmp docker-compose.yml
            fi
            printf "\n  ${GREEN}> docker-compose.yml downloaded successfully.${NC}\n"
        else
            printf "\n  ${YELLOW}> Failed to download docker-compose.yml, please check your internet connection and try again. Alternatively, you can download it manually from https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/main/docker-compose.yml and place it in the root directory of AliasVault.${NC}\n"
            exit 1
        fi
    else
        # Update existing docker-compose.yml with correct version if provided
        if [ -n "$1" ] && [ "$1" != "latest" ]; then
            sed -i.bak "s/:latest/:$1/g" docker-compose.yml && rm -f docker-compose.yml.bak
        fi
        printf "  ${GREEN}> docker-compose.yml already exists.${NC}\n"
    fi

    # Check and download docker-compose.letsencrypt.yml
    if [ ! -f "docker-compose.letsencrypt.yml" ]; then
        printf "  ${CYAN}> Downloading docker-compose.letsencrypt.yml...${NC}"
        if curl -sSf "${GITHUB_RAW_URL}/docker-compose.letsencrypt.yml" -o "docker-compose.letsencrypt.yml" > /dev/null 2>&1; then
            printf "\n  ${GREEN}> docker-compose.letsencrypt.yml downloaded successfully.${NC}\n"
        else
            printf "\n  ${YELLOW}> Failed to download docker-compose.letsencrypt.yml, please check your internet connection and try again. Alternatively, you can download it manually from https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/main/docker-compose.letsencrypt.yml and place it in the root directory of AliasVault.${NC}\n"
            exit 1
        fi
    else
        printf "  ${GREEN}> docker-compose.letsencrypt.yml already exists.${NC}\n"
    fi

    return 0
}

# Function to print the logo
print_logo() {
    printf "${MAGENTA}"
    printf "    _    _ _           __      __         _ _   \n"
    printf "   / \  | (_) __ _ ___ \ \    / /_ _ _   _| | |_\n"
    printf "  / _ \ | | |/ _\` / __| \ \/\/ / _\` | | | | | __|\n"
    printf " / ___ \| | | (_| \__ \  \  / / (_| | |_| | | |_ \n"
    printf "/_/   \_\_|_|\__,_|___/   \/  \__,__|\__,_|_|\__|\n"
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
        update_env_var "PRIVATE_EMAIL_DOMAINS" "DISABLED.TLD"
    fi

    private_email_domains=$(grep "^PRIVATE_EMAIL_DOMAINS=" "$ENV_FILE" | cut -d '=' -f2)
    if [ "$private_email_domains" = "DISABLED.TLD" ]; then
        printf "  ${RED}Email server is disabled.${NC} To enable use ./install.sh configure-email command.\n"
    else
        printf "  ${GREEN}> PRIVATE_EMAIL_DOMAINS already exists. Email server is enabled.${NC}\n"
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

# Helper function to delete environment variables
delete_env_var() {
    local key=$1

    if [ -f "$ENV_FILE" ]; then
        sed -i.bak "/^${key}=/d" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
        printf "  ${GREEN}> $key has been removed from $ENV_FILE.${NC}\n"
    fi
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

# Function to handle initial installation or reinstallation
handle_install() {
    local specified_version="$1"

    # If version specified, install that version directly
    if [ -n "$specified_version" ]; then
        handle_install_version "$specified_version"
        return
    fi

    # Check if .env exists before reading
    if [ -f "$ENV_FILE" ]; then
        if grep -q "^ALIASVAULT_VERSION=" "$ENV_FILE"; then
            current_version=$(grep "^ALIASVAULT_VERSION=" "$ENV_FILE" | cut -d '=' -f2)
            printf "${CYAN}> Current AliasVault version: ${current_version}${NC}\n"
            printf "${YELLOW}> AliasVault is already installed.${NC}\n"
            printf "1. To reinstall the current version (${current_version}), continue with this script\n"
            printf "2. To check for updates and to install the latest version, use: ./install.sh update\n"
            printf "3. To install a specific version, use: ./install.sh install <version>\n\n"

            read -p "Would you like to reinstall the current version? [y/N]: " REPLY
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                printf "${YELLOW}> Installation cancelled.${NC}\n"
                exit 0
            fi

            handle_install_version "$current_version"
            return
        fi
    fi

    handle_install_version "latest"
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
        $(get_docker_compose_command "build") up -d --force-recreate || {
            printf "${RED}> Failed to start Docker Compose stack${NC}\n"
            exit 1
        }
    else
        $(get_docker_compose_command "build") up -d --force-recreate > /dev/null 2>&1 || {
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
        read -p "Are you sure you want to uninstall AliasVault? This will remove all containers and images. [y/N]: " REPLY
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

    # Remove version from .env
    delete_env_var "ALIASVAULT_VERSION" ""

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

    # Get the current hostname and SSL config from .env
    CURRENT_HOSTNAME=$(grep "^HOSTNAME=" "$ENV_FILE" | cut -d '=' -f2)
    LETSENCRYPT_ENABLED=$(grep "^LETSENCRYPT_ENABLED=" "$ENV_FILE" | cut -d '=' -f2)

    printf "${CYAN}About SSL Certificates:${NC}\n"
    printf "A default installation of AliasVault comes with a self-signed SSL certificate.\n"
    printf "While self-signed certificates provide encryption, they will show security warnings in browsers.\n"
    printf "\n"
    printf "AliasVault also supports generating valid SSL certificates via Let's Encrypt.\n"
    printf "Let's Encrypt certificates are trusted by browsers and will not show security warnings.\n"
    printf "However, Let's Encrypt requires that:\n"
    printf "  - AliasVault is reachable from the internet via port 80/443\n"
    printf "  - You have configured a valid domain name (not localhost)\n"
    printf "\n"
    printf "Let's Encrypt certificates will be automatically renewed before expiry.\n"
    printf "\n"
    printf "${CYAN}Current Configuration:${NC}\n"
    if [ "$LETSENCRYPT_ENABLED" = "true" ]; then
        printf "Currently using: ${GREEN}Let's Encrypt certificates${NC}\n"
    else
        printf "Currently using: ${YELLOW}Self-signed certificates${NC}\n"
    fi

    printf "Current hostname: ${CYAN}${CURRENT_HOSTNAME}${NC}\n"
    printf "\n"
    printf "SSL Options:\n"
    printf "1) Activate and/or request new Let's Encrypt certificate (recommended for production)\n"
    printf "2) Activate and/or generate new self-signed certificate\n"
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

# Function to handle email server configuration
# Function to handle email server configuration
handle_email_configuration() {
    # Setup trap for Ctrl+C and other interrupts
    trap 'printf "\n${YELLOW}Configuration cancelled by user.${NC}\n"; exit 1' INT TERM

    printf "${YELLOW}+++ Email Server Configuration +++${NC}\n"
    printf "\n"

    # Check if AliasVault is installed
    if [ ! -f "docker-compose.yml" ]; then
        printf "${RED}Error: AliasVault must be installed first.${NC}\n"
        exit 1
    fi

    # Get current email domains from .env
    CURRENT_DOMAINS=$(grep "^PRIVATE_EMAIL_DOMAINS=" "$ENV_FILE" | cut -d '=' -f2)

    printf "${CYAN}About Email Server:${NC}\n"
    printf "AliasVault includes a built-in email server for handling virtual email addresses.\n"
    printf "When enabled, it can receive emails for one or more configured domains.\n"
    printf "Each domain must have an MX record in DNS configuration pointing to this server's hostname.\n"
    printf "\n"
    printf "${CYAN}Current Configuration:${NC}\n"

    if [ "$CURRENT_DOMAINS" = "DISABLED.TLD" ]; then
        printf "Email Server Status: ${RED}Disabled${NC}\n"
    else
        printf "Email Server Status: ${GREEN}Enabled${NC}\n"
        printf "Active Domains: ${CYAN}${CURRENT_DOMAINS}${NC}\n"
    fi

    printf "\n"
    printf "Email Server Options:\n"
    printf "1) Enable email server / Update domains\n"
    printf "2) Disable email server\n"
    printf "3) Cancel\n"
    printf "\n"

    read -p "Select an option [1-3]: " email_option

    case $email_option in
        1)
            while true; do
                printf "\n${CYAN}Enter domain(s) for email server${NC}\n"
                printf "For multiple domains, separate with commas (e.g. domain1.com,domain2.com)\n"
                printf "IMPORTANT: Each domain must have an MX record in DNS pointing to this server.\n"
                read -p "Domains: " new_domains

                if [ -z "$new_domains" ]; then
                    printf "${RED}Error: Domains cannot be empty${NC}\n"
                    continue
                fi

                printf "\n${CYAN}You entered the following domains:${NC}\n"
                IFS=',' read -ra DOMAIN_ARRAY <<< "$new_domains"
                for domain in "${DOMAIN_ARRAY[@]}"; do
                    printf "  - ${GREEN}${domain}${NC}\n"
                done
                printf "\n"

                read -p "Are these domains correct? (y/n): " confirm
                if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
                    break
                fi
            done

            printf "\n${YELLOW}Warning: Docker containers need to be restarted to apply these changes.${NC}\n"
            read -p "Continue with restart? (y/n): " restart_confirm

            if [ "$restart_confirm" != "y" ] && [ "$restart_confirm" != "Y" ]; then
                printf "${YELLOW}Configuration cancelled.${NC}\n"
                exit 0
            fi

            # Update .env file and restart
            if ! update_env_var "PRIVATE_EMAIL_DOMAINS" "$new_domains"; then
                printf "${RED}Failed to update configuration.${NC}\n"
                exit 1
            fi

            printf "${GREEN}Email server configuration updated${NC}\n"
            printf "Restarting AliasVault services...\n"

            if ! handle_restart; then
                printf "${RED}Failed to restart services.${NC}\n"
                exit 1
            fi

            # Only show next steps if everything succeeded
            printf "\n${CYAN}The email server is now succesfully configured.${NC}\n"
            printf "\n"
            printf "To test the email server:\n"
            printf "   a. Log in to your AliasVault account\n"
            printf "   b. Create a new alias using one of your configured private domains\n"
            printf "   c. Send a test email from an external email service (e.g., Gmail)\n"
            printf "   d. Check if the email appears in your AliasVault inbox\n"
            printf "\n"
            printf "If emails don't arrive, please verify:\n"
            printf "   > DNS MX records are correctly configured\n"
            printf "   > Your server's firewall allows incoming traffic on port 25 and 587\n"
            printf "   > Your ISP/hosting provider doesn't block SMTP traffic\n"
            printf "\n"
            ;;
        2)
            printf "${YELLOW}Warning: Docker containers need to be restarted after disabling the email server.${NC}\n"
            read -p "Continue with disable and restart? (y/n): " disable_confirm

            if [ "$disable_confirm" != "y" ] && [ "$disable_confirm" != "Y" ]; then
                printf "${YELLOW}Configuration cancelled.${NC}\n"
                exit 0
            fi

            # Disable email server
            if ! update_env_var "PRIVATE_EMAIL_DOMAINS" "DISABLED.TLD"; then
                printf "${RED}Failed to update configuration.${NC}\n"
                exit 1
            fi

            printf "${YELLOW}Email server disabled${NC}\n"
            printf "Restarting AliasVault services...\n"

            if ! handle_restart; then
                printf "${RED}Failed to restart services.${NC}\n"
                exit 1
            fi
            ;;
        3)
            printf "${YELLOW}Email configuration cancelled.${NC}\n"
            exit 0
            ;;
        *)
            printf "${RED}Invalid option selected.${NC}\n"
            exit 1
            ;;
    esac

    # Remove the trap before normal exit
    trap - INT TERM
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
    printf "1. AliasVault is currently running and accessible at ${CYAN}https://${CURRENT_HOSTNAME}${NC}\n"
    printf "2. Your domain (${CYAN}${CURRENT_HOSTNAME}${NC}) is externally resolvable to this server's IP address\n"
    printf "3. Ports 80 and 443 are open and accessible from the internet\n"
    printf "\n"

    read -p "Have you completed these steps? [y/N]: " REPLY
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
            read REPLY
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                break
            fi
        else
            printf "${RED}Invalid email format. Please try again.${NC}\n"
        fi
    done

    # Create certbot directories
    printf "${CYAN}> Creating Let's Encrypt directories...${NC}\n"
    mkdir -p ./certificates/letsencrypt/www

    # Request certificate using a temporary certbot container
    printf "${CYAN}> Requesting Let's Encrypt certificate...${NC}\n"
    docker run --rm \
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

    # Fix permissions on Let's Encrypt directories and files
    sudo chmod -R 755 ./certificates/letsencrypt

    # Ensure private keys remain secure
    sudo find ./certificates/letsencrypt -type f -name "privkey*.pem" -exec chmod 600 {} \;
    sudo find ./certificates/letsencrypt -type f -name "fullchain*.pem" -exec chmod 644 {} \;

    # Update .env to indicate Let's Encrypt is enabled
    update_env_var "LETSENCRYPT_ENABLED" "true"

    # Restart only the reverse proxy with new configuration so it loads the new certificate
    printf "${CYAN}> Restarting reverse proxy with Let's Encrypt configuration...${NC}\n"
    $(get_docker_compose_command) up -d reverse-proxy --force-recreate

    # Starting certbot container to renew certificates automatically
    printf "${CYAN}> Starting new certbot container to renew certificates automatically...${NC}\n"
    $(get_docker_compose_command) up -d certbot

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

    # Remove Let's Encrypt directories
    rm -rf ./certificates/letsencrypt

    # Start containers (which will generate new self-signed certs)
    printf "${CYAN}> Restarting services...${NC}\n"
    docker compose up -d

    printf "${GREEN}> New self-signed certificate has been generated successfully!${NC}\n"
}

# New functions to handle container lifecycle:
handle_start() {
    printf "${CYAN}> Starting AliasVault containers...${NC}\n"
    $(get_docker_compose_command) up -d
    printf "${GREEN}> AliasVault containers started successfully.${NC}\n"
}

handle_stop() {
    printf "${CYAN}> Stopping AliasVault containers...${NC}\n"
    if ! docker compose ps --quiet 2>/dev/null | grep -q .; then
        printf "${YELLOW}> No containers are currently running.${NC}\n"
        exit 0
    fi

    $(get_docker_compose_command) down
    printf "${GREEN}> AliasVault containers stopped successfully.${NC}\n"
}

handle_restart() {
    printf "${CYAN}> Restarting AliasVault containers...${NC}\n"
    $(get_docker_compose_command) down
    $(get_docker_compose_command) up -d
    printf "${GREEN}> AliasVault containers restarted successfully.${NC}\n"
}

# Function to handle updates
handle_update() {
    printf "${YELLOW}+++ Checking for AliasVault updates +++${NC}\n"
    printf "\n"

    # First check for install.sh updates
    check_install_script_update || true

    # Check current version
    if ! grep -q "^ALIASVAULT_VERSION=" "$ENV_FILE"; then
        printf "${YELLOW}> No version information found. Running first-time update check...${NC}\n"
        handle_install_version "latest"
        return
    fi

    current_version=$(grep "^ALIASVAULT_VERSION=" "$ENV_FILE" | cut -d '=' -f2)
    latest_version=$(curl -s "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

    if [ -z "$latest_version" ]; then
        printf "${RED}> Failed to check for updates. Please try again later.${NC}\n"
        exit 1
    fi

    printf "${CYAN}> Current AliasVault version: ${current_version}${NC}\n"
    printf "${CYAN}> Latest AliasVault version: ${latest_version}${NC}\n"
    printf "\n"

    if [ "$current_version" = "$latest_version" ]; then
        printf "${GREEN}> You are already running the latest version of AliasVault!${NC}\n"
        exit 0
    fi

    if [ "$FORCE_YES" = true ]; then
        printf "${CYAN}> Updating AliasVault to the latest version...${NC}\n"
        handle_install_version "$latest_version"
        printf "${GREEN}> Update completed successfully!${NC}\n"
        return
    fi

    printf "${YELLOW}> A new version of AliasVault is available!${NC}\n"
    printf "\n"
    printf "${MAGENTA}Important:${NC}\n"
    printf "1. It's recommended to backup your database before updating\n"
    printf "2. The update process will restart all containers\n"
    printf "\n"

    read -p "Would you like to update to the latest version? [y/N]: " REPLY
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        printf "${YELLOW}> Update cancelled.${NC}\n"
        exit 0
    fi

    printf "${CYAN}> Updating AliasVault...${NC}\n"
    handle_install_version "$latest_version"

    printf "${GREEN}> Update completed successfully!${NC}\n"
}

# Function to extract version
extract_version() {
    local file="$1"
    local version=$(head -n 2 "$file" | grep '@version' | cut -d' ' -f3)
    echo "$version"
}

# Function to compare semantic versions
compare_versions() {
    local version1="$1"
    local version2="$2"

    # Split versions into arrays
    IFS='.' read -ra v1_parts <<< "$version1"
    IFS='.' read -ra v2_parts <<< "$version2"

    # Compare each part numerically
    for i in {0..2}; do
        # Default to 0 if part doesn't exist
        local v1_part=${v1_parts[$i]:-0}
        local v2_part=${v2_parts[$i]:-0}

        # Compare numerically
        if [ "$v1_part" -gt "$v2_part" ]; then
            echo "1"  # version1 is greater
            return
        elif [ "$v1_part" -lt "$v2_part" ]; then
            echo "-1"  # version1 is lesser
            return
        fi
    done

    echo "0"  # versions are equal
}

# Function to check if install.sh needs updating
check_install_script_update() {
    printf "${CYAN}> Checking for install script updates...${NC}\n"

    # Download latest install.sh to temporary file
    if ! curl -sSf "${GITHUB_RAW_URL}/install.sh" -o "install.sh.tmp"; then
        printf "${RED}> Failed to check for install script updates. Continuing with current version.${NC}\n"
        rm -f install.sh.tmp
        return 1
    fi

    # Get versions
    local current_version=$(extract_version "install.sh")
    local new_version=$(extract_version "install.sh.tmp")

    # Check if versions could be extracted
    if [ -z "$current_version" ] || [ -z "$new_version" ]; then
        printf "${YELLOW}> Could not determine script versions. Falling back to file comparison...${NC}\n"
        # Fall back to file comparison
        if ! cmp -s "install.sh" "install.sh.tmp"; then
            printf "${YELLOW}> Changes detected in install script.${NC}\n"
        else
            printf "${GREEN}> Install script is up to date.${NC}\n"
            rm -f install.sh.tmp
            return 0
        fi
    else
        printf "${CYAN}> Current install script version: ${current_version}${NC}\n"
        printf "${CYAN}> Latest install script version: ${new_version}${NC}\n"

        # Compare versions using semver comparison
        if [ "$current_version" = "$new_version" ]; then
            printf "${GREEN}> Install script is up to date.${NC}\n"
            rm -f install.sh.tmp
            return 0
        else
            local compare_result=$(compare_versions "$current_version" "$new_version")

            if [ "$compare_result" -ge "0" ]; then
                printf "${GREEN}> Install script is up to date.${NC}\n"
                rm -f install.sh.tmp
                return 0
            fi
        fi
    fi

    # If we get here, an update is available
    if [ "$FORCE_YES" = true ]; then
        printf "${CYAN}> Updating install script...${NC}\n"
        cp "install.sh" "install.sh.backup"
        mv "install.sh.tmp" "install.sh"
        chmod +x "install.sh"
        printf "${GREEN}> Install script updated successfully.${NC}\n"
        printf "${GREEN}> Backup of previous version saved as install.sh.backup${NC}\n"
        exit 0
    fi

    printf "${YELLOW}> A new version of the install script is available.${NC}\n"
    printf "Would you like to update the install script before proceeding? [Y/n]: "
    read -r reply

    if [[ ! $reply =~ ^[Nn]$ ]]; then
        # Create backup of current script
        cp "install.sh" "install.sh.backup"

        if mv "install.sh.tmp" "install.sh"; then
            chmod +x "install.sh"
            printf "${GREEN}> Install script updated successfully.${NC}\n"
            printf "${GREEN}> Backup of previous version saved as install.sh.backup${NC}\n"
            printf "${YELLOW}> Please run the update command again to continue with the update process.${NC}\n"
            exit 0
        else
            printf "${RED}> Failed to update install script. Continuing with current version.${NC}\n"
            # Restore from backup if update failed
            mv "install.sh.backup" "install.sh"
            rm -f install.sh.tmp
            return 1
        fi
    else
        printf "${YELLOW}> Continuing with current install script version.${NC}\n"
        rm -f install.sh.tmp
        return 0
    fi
}

# Function to perform the actual installation with specific version
handle_install_version() {
    local target_version="$1"

    # If latest, get actual version number from GitHub API
    if [ "$target_version" = "latest" ]; then
        local actual_version=$(curl -s "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
        if [ -n "$actual_version" ]; then
            target_version="$actual_version"
        fi
    fi

    printf "${YELLOW}+++ Installing AliasVault ${target_version} +++${NC}\n"
    printf "\n"

    # Initialize workspace which makes sure all required directories and files exist
    initialize_workspace

    # Update docker-compose files with correct version so we pull the correct images
    handle_docker_compose "$target_version"

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

    printf "${CYAN}> Installing version: ${target_version}${NC}\n"

    local tag="$target_version"
    if [ "$target_version" = "latest" ]; then
        tag="latest"
    fi

    images=(
        "${GITHUB_CONTAINER_REGISTRY}-reverse-proxy:${tag}"
        "${GITHUB_CONTAINER_REGISTRY}-api:${tag}"
        "${GITHUB_CONTAINER_REGISTRY}-client:${tag}"
        "${GITHUB_CONTAINER_REGISTRY}-admin:${tag}"
        "${GITHUB_CONTAINER_REGISTRY}-smtp:${tag}"
    )

    for image in "${images[@]}"; do
        printf "${CYAN}> Pulling $image...${NC}\n"
        if [ "$VERBOSE" = true ]; then
            docker pull $image || { printf "${RED}> Failed to pull image: $image${NC}\n"; exit 1; }
        else
            docker pull $image > /dev/null 2>&1 || { printf "${RED}> Failed to pull image: $image${NC}\n"; exit 1; }
        fi
    done

    # Save version to .env
    update_env_var "ALIASVAULT_VERSION" "$target_version"

    # Start containers
    printf "\n${YELLOW}+++ Starting services +++${NC}\n"
    printf "\n"
    recreate_docker_containers

    # Only show success message if we made it here without errors
    print_success_message
}

main "$@"
