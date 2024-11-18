#!/bin/bash

# Import common functions
source common.sh

# Function to build and run Docker Compose
build_and_run_docker_compose() {
    printf "${CYAN}> Building Docker Compose stack...${NC}"
    if [ "$VERBOSE" = true ]; then
        docker compose -f docker-compose.yml -f docker-compose.build.yml build
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
                printf "\n${RED}> An error occurred while building the Docker Compose stack. Check install_compose_build_output.log for details.${NC}\n"
                exit $BUILD_EXIT_CODE
            fi
        )
    fi
    printf "\n${GREEN}> Docker Compose stack built successfully.${NC}\n"

    printf "${CYAN}> Starting Docker Compose stack...${NC}\n"
    if [ "$VERBOSE" = true ]; then
        docker compose -f docker-compose.yml -f docker-compose.build.yml up -d
    else
        docker compose -f docker-compose.yml -f docker-compose.build.yml up -d > /dev/null 2>&1
    fi
    printf "${GREEN}> Docker Compose stack started successfully.${NC}\n"
}

# Main function
main() {
    parse_args "$@"
    print_logo

    if [ "$RESET_PASSWORD" = true ]; then
        generate_admin_password
        if [ $? -eq 0 ]; then
            restart_docker_containers
            print_password_reset_message
        fi
    else
        printf "${YELLOW}+++ Building AliasVault from source +++${NC}\n"
        printf "\n"

        # Initialize environment
        create_env_file || exit $?
        populate_hostname || exit $?
        populate_jwt_key || exit $?
        populate_data_protection_cert_pass || exit $?
        set_private_email_domains || exit $?
        set_smtp_tls_enabled || exit $?
        set_support_email || exit $?

        # Only generate admin password if not already set
        if ! grep -q "^ADMIN_PASSWORD_HASH=" "$ENV_FILE" || [ -z "$(grep "^ADMIN_PASSWORD_HASH=" "$ENV_FILE" | cut -d '=' -f2)" ]; then
            generate_admin_password || exit $?
        fi

        printf "\n${YELLOW}+++ Building and starting services +++${NC}\n"
        printf "\n"
        build_and_run_docker_compose || exit $?

        print_success_message
    fi
}

# Run the main function
main "$@"
