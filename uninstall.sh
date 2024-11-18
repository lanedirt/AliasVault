#!/bin/bash

# Import common functions
source common.sh

# Function to stop and remove Docker containers
stop_and_remove_containers() {
  printf "${CYAN}> Stopping and removing Docker containers...${NC}\n"
  if [ "$VERBOSE" = true ]; then
    docker compose -f docker-compose.yml -f docker-compose.build.yml down -v
  else
    docker compose -f docker-compose.yml -f docker-compose.build.yml down -v > /dev/null 2>&1
  fi
  printf "${GREEN}> Docker containers stopped and removed.${NC}\n"
}

# Function to remove Docker images
remove_docker_images() {
  printf "${CYAN}> Removing Docker images...${NC}\n"
  if [ "$VERBOSE" = true ]; then
    docker compose -f docker-compose.yml -f docker-compose.build.yml down --rmi all
  else
    docker compose -f docker-compose.yml -f docker-compose.build.yml down --rmi all > /dev/null 2>&1
  fi
  printf "${GREEN}> Docker images removed.${NC}\n"
}

# Function to prune Docker system
prune_docker_system() {
  printf "${CYAN}> Pruning Docker system...${NC}\n"
  if [ "$VERBOSE" = true ]; then
    docker system prune -af
  else
    docker system prune -af > /dev/null 2>&1
  fi
  printf "${GREEN}> Docker system pruned.${NC}\n"
}

# Main execution flow
main() {
  parse_args "$@"
  print_logo

  printf "${YELLOW}+++ Uninstalling AliasVault +++${NC}\n"
  printf "\n"

  stop_and_remove_containers
  remove_docker_images
  prune_docker_system

  printf "\n"
  printf "${MAGENTA}=========================================================${NC}\n"
  printf "\n"
  printf "AliasVault has been successfully uninstalled!\n"
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

# Run the main function
main "$@"
