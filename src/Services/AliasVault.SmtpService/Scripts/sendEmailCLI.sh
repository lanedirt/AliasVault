#!/bin/bash

generate_random_string() {
    cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w ${1:-10} | head -n 1
}

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
  printf "                Email sender DevTool\n"
  printf "=========================================================\n"
  printf "This tool sends an email to the recipient of your choice\n"
  printf "and delivers it to the local SMTP server running on localhost:25.\n"
  printf "${NC}\n"
}

send_email() {
    local recipient="$1"
    local subject_suffix=$(generate_random_string 8)
    local content_suffix=$(generate_random_string 20)

    cat > temp_email.txt << EOF
From: sender@example.com
To: $recipient
Subject: Test Email - $subject_suffix

This is a test email.

Random content: $content_suffix
EOF

    curl --url "smtp://localhost:25" \
         --mail-from "sender@example.com" \
         --mail-rcpt "$recipient" \
         --upload-file temp_email.txt

    rm temp_email.txt
}

print_logo

while true; do
    if [[ -z "$recipient" ]]; then
        read -p "Enter the recipient's email address: " recipient
    fi

    send_email "$recipient"

    read -p "Send another email? (Press Enter for same recipient, or type a new email, or 'q' to quit): " next_action

    if [[ "$next_action" == "q" ]]; then
        echo "Exiting the script. Goodbye!"
        exit 0
    elif [[ -n "$next_action" ]]; then
        recipient="$next_action"
    else
        # If next_action is empty (user pressed Enter), keep the same recipient
        :
    fi
done
