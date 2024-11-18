#!/bin/bash

# Import common functions from common.sh
source common.sh

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
        printf "${YELLOW}+++ Installing AliasVault +++${NC}\n"
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
            docker pull $image
        done

        # Start containers
        printf "\n${YELLOW}+++ Starting services +++${NC}\n"
        printf "\n"
        docker compose up -d

        print_success_message
    fi
}

# Run the main function
main "$@"
