#!/bin/bash
# @version 0.18.0

# Repository information used for downloading files and images from GitHub
REPO_OWNER="lanedirt"
REPO_NAME="AliasVault"
GITHUB_RAW_URL_REPO="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}"
GITHUB_CONTAINER_REGISTRY="ghcr.io/$(echo "$REPO_OWNER" | tr '[:upper:]' '[:lower:]')/$(echo "$REPO_NAME" | tr '[:upper:]' '[:lower:]')"

# Required files and directories
REQUIRED_DIRS=(
    "certificates/ssl"
    "certificates/app"
    "certificates/letsencrypt"
    "certificates/letsencrypt/www"
    "database"
    "database/postgres"
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
    printf "  install                   Install AliasVault by pulling pre-built images from GitHub Container Registry (recommended)\n"
    printf "  build                     Build AliasVault containers locally from source (takes longer and requires sufficient specs)\n"
    printf "  start                     Start AliasVault containers\n"
    printf "  restart                   Restart AliasVault containers\n"
    printf "  stop                      Stop AliasVault containers\n"
    printf "\n"
    printf "  configure-hostname        Configure the hostname where AliasVault can be accessed from\n"
    printf "  configure-ssl             Configure SSL certificates (Let's Encrypt or self-signed)\n"
    printf "  configure-email           Configure email domains for receiving emails\n"
    printf "  configure-registration    Configure new account registration (enable or disable)\n"
    printf "  configure-ip-logging      Configure IP address logging (enable or disable)\n"
    printf "  reset-admin-password      Reset admin password\n"
    printf "  uninstall                 Uninstall AliasVault\n"
    printf "\n"
    printf "  update                    Update AliasVault including install.sh script to the latest version\n"
    printf "  update-installer          Update install.sh script if newer version is available\n"
    printf "\n"
    printf "  db-export                 Export database to file\n"
    printf "  db-import                 Import database from file\n"
    printf "\n"
    printf "  configure-dev-db          Enable/disable development database (for local development only)\n"
    printf "\n"
    printf "Options:\n"
    printf "  --verbose         Show detailed output\n"
    printf "  -y, --yes         Automatic yes to prompts\n"
    printf "  --dev             Target development database for db import/export operations\n"
    printf "  --help            Show this help message\n"
    printf "\n"

}

# Function to parse command line arguments
parse_args() {
    COMMAND=""
    VERBOSE=false
    FORCE_YES=false
    COMMAND_ARG=""
    DEV_DB=false

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
        build|b)
            COMMAND="build"
            shift
            # Check for additional operation argument
            if [ $# -gt 0 ] && [[ ! "$1" =~ ^- ]]; then
                case $1 in
                    start|stop|restart)
                        COMMAND_ARG="$1"
                        shift
                        ;;
                    *)
                        echo "Invalid build operation: $1"
                        echo "Valid operations are: start, stop, restart"
                        exit 1
                        ;;
                esac
            fi
            ;;
        uninstall|u)
            COMMAND="uninstall"
            shift
            ;;
        reset-password|reset-admin-password|rp)
            COMMAND="reset-admin-password"
            shift
            ;;
        configure-hostname|hostname)
            COMMAND="configure-hostname"
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
        configure-registration|registration)
            COMMAND="configure-registration"
            shift
            ;;
        configure-ip-logging|ip-logging)
            COMMAND="configure-ip-logging"
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
        configure-dev-db|dev-db)
            COMMAND="configure-dev-db"
            shift
            # Check for direct option argument
            if [ $# -gt 0 ] && [[ ! "$1" =~ ^- ]]; then
                COMMAND_ARG="$1"
                shift
            fi
            ;;
        migrate-db|migrate)
            COMMAND="migrate-db"
            shift
            ;;
        db-export)
            COMMAND="db-export"
            shift
            ;;
        db-import)
            COMMAND="db-import"
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
            --dev)
                DEV_DB=true
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
        "build")
            handle_build
            ;;
        "install")
            handle_install "$COMMAND_ARG"
            ;;
        "uninstall")
            handle_uninstall
            ;;
        "reset-admin-password")
            generate_admin_password
            if [ $? -eq 0 ]; then
                printf "${CYAN}> Restarting admin container...${NC}\n"
                if [ "$VERBOSE" = true ]; then
                    $(get_docker_compose_command) up -d --force-recreate admin
                else
                    $(get_docker_compose_command) up -d --force-recreate admin > /dev/null 2>&1
                fi
                print_password_reset_message
            fi
            ;;
        "configure-ssl")
            handle_ssl_configuration
            ;;
        "configure-email")
            handle_email_configuration
            ;;
        "configure-registration")
            handle_registration_configuration
            ;;
        "configure-hostname")
            handle_hostname_configuration
            ;;
        "configure-ip-logging")
            handle_ip_logging_configuration
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
        "configure-dev-db")
            configure_dev_database
            ;;
        "db-export")
            handle_db_export
            ;;
        "db-import")
            handle_db_import
            ;;
    esac
}

# Function to get the latest release version from GitHub
get_latest_version() {
    local latest_version=$(curl -s "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest" | grep -o '"tag_name": *"[^"]*"' | cut -d'"' -f4)
    if [ -z "$latest_version" ]; then
        printf "${RED}> Failed to get latest version from GitHub.${NC}\n" >&2
        return 1
    fi
    echo "$latest_version"
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
}

# Function to handle docker-compose.yml
handle_docker_compose() {
    local version_tag="$1"
    printf "${CYAN}> Downloading latest docker-compose files...${NC}\n"

    # Download and overwrite docker-compose.yml
    printf "  ${GREEN}> Downloading docker-compose.yml for version ${version_tag}...${NC}"
    if curl -sSf "${GITHUB_RAW_URL_REPO}/${version_tag}/docker-compose.yml" -o "docker-compose.yml.tmp" > /dev/null 2>&1; then
        # Replace the :latest tag with the specific version if provided
        if [ -n "$version_tag" ] && [ "$version_tag" != "latest" ]; then
            sed "s/:latest/:$version_tag/g" docker-compose.yml.tmp > docker-compose.yml
            rm docker-compose.yml.tmp
        else
            mv docker-compose.yml.tmp docker-compose.yml
        fi
        printf "\n  ${CYAN}> docker-compose.yml downloaded successfully.${NC}\n"
    else
        printf "\n  ${YELLOW}> Failed to download docker-compose.yml, please check your internet connection and try again. Alternatively, you can download it manually from ${GITHUB_RAW_URL_REPO}/${version_tag}/docker-compose.yml and place it in the root directory of AliasVault.${NC}\n"
        exit 1
    fi

    # Download and overwrite docker-compose.letsencrypt.yml
    printf "  ${GREEN}> Downloading docker-compose.letsencrypt.yml for version ${version_tag}...${NC}"
    if curl -sSf "${GITHUB_RAW_URL_REPO}/${version_tag}/docker-compose.letsencrypt.yml" -o "docker-compose.letsencrypt.yml" > /dev/null 2>&1; then
        printf "\n  ${CYAN}> docker-compose.letsencrypt.yml downloaded successfully.${NC}\n"
    else
        printf "\n  ${YELLOW}> Failed to download docker-compose.letsencrypt.yml, please check your internet connection and try again. Alternatively, you can download it manually from ${GITHUB_RAW_URL_REPO}/${version_tag}/docker-compose.letsencrypt.yml and place it in the root directory of AliasVault.${NC}\n"
        exit 1
    fi

    return 0
}

# Function to check and update install.sh for specific version
check_install_script_version() {
    local target_version="$1"
    printf "${CYAN}> Checking install script version for ${target_version}...${NC}\n"

    # Get remote install.sh for target version
    if ! curl -sSf "${GITHUB_RAW_URL_REPO}/${target_version}/install.sh" -o "install.sh.tmp"; then
        printf "${RED}> Failed to check install script version. Continuing with current version.${NC}\n"
        rm -f install.sh.tmp
        return 1
    fi

    # Get versions
    local current_version=$(extract_version "install.sh")
    local target_script_version=$(extract_version "install.sh.tmp")

    # Check if versions could be extracted
    if [ -z "$current_version" ] || [ -z "$target_script_version" ]; then
        printf "${YELLOW}> Could not determine script versions. Falling back to file comparison...${NC}\n"
        if ! cmp -s "install.sh" "install.sh.tmp"; then
            printf "${YELLOW}> Install script needs updating to match version ${target_version}${NC}\n"
            return 2
        fi
    else
        printf "${CYAN}> Current install script version: ${current_version}${NC}\n"
        printf "${CYAN}> Target install script version: ${target_script_version}${NC}\n"

        if [ "$current_version" != "$target_script_version" ]; then
            printf "${YELLOW}> Install script needs updating to match version ${target_version}${NC}\n"
            return 2
        fi
    fi

    printf "${GREEN}> Install script is up to date for version ${target_version}.${NC}\n"
    rm -f install.sh.tmp
    return 0
}

# Function to print the logo
print_logo() {
    printf "${MAGENTA}" >&2
    printf "    _    _ _           __      __         _ _   \n" >&2
    printf "   / \  | (_) __ _ ___ \ \    / /_ _ _   _| | |_\n" >&2
    printf "  / _ \ | | |/ _\` / __| \ \/\/ / _\` | | | | | __|\n" >&2
    printf " / ___ \| | | (_| \__ \  \  / / (_| | |_| | | |_ \n" >&2
    printf "/_/   \_\_|_|\__,_|___/   \/  \__,__|\__,_|_|\__|\n" >&2
    printf "${NC}\n" >&2
}

# Function to create .env file
create_env_file() {
    printf "${CYAN}> Checking .env file...${NC}\n"
    if [ ! -f "$ENV_FILE" ]; then
        if [ ! -f "$ENV_EXAMPLE_FILE" ]; then
            # Get latest release version
            local latest_version=$(get_latest_version) || {
                printf "  ${YELLOW}> Failed to check latest version. Creating blank .env file.${NC}\n"
                touch "$ENV_FILE"
                return 0
            }

            printf "  ${CYAN}> Downloading .env.example...${NC}"
            if curl -sSf "${GITHUB_RAW_URL_REPO}/${latest_version}/.env.example" -o "$ENV_EXAMPLE_FILE" > /dev/null 2>&1; then
                printf "\n  ${GREEN}> .env.example downloaded successfully.${NC}\n"
            else
                printf "\n  ${YELLOW}> Failed to download .env.example. Creating blank .env file.${NC}\n"
                touch "$ENV_FILE"
                return 0
            fi
        fi

        cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
        printf "  ${GREEN}> New .env file created from .env.example.${NC}\n"
    else
        printf "  ${GREEN}> .env file already exists.${NC}\n"
    fi
}

populate_hostname() {
    if ! grep -q "^HOSTNAME=" "$ENV_FILE" || [ -z "$(grep "^HOSTNAME=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        while true; do
            read -p "Enter the (public) hostname where this AliasVault instance can be accessed from (e.g. aliasvault.net): " USER_HOSTNAME
            if [ -n "$USER_HOSTNAME" ]; then
                HOSTNAME="$USER_HOSTNAME"
                break
            else
                printf "${YELLOW}> Hostname cannot be empty. Please enter a valid hostname.${NC}\n"
            fi
        done
        update_env_var "HOSTNAME" "$HOSTNAME"
    else
        HOSTNAME=$(grep "^HOSTNAME=" "$ENV_FILE" | cut -d '=' -f2)
        printf "  ${GREEN}> HOSTNAME already exists.${NC}\n"
    fi
}

# Environment setup functions
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

populate_postgres_credentials() {
    printf "${CYAN}> Checking Postgres credentials...${NC}\n"

    if ! grep -q "^POSTGRES_DB=" "$ENV_FILE" || [ -z "$(grep "^POSTGRES_DB=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        update_env_var "POSTGRES_DB" "aliasvault"
    else
        printf "  ${GREEN}> POSTGRES_DB already exists.${NC}\n"
    fi

    if ! grep -q "^POSTGRES_USER=" "$ENV_FILE" || [ -z "$(grep "^POSTGRES_USER=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        update_env_var "POSTGRES_USER" "aliasvault"
    else
        printf "  ${GREEN}> POSTGRES_USER already exists.${NC}\n"
    fi

    if ! grep -q "^POSTGRES_PASSWORD=" "$ENV_FILE" || [ -z "$(grep "^POSTGRES_PASSWORD=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        # Generate a strong random password with 32 characters
        POSTGRES_PASS=$(openssl rand -base64 32)
        update_env_var "POSTGRES_PASSWORD" "$POSTGRES_PASS"
    else
        printf "  ${GREEN}> POSTGRES_PASSWORD already exists.${NC}\n"
    fi
}

set_private_email_domains() {
    printf "${CYAN}> Checking PRIVATE_EMAIL_DOMAINS...${NC}\n"
    if ! grep -q "^PRIVATE_EMAIL_DOMAINS=" "$ENV_FILE" || [ -z "$(grep "^PRIVATE_EMAIL_DOMAINS=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        update_env_var "PRIVATE_EMAIL_DOMAINS" "DISABLED.TLD"
    fi

    private_email_domains=$(grep "^PRIVATE_EMAIL_DOMAINS=" "$ENV_FILE" | cut -d '=' -f2)
    if [ "$private_email_domains" = "DISABLED.TLD" ]; then
        printf "  ${GREEN}> Email server is disabled. To enable use ./install.sh configure-email command.${NC}\n"
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
        read -p "Enter server admin support email address that is shown on contact page (optional, press Enter to skip): " SUPPORT_EMAIL
        update_env_var "SUPPORT_EMAIL" "$SUPPORT_EMAIL"
    else
        printf "  ${GREEN}> SUPPORT_EMAIL already exists.${NC}\n"
    fi
}

set_public_registration() {
    printf "${CYAN}> Checking PUBLIC_REGISTRATION_ENABLED...${NC}\n"
    if ! grep -q "^PUBLIC_REGISTRATION_ENABLED=" "$ENV_FILE" || [ -z "$(grep "^PUBLIC_REGISTRATION_ENABLED=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        update_env_var "PUBLIC_REGISTRATION_ENABLED" "true"
    else
        printf "  ${GREEN}> PUBLIC_REGISTRATION_ENABLED already exists.${NC}\n"
    fi
}

set_ip_logging() {
    printf "${CYAN}> Checking IP_LOGGING_ENABLED...${NC}\n"
    if ! grep -q "^IP_LOGGING_ENABLED=" "$ENV_FILE" || [ -z "$(grep "^IP_LOGGING_ENABLED=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        update_env_var "IP_LOGGING_ENABLED" "true"
    else
        printf "  ${GREEN}> IP_LOGGING_ENABLED already exists.${NC}\n"
    fi
}

# Function to generate admin password
generate_admin_password() {
    printf "${CYAN}> Generating admin password...${NC}\n"
    PASSWORD=$(openssl rand -base64 12)

    # Build locally if in build mode or if pre-built image is not available
    if grep -q "^DEPLOYMENT_MODE=build" "$ENV_FILE" 2>/dev/null || ! docker pull ${GITHUB_CONTAINER_REGISTRY}-installcli:latest > /dev/null 2>&1; then
        printf "${CYAN}> Building InstallCli locally...${NC}"
        if [ "$VERBOSE" = true ]; then
            docker build -t installcli -f apps/server/Utilities/AliasVault.InstallCli/Dockerfile .
        else
            (
                docker build -t installcli -f apps/server/Utilities/AliasVault.InstallCli/Dockerfile . > install_build_output.log 2>&1 &
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
        HASH=$(docker run --rm installcli hash-password "$PASSWORD")
    else
        HASH=$(docker run --rm ${GITHUB_CONTAINER_REGISTRY}-installcli:latest hash-password "$PASSWORD")
    fi

    if [ -z "$HASH" ]; then
        printf "${RED}> Error: Failed to generate password hash${NC}\n"
        exit 1
    fi

    update_env_var "ADMIN_PASSWORD_HASH" "$HASH"
    update_env_var "ADMIN_PASSWORD_GENERATED" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    printf "  ==> New admin password: $PASSWORD\n"
}

# Function to set default ports
set_default_ports() {
    printf "${CYAN}> Checking default ports...${NC}\n"

    # Web ports
    if ! grep -q "^HTTP_PORT=" "$ENV_FILE" || [ -z "$(grep "^HTTP_PORT=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        update_env_var "HTTP_PORT" "80"
    else
        printf "  ${GREEN}> HTTP_PORT already exists.${NC}\n"
    fi

    if ! grep -q "^HTTPS_PORT=" "$ENV_FILE" || [ -z "$(grep "^HTTPS_PORT=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        update_env_var "HTTPS_PORT" "443"
    else
        printf "  ${GREEN}> HTTPS_PORT already exists.${NC}\n"
    fi

    # SMTP ports
    if ! grep -q "^SMTP_PORT=" "$ENV_FILE" || [ -z "$(grep "^SMTP_PORT=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        update_env_var "SMTP_PORT" "25"
    else
        printf "  ${GREEN}> SMTP_PORT already exists.${NC}\n"
    fi

    if ! grep -q "^SMTP_TLS_PORT=" "$ENV_FILE" || [ -z "$(grep "^SMTP_TLS_PORT=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        update_env_var "SMTP_TLS_PORT" "587"
    else
        printf "  ${GREEN}> SMTP_TLS_PORT already exists.${NC}\n"
    fi
}

# Helper function to update environment variables
update_env_var() {
    local key=$1
    local value=$2

    if [ -f "$ENV_FILE" ]; then
        # Check if key exists
        if grep -q "^${key}=" "$ENV_FILE"; then
            # Update existing key inline
            sed -i.bak "s|^${key}=.*|${key}=${value}|" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
        else
            # Key doesn't exist, append it
            echo "$key=$value" >> "$ENV_FILE"
        fi
    else
        # File doesn't exist, create it with the key-value pair
        echo "$key=$value" > "$ENV_FILE"
    fi

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
        printf "Admin Panel: https://localhost/admin\n"
        printf "Username: admin\n"
        printf "Password: $PASSWORD\n"
        printf "\n"
        printf "${YELLOW}(!) Caution: Make sure to backup the above credentials in a safe place, they won't be shown again!${NC}\n"
    else
        printf "Admin Panel: https://localhost/admin\n"
        printf "Username: admin\n"
        printf "Password: (Previously set. Use ./install.sh reset-admin-password to generate new one.)\n"
    fi
    printf "\n"
    printf "${CYAN}===========================${NC}\n"
    printf "\n"
    printf "${CYAN}In order to start using AliasVault, log into the client website:${NC}\n"
    printf "\n"
    printf "Client Website: https://localhost/\n"
    printf "\n"
    printf "${MAGENTA}=========================================================${NC}\n"
}

# Function to recreate (restart) Docker containers
recreate_docker_containers() {
    printf "${CYAN}> (Re)creating Docker containers...${NC}\n"

    if [ "$VERBOSE" = true ]; then
        $(get_docker_compose_command) up -d --force-recreate
    else
        $(get_docker_compose_command) up -d --force-recreate > /dev/null 2>&1
    fi
    printf "${GREEN}> Docker containers (re)created successfully.${NC}\n"
}

# Function to print password reset success message
print_password_reset_message() {
    printf "\n"
    printf "${MAGENTA}=========================================================${NC}\n"
    printf "\n"
    printf "${GREEN}The admin password has been successfully reset, see the output above.${NC}\n"
    printf "\n"
    printf "${MAGENTA}=========================================================${NC}\n"
    printf "\n"
}

# Function to get docker compose command with appropriate config files
get_docker_compose_command() {
    local base_command="docker compose -f docker-compose.yml"

    # Check if using build configuration
    if grep -q "^DEPLOYMENT_MODE=build" "$ENV_FILE" 2>/dev/null; then
        base_command="$base_command -f docker-compose.build.yml"
    fi

    # Check if Let's Encrypt is enabled
    if grep -q "^LETSENCRYPT_ENABLED=true" "$ENV_FILE" 2>/dev/null; then
        base_command="$base_command -f docker-compose.letsencrypt.yml"
    fi

    echo "$base_command"
}

# Add this new function for handling registration configuration
handle_registration_configuration() {
    printf "${YELLOW}+++ Public Registration Configuration +++${NC}\n"
    printf "\n"

    # Check if AliasVault is installed
    if [ ! -f "docker-compose.yml" ]; then
        printf "${RED}Error: AliasVault must be installed first.${NC}\n"
        exit 1
    fi

    # Get current registration setting
    CURRENT_SETTING=$(grep "^PUBLIC_REGISTRATION_ENABLED=" "$ENV_FILE" | cut -d '=' -f2)

    printf "${CYAN}About Public Registration:${NC}\n"
    printf "Public registration allows new users to create their own accounts on your AliasVault instance.\n"
    printf "When disabled, no new accounts can be created.\n"
    printf "\n"
    printf "${CYAN}Current Configuration:${NC}\n"
    if [ "$CURRENT_SETTING" = "true" ]; then
        printf "Public Registration: ${GREEN}Enabled${NC}\n"
    else
        printf "Public Registration: ${RED}Disabled${NC}\n"
    fi

    printf "\n"
    printf "Options:\n"
    printf "1) Enable public registration\n"
    printf "2) Disable public registration\n"
    printf "3) Cancel\n"
    printf "\n"

    read -p "Select an option [1-3]: " reg_option

    case $reg_option in
        1)
            update_env_var "PUBLIC_REGISTRATION_ENABLED" "true"
            printf "${GREEN}> Public registration has been enabled.${NC}\n"

            printf "\n${YELLOW}Warning: Docker containers need to be restarted to apply these changes.${NC}\n"
            read -p "Restart now? (y/n): " restart_confirm

            if [ "$restart_confirm" != "y" ] && [ "$restart_confirm" != "Y" ]; then
                printf "${YELLOW}Please restart manually to apply the changes.${NC}\n"
                exit 0
            fi

            handle_restart
            ;;
        2)
            update_env_var "PUBLIC_REGISTRATION_ENABLED" "false"
            printf "${YELLOW}> Public registration has been disabled.${NC}\n"

            printf "\n${YELLOW}Warning: Docker containers need to be restarted to apply these changes.${NC}\n"
            read -p "Restart now? (y/n): " restart_confirm

            if [ "$restart_confirm" != "y" ] && [ "$restart_confirm" != "Y" ]; then
                printf "${YELLOW}Please restart manually to apply the changes.${NC}\n"
                exit 0
            fi

            handle_restart
            ;;
        3)
            printf "${YELLOW}Registration configuration cancelled.${NC}\n"
            exit 0
            ;;
        *)
            printf "${RED}Invalid option selected.${NC}\n"
            exit 1
            ;;
    esac
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
    create_env_file || { printf "${RED}> Failed to create .env file${NC}\n"; exit 1; }

    # Set deployment mode to build to ensure container lifecycle uses build configuration
    set_deployment_mode "build"
    printf "\n"

    # Initialize workspace which makes sure all required directories and files exist
    initialize_workspace

    # Check for required build files
    if [ ! -f "docker-compose.build.yml" ] || [ ! -d "apps/server" ]; then
        printf "${RED}Error: Required files for building from source are missing.${NC}\n"
        printf "\n"
        printf "To build AliasVault from source, you need:\n"
        printf "1. docker-compose.build.yml file\n"
        printf "2. apps/server/ directory with the complete source code\n"
        printf "\n"
        printf "Please clone the complete repository using:\n"
        printf "git clone https://github.com/${REPO_OWNER}/${REPO_NAME}.git\n"
        printf "\n"
        printf "Alternatively, you can use './install.sh install' to pull pre-built images.\n"
        exit 1
    fi

    # Initialize environment with proper error handling
    set_support_email || { printf "${RED}> Failed to set support email${NC}\n"; exit 1; }
    populate_jwt_key || { printf "${RED}> Failed to set JWT key${NC}\n"; exit 1; }
    populate_data_protection_cert_pass || { printf "${RED}> Failed to set certificate password${NC}\n"; exit 1; }
    populate_postgres_credentials || { printf "${RED}> Failed to set PostgreSQL credentials${NC}\n"; exit 1; }
    set_private_email_domains || { printf "${RED}> Failed to set email domains${NC}\n"; exit 1; }
    set_smtp_tls_enabled || { printf "${RED}> Failed to set SMTP TLS${NC}\n"; exit 1; }
    set_default_ports || { printf "${RED}> Failed to set default ports${NC}\n"; exit 1; }
    set_public_registration || { printf "${RED}> Failed to set public registration${NC}\n"; exit 1; }
    set_ip_logging || { printf "${RED}> Failed to set IP logging${NC}\n"; exit 1; }

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

    recreate_docker_containers

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

    populate_hostname || { printf "${RED}> Failed to set hostname${NC}\n"; exit 1; }

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

    printf "Current hostname: ${CYAN}${CURRENT_HOSTNAME}${NC} (To change this, run: ./install.sh configure-hostname)\n"
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

            # Update .env file and restart
            if ! update_env_var "PRIVATE_EMAIL_DOMAINS" "$new_domains"; then
                printf "${RED}Failed to update configuration.${NC}\n"
                exit 1
            fi

            printf "${GREEN}Email server configuration updated${NC}\n"

            printf "\n${YELLOW}Warning: Docker containers need to be restarted to apply these changes.${NC}\n"
            read -p "Restart now? (y/n): " restart_confirm

            if [ "$restart_confirm" != "y" ] && [ "$restart_confirm" != "Y" ]; then
                printf "${YELLOW}Please restart manually to apply the changes.${NC}\n"
                exit 0
            fi

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

    # Get absolute path for certificates directory for the docker bind mounts
    CERTIFICATES_DIR=$(realpath ./certificates)

    # Request certificate using a temporary certbot container
    printf "${CYAN}> Requesting Let's Encrypt certificate...${NC}\n"
    docker run --rm \
        -v "${CERTIFICATES_DIR}/letsencrypt:/etc/letsencrypt:rw" \
        -v "${CERTIFICATES_DIR}/letsencrypt/www:/var/www/certbot:rw" \
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
    latest_version=$(get_latest_version) || {
        printf "${RED}> Failed to check for updates. Please try again later.${NC}\n"
        exit 1
    }

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

    # Get latest release version
    local latest_version=$(get_latest_version) || {
        printf "${RED}> Failed to check for install script updates. Continuing with current version.${NC}\n"
        return 1
    }

    if [ -z "$latest_version" ]; then
        printf "${RED}> Failed to check for install script updates. Continuing with current version.${NC}\n"
        return 1
    fi

    if ! curl -sSf "${GITHUB_RAW_URL_REPO}/${latest_version}/install.sh" -o "install.sh.tmp"; then
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
        local actual_version=$(get_latest_version) || {
            printf "${RED}> Failed to get latest version. Please try again later.${NC}\n"
            exit 1
        }
        if [ -n "$actual_version" ]; then
            target_version="$actual_version"
        fi
    fi

    printf "${YELLOW}+++ Installing AliasVault ${target_version} +++${NC}\n"
    create_env_file || { printf "${RED}> Failed to create .env file${NC}\n"; exit 1; }

    # Set deployment mode to install to ensure container lifecycle uses install configuration
    set_deployment_mode "install"
    printf "\n"

    # Initialize workspace which makes sure all required directories and files exist
    initialize_workspace

    # Check if install script needs updating for this version
    check_install_script_version "$target_version"
    local check_result=$?

    if [ $check_result -eq 2 ]; then
        if [ "$FORCE_YES" = true ]; then
            printf "${CYAN}> Updating install script to match version ${target_version}...${NC}\n"
        else
            printf "${YELLOW}> A different version of the install script is required for installing version ${target_version}.${NC}\n"
            read -p "Would you like to self-update the install script before proceeding? [Y/n]: " reply
            if [[ $reply =~ ^[Nn]$ ]]; then
                printf "${YELLOW}> Continuing with current install script version.${NC}\n"
                rm -f install.sh.tmp
            fi
        fi

        if [ "$FORCE_YES" = true ] || [[ ! $reply =~ ^[Nn]$ ]]; then
            # Create backup of current script
            cp "install.sh" "install.sh.backup"

            if mv "install.sh.tmp" "install.sh"; then
                chmod +x "install.sh"
                printf "${GREEN}> Install script updated successfully.${NC}\n"
                printf "${GREEN}> Backup of previous version saved as install.sh.backup${NC}\n"
                printf "${YELLOW}> Please run the same install command again to continue with the installation.${NC}\n"
                exit 2
            else
                printf "${RED}> Failed to update install script. Continuing with current version.${NC}\n"
                mv "install.sh.backup" "install.sh"
                rm -f install.sh.tmp
            fi
        fi
    fi

    # Update docker-compose files with correct version so we pull the correct images
    handle_docker_compose "$target_version"

    # Initialize environment
    set_support_email || { printf "${RED}> Failed to set support email${NC}\n"; exit 1; }
    populate_jwt_key || { printf "${RED}> Failed to set JWT key${NC}\n"; exit 1; }
    populate_data_protection_cert_pass || { printf "${RED}> Failed to set certificate password${NC}\n"; exit 1; }
    populate_postgres_credentials || { printf "${RED}> Failed to set PostgreSQL credentials${NC}\n"; exit 1; }
    set_private_email_domains || { printf "${RED}> Failed to set email domains${NC}\n"; exit 1; }
    set_smtp_tls_enabled || { printf "${RED}> Failed to set SMTP TLS${NC}\n"; exit 1; }
    set_default_ports || { printf "${RED}> Failed to set default ports${NC}\n"; exit 1; }
    set_public_registration || { printf "${RED}> Failed to set public registration${NC}\n"; exit 1; }
    set_ip_logging || { printf "${RED}> Failed to set IP logging${NC}\n"; exit 1; }

    # Only generate admin password if not already set
    if ! grep -q "^ADMIN_PASSWORD_HASH=" "$ENV_FILE" || [ -z "$(grep "^ADMIN_PASSWORD_HASH=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
        generate_admin_password || { printf "${RED}> Failed to generate admin password${NC}\n"; exit 1; }
    fi

    # Pull images from GitHub Container Registry
    printf "\n${YELLOW}+++ Pulling Docker images +++${NC}\n"
    printf "\n"

    printf "${CYAN}> Installing version: ${target_version}${NC}\n"

    images=(
        "${GITHUB_CONTAINER_REGISTRY}-postgres:${target_version}"
        "${GITHUB_CONTAINER_REGISTRY}-reverse-proxy:${target_version}"
        "${GITHUB_CONTAINER_REGISTRY}-api:${target_version}"
        "${GITHUB_CONTAINER_REGISTRY}-client:${target_version}"
        "${GITHUB_CONTAINER_REGISTRY}-admin:${target_version}"
        "${GITHUB_CONTAINER_REGISTRY}-smtp:${target_version}"
        "${GITHUB_CONTAINER_REGISTRY}-task-runner:${target_version}"
    )

    for image in "${images[@]}"; do
        printf "${CYAN}> Pulling $image...${NC}\n"
        if [ "$VERBOSE" = true ]; then
            docker pull $image || printf "${YELLOW}> Warning: Failed to pull image: $image - continuing anyway${NC}\n"
        else
            docker pull $image > /dev/null 2>&1 || printf "${YELLOW}> Warning: Failed to pull image: $image - continuing anyway${NC}\n"
        fi
    done

    # Save version to .env
    update_env_var "ALIASVAULT_VERSION" "$target_version"

    # Start containers
    printf "\n${YELLOW}+++ Starting services +++${NC}\n"
    printf "\n"
    if [ "$VERBOSE" = true ]; then
        docker compose up -d --force-recreate
    else
        docker compose up -d --force-recreate > /dev/null 2>&1
    fi
    printf "${GREEN}> Docker containers recreated.${NC}\n"

    # Only show success message if we made it here without errors
    print_success_message
}

# Function to handle development database configuration
configure_dev_database() {
    printf "${YELLOW}+++ Development Database Configuration +++${NC}\n"
    printf "\n"

    if [ ! -f "docker-compose.dev.yml" ]; then
        printf "${RED}> The docker-compose.dev.yml file is missing. This file is required to start the development database. Please checkout the full GitHub repository and try again.${NC}\n"
        return 1
    fi

    # Check if direct option was provided
    if [ -n "$COMMAND_ARG" ]; then
        case $COMMAND_ARG in
            1|start)
                if docker compose -f docker-compose.dev.yml -p aliasvault-dev ps --status running 2>/dev/null | grep -q postgres-dev; then
                    printf "${YELLOW}> Development database is already running.${NC}\n"
                else
                    printf "${CYAN}> Starting development database...${NC}\n"
                    docker compose -p aliasvault-dev -f docker-compose.dev.yml up -d --wait --wait-timeout 60
                    printf "${GREEN}> Development database started successfully.${NC}\n"
                fi
                print_dev_db_details
                return
                ;;
            0|stop)
                if ! docker compose -f docker-compose.dev.yml -p aliasvault-dev ps --status running 2>/dev/null | grep -q postgres-dev; then
                    printf "${YELLOW}> Development database is already stopped.${NC}\n"
                else
                    printf "${CYAN}> Stopping development database...${NC}\n"
                    docker compose -p aliasvault-dev -f docker-compose.dev.yml down
                    printf "${GREEN}> Development database stopped successfully.${NC}\n"
                fi
                return
                ;;
        esac
    fi

    # Check current status
    if docker compose -f docker-compose.dev.yml -p aliasvault-dev ps --status running 2>/dev/null | grep -q postgres-dev; then
        DEV_DB_STATUS="running"
    else
        DEV_DB_STATUS="stopped"
    fi

    printf "${CYAN}About Development Database:${NC}\n"
    printf "A separate PostgreSQL instance for development purposes that:\n"
    printf "  - Runs on port 5433 (to avoid conflicts)\n"
    printf "  - Uses simple credentials (password: 'password')\n"
    printf "  - Stores data separately from production\n"
    printf "\n"
    printf "${CYAN}Current Status:${NC}\n"
    if [ "$DEV_DB_STATUS" = "running" ]; then
        printf "Development Database: ${GREEN}Running${NC}\n"
    else
        printf "Development Database: ${YELLOW}Stopped${NC}\n"
    fi
    printf "\n"
    printf "Options:\n"
    printf "1) Start development database\n"
    printf "2) Stop development database\n"
    printf "3) View connection details\n"
    printf "4) Cancel\n"
    printf "\n"

    read -p "Select an option [1-4]: " dev_db_option

    case $dev_db_option in
        1)
            if [ "$DEV_DB_STATUS" = "running" ]; then
                printf "${YELLOW}> Development database is already running.${NC}\n"
            else
                printf "${CYAN}> Starting development database...${NC}\n"
                docker compose -p aliasvault-dev -f docker-compose.dev.yml up -d --wait --wait-timeout 60
                printf "${GREEN}> Development database started successfully.${NC}\n"
            fi
            print_dev_db_details
            ;;
        2)
            if [ "$DEV_DB_STATUS" = "stopped" ]; then
                printf "${YELLOW}> Development database is already stopped.${NC}\n"
            else
                printf "${CYAN}> Stopping development database...${NC}\n"
                docker compose -p aliasvault-dev -f docker-compose.dev.yml down
                printf "${GREEN}> Development database stopped successfully.${NC}\n"
            fi
            ;;
        3)
            print_dev_db_details
            ;;
        4)
            printf "${YELLOW}Configuration cancelled.${NC}\n"
            exit 0
            ;;
        *)
            printf "${RED}Invalid option selected.${NC}\n"
            exit 1
            ;;
    esac
}

# Function to print development database connection details
print_dev_db_details() {
    printf "\n"
    printf "${MAGENTA}=========================================================${NC}\n"
    printf "\n"
    printf "${CYAN}Development Database Connection Details:${NC}\n"
    printf "Host: localhost\n"
    printf "Port: 5433\n"
    printf "Database: aliasvault\n"
    printf "Username: aliasvault\n"
    printf "Password: password\n"
    printf "\n"
    printf "Connection string:\n"
    printf "Host=localhost;Port=5433;Database=aliasvault;Username=aliasvault;Password=password\n"
    printf "\n"
    printf "${MAGENTA}=========================================================${NC}\n"
}

# Function to set deployment mode in .env
set_deployment_mode() {
    local mode=$1
    if [ "$mode" != "build" ] && [ "$mode" != "install" ]; then
        printf "${RED}Invalid deployment mode: $mode${NC}\n"
        exit 1
    fi
    update_env_var "DEPLOYMENT_MODE" "$mode"
}

# Function to handle database export
handle_db_export() {
    # Print logo and headers to stderr
    printf "${YELLOW}+++ Exporting Database +++${NC}\n" >&2
    printf "\n" >&2

    # Check if output redirection is present
    if [ -t 1 ]; then
        printf "${RED}Error: Output redirection is required.${NC}\n" >&2
        printf "Usage: ./install.sh db-export [--dev] > backup.sql.gz\n" >&2
        printf "\n" >&2
        printf "Options:\n" >&2
        printf "  --dev    Export from development database\n" >&2
        printf "\n" >&2
        printf "Example:\n" >&2
        printf "  ./install.sh db-export > my_backup_$(date +%Y%m%d).sql.gz\n" >&2
        printf "  ./install.sh db-export --dev > my_dev_backup_$(date +%Y%m%d).sql.gz\n" >&2
        exit 1
    fi

    if [ "$DEV_DB" = true ]; then
        # Check if dev containers are running
        if ! docker compose -f docker-compose.dev.yml -p aliasvault-dev ps postgres-dev --quiet 2>/dev/null | grep -q .; then
            printf "${RED}Error: Development database container is not running. Start it first with: ./install.sh configure-dev-db${NC}\n" >&2
            exit 1
        fi

        # Check if postgres-dev container is healthy
        if ! docker compose -f docker-compose.dev.yml -p aliasvault-dev ps postgres-dev | grep -q "healthy"; then
            printf "${RED}Error: Development PostgreSQL container is not healthy. Please check the logs.${NC}\n" >&2
            exit 1
        fi

        printf "${CYAN}> Exporting development database...${NC}\n" >&2
        docker compose -f docker-compose.dev.yml -p aliasvault-dev exec postgres-dev pg_dump -U aliasvault aliasvault | gzip
    else
        # Production database export logic
        if ! docker compose ps --quiet 2>/dev/null | grep -q .; then
            printf "${RED}Error: AliasVault containers are not running. Start them first with: ./install.sh start${NC}\n" >&2
            exit 1
        fi

        if ! docker compose ps postgres | grep -q "healthy"; then
            printf "${RED}Error: PostgreSQL container is not healthy. Please check the logs with: docker compose logs postgres${NC}\n" >&2
            exit 1
        fi

        printf "${CYAN}> Exporting production database...${NC}\n" >&2
        docker compose exec postgres pg_dump -U aliasvault aliasvault | gzip
    fi

    if [ $? -eq 0 ]; then
        printf "${GREEN}> Database exported successfully.${NC}\n" >&2
    else
        printf "${RED}> Failed to export database.${NC}\n" >&2
        exit 1
    fi
}

# Function to handle database import
handle_db_import() {
    printf "${YELLOW}+++ Importing Database +++${NC}\n"

    # Check if containers are running
    if [ "$DEV_DB" = true ]; then
        if ! docker compose -f docker-compose.dev.yml -p aliasvault-dev ps postgres-dev | grep -q "healthy"; then
            printf "${RED}Error: Development PostgreSQL container is not healthy.${NC}\n"
            exit 1
        fi
    else
        if ! docker compose ps postgres | grep -q "healthy"; then
            printf "${RED}Error: PostgreSQL container is not healthy.${NC}\n"
            exit 1
        fi
    fi

    # Check if we're getting input from a pipe
    if [ -t 0 ]; then
        printf "${RED}Error: No input file provided${NC}\n"
        printf "Usage: ./install.sh db-import [--dev] < backup.sql.gz\n"
        exit 1
    fi

    # Save stdin to file descriptor 3
    exec 3<&0

    printf "${RED}Warning: This will DELETE ALL EXISTING DATA in the "
    if [ "$DEV_DB" = true ]; then
        printf "development database"
    else
        printf "database"
    fi
    printf ".${NC}\n"

    if [ "$FORCE_YES" != true ]; then
        # Use /dev/tty to read from terminal even when stdin is redirected
        if [ -t 1 ] && [ -t 2 ] && [ -e /dev/tty ]; then
            # Temporarily switch stdin to tty for confirmation
            exec < /dev/tty
            read -p "Continue? [y/N]: " confirm
            # Switch back to original stdin
            exec 0<&3
            if [[ ! $confirm =~ ^[Yy]$ ]]; then
                exec 3<&-  # Close fd 3
                exit 1
            fi
        else
            printf "${RED}Error: Cannot read confirmation from terminal. Use -y flag to bypass confirmation.${NC}\n"
            exec 3<&-  # Close fd 3
            exit 1
        fi
    fi

    if [ "$DEV_DB" != true ]; then
        printf "${CYAN}> Stopping dependent services...${NC}\n"
        if [ "$VERBOSE" = true ]; then
            docker compose stop api admin task-runner smtp
        else
            docker compose stop api admin task-runner smtp > /dev/null 2>&1
        fi
    fi

    printf "${CYAN}> Importing "
    if [ "$DEV_DB" = true ]; then
        printf "development "
    fi
    printf "database...${NC}\n"

    # Create a temporary file to verify the gzip input
    temp_file=$(mktemp)
    cat <&3 > "$temp_file"  # Read from fd 3 instead of stdin
    exec 3<&-  # Close fd 3

    if ! gzip -t "$temp_file" 2>/dev/null; then
        printf "${RED}Error: Input is not a valid gzip file${NC}\n"
        rm "$temp_file"
        exit 1
    fi

    if [ "$DEV_DB" = true ]; then
        if [ "$VERBOSE" = true ]; then
            docker compose -f docker-compose.dev.yml -p aliasvault-dev exec -T postgres-dev psql -U aliasvault postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'aliasvault' AND pid <> pg_backend_pid();" && \
            docker compose -f docker-compose.dev.yml -p aliasvault-dev exec -T postgres-dev psql -U aliasvault postgres -c "DROP DATABASE IF EXISTS aliasvault;" && \
            docker compose -f docker-compose.dev.yml -p aliasvault-dev exec -T postgres-dev psql -U aliasvault postgres -c "CREATE DATABASE aliasvault OWNER aliasvault;" && \
            gunzip -c "$temp_file" | docker compose -f docker-compose.dev.yml -p aliasvault-dev exec -T postgres-dev psql -U aliasvault aliasvault
        else
            docker compose -f docker-compose.dev.yml -p aliasvault-dev exec -T postgres-dev psql -U aliasvault postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'aliasvault' AND pid <> pg_backend_pid();" > /dev/null 2>&1 && \
            docker compose -f docker-compose.dev.yml -p aliasvault-dev exec -T postgres-dev psql -U aliasvault postgres -c "DROP DATABASE IF EXISTS aliasvault;" > /dev/null 2>&1 && \
            docker compose -f docker-compose.dev.yml -p aliasvault-dev exec -T postgres-dev psql -U aliasvault postgres -c "CREATE DATABASE aliasvault OWNER aliasvault;" > /dev/null 2>&1 && \
            gunzip -c "$temp_file" | docker compose -f docker-compose.dev.yml -p aliasvault-dev exec -T postgres-dev psql -U aliasvault aliasvault > /dev/null 2>&1
        fi
    else
        if [ "$VERBOSE" = true ]; then
            docker compose exec -T postgres psql -U aliasvault postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'aliasvault' AND pid <> pg_backend_pid();" && \
            docker compose exec -T postgres psql -U aliasvault postgres -c "DROP DATABASE IF EXISTS aliasvault;" && \
            docker compose exec -T postgres psql -U aliasvault postgres -c "CREATE DATABASE aliasvault OWNER aliasvault;" && \
            gunzip -c "$temp_file" | docker compose exec -T postgres psql -U aliasvault aliasvault
        else
            docker compose exec -T postgres psql -U aliasvault postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'aliasvault' AND pid <> pg_backend_pid();" > /dev/null 2>&1 && \
            docker compose exec -T postgres psql -U aliasvault postgres -c "DROP DATABASE IF EXISTS aliasvault;" > /dev/null 2>&1 && \
            docker compose exec -T postgres psql -U aliasvault postgres -c "CREATE DATABASE aliasvault OWNER aliasvault;" > /dev/null 2>&1 && \
            gunzip -c "$temp_file" | docker compose exec -T postgres psql -U aliasvault aliasvault > /dev/null 2>&1
        fi
    fi

    import_status=$?
    rm "$temp_file"

    if [ $import_status -eq 0 ]; then
        printf "${GREEN}> Database imported successfully.${NC}\n"
        if [ "$DEV_DB" != true ]; then
            printf "${CYAN}> Starting services...${NC}\n"
            if [ "$VERBOSE" = true ]; then
                docker compose restart api admin task-runner smtp reverse-proxy
            else
                docker compose restart api admin task-runner smtp reverse-proxy > /dev/null 2>&1
            fi
        fi
    else
        printf "${RED}> Import failed. Please check that your backup file is valid.${NC}\n"
        exit 1
    fi
}

# Function to handle hostname configuration
handle_hostname_configuration() {
    printf "${YELLOW}+++ Hostname Configuration +++${NC}\n"
    printf "\n"

    # Check if AliasVault is installed
    if [ ! -f "docker-compose.yml" ]; then
        printf "${RED}Error: AliasVault must be installed first.${NC}\n"
        exit 1
    fi

    # Get current hostname
    CURRENT_HOSTNAME=$(grep "^HOSTNAME=" "$ENV_FILE" | cut -d '=' -f2)
    printf "Current hostname: ${CYAN}${CURRENT_HOSTNAME}${NC}\n"
    printf "\n"

    # Ask for new hostname
    while true; do
        read -p "Enter new hostname (e.g. aliasvault.net): " NEW_HOSTNAME
        if [ -n "$NEW_HOSTNAME" ]; then
            break
        else
            printf "${YELLOW}> Hostname cannot be empty. Please enter a valid hostname.${NC}\n"
        fi
    done

    # Update the hostname
    update_env_var "HOSTNAME" "$NEW_HOSTNAME"

    printf "\n"
    printf "${GREEN}Hostname updated successfully!${NC}\n"
    printf "New hostname: ${CYAN}${NEW_HOSTNAME}${NC}\n"
    printf "\n"
    printf "${MAGENTA}=========================================================${NC}\n"
}

# Function to handle IP logging configuration
handle_ip_logging_configuration() {
    # Get current IP logging setting
    CURRENT_SETTING=$(grep "^IP_LOGGING_ENABLED=" "$ENV_FILE" | cut -d '=' -f2)

    printf "${YELLOW}+++ Configure IP Address Logging +++${NC}\n"
    printf "\n"
    printf "Current setting: ${CYAN}${CURRENT_SETTING}${NC}\n"
    printf "\n"
    printf "1) Enable IP address logging\n"
    printf "2) Disable IP address logging\n"
    printf "\n"
    printf "Choose an option (1-2): "
    read -r choice

    case $choice in
        1)
            update_env_var "IP_LOGGING_ENABLED" "true"
            printf "${GREEN}> IP address logging enabled.${NC}\n"

            printf "\n${YELLOW}Warning: Docker containers need to be restarted to apply these changes.${NC}\n"
            read -p "Restart now? (y/n): " restart_confirm

            if [ "$restart_confirm" != "y" ] && [ "$restart_confirm" != "Y" ]; then
                printf "${YELLOW}Please restart manually to apply the changes.${NC}\n"
                exit 0
            fi

            handle_restart
            ;;
        2)
            update_env_var "IP_LOGGING_ENABLED" "false"
            printf "${GREEN}> IP address logging disabled.${NC}\n"

            printf "\n${YELLOW}Warning: Docker containers need to be restarted to apply these changes.${NC}\n"
            read -p "Restart now? (y/n): " restart_confirm

            if [ "$restart_confirm" != "y" ] && [ "$restart_confirm" != "Y" ]; then
                printf "${YELLOW}Please restart manually to apply the changes.${NC}\n"
                exit 0
            fi

            handle_restart
            ;;
        *)
            printf "${RED}Invalid option selected.${NC}\n"
            return 1
            ;;
    esac
}

main "$@"
