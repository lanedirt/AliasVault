#!/bin/sh

# Define colors for CLI output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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
  printf "               Uninstall Script\n"
  printf "=========================================================\n"
  printf "${NC}\n"
}

# Function to stop and remove Docker containers
stop_and_remove_containers() {
  printf "${CYAN}> Stopping and removing Docker containers...${NC}\n"
  if [ "$VERBOSE" = true ]; then
    docker-compose down -v
  else
    docker-compose down -v > /dev/null 2>&1
  fi
  printf "${GREEN}> Docker containers stopped and removed.${NC}\n"
}

# Function to remove Docker images
remove_docker_images() {
  printf "${CYAN}> Removing Docker images...${NC}\n"
  if [ "$VERBOSE" = true ]; then
    docker-compose down --rmi all
  else
    docker-compose down --rmi all > /dev/null 2>&1
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
