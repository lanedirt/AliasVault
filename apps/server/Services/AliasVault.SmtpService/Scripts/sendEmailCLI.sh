#!/bin/bash

generate_random_string() {
    LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | fold -w ${1:-10} | head -n 1
}

generate_random_attachment() {
    local temp_file="/tmp/test_attachment_$(generate_random_string 8).txt"
    echo "This is a test attachment content - $(generate_random_string 32)" > "$temp_file"
    echo "$temp_file"
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
    local with_attachment="$2"
    local subject_suffix=$(generate_random_string 8)
    local content_suffix=$(generate_random_string 20)
    local boundary="boundary-$(generate_random_string 16)"
    local attachment_content="This is a test attachment content - $(generate_random_string 32)"
    local attachment_name="test_attachment_$(generate_random_string 8).txt"

    if [[ "$with_attachment" =~ ^[Yy]$ ]]; then
        {
            echo "From: sender@example.com"
            echo "To: $recipient"
            echo "Subject: Test Email with Attachment - $subject_suffix"
            echo "MIME-Version: 1.0"
            echo "Content-Type: multipart/mixed; boundary=$boundary"
            echo ""
            echo "--$boundary"
            echo "Content-Type: text/plain; charset=utf-8"
            echo ""
            echo "This is a test email with attachment."
            echo ""
            echo "Random content: $content_suffix"
            echo ""
            echo "--$boundary"
            echo "Content-Type: application/octet-stream"
            echo "Content-Transfer-Encoding: base64"
            echo "Content-Disposition: attachment; filename=\"$attachment_name\""
            echo ""
            echo "$attachment_content" | base64
            echo ""
            echo "--$boundary--"
        } | curl --url "smtp://localhost:25" \
                 --mail-from "sender@example.com" \
                 --mail-rcpt "$recipient" \
                 --upload-file -
    else
        {
            echo "From: sender@example.com"
            echo "To: $recipient"
            echo "Subject: Test Email - $subject_suffix"
            echo ""
            echo "This is a test email."
            echo ""
            echo "Random content: $content_suffix"
        } | curl --url "smtp://localhost:25" \
                 --mail-from "sender@example.com" \
                 --mail-rcpt "$recipient" \
                 --upload-file -
    fi
}

print_logo

while true; do
    if [[ -z "$recipient" ]]; then
        read -p "Enter the recipient's email address: " recipient
        read -p "Do you want to send emails with attachments? (y/N): " with_attachment
    fi

    send_email "$recipient" "$with_attachment"

    read -p "Send another email? (Press Enter for same recipient/settings, or type a new email, or 'q' to quit): " next_action

    if [[ "$next_action" == "q" ]]; then
        echo "Exiting the script. Goodbye!"
        exit 0
    elif [[ -n "$next_action" ]]; then
        recipient="$next_action"
        read -p "Do you want to send emails with attachments? (y/N): " with_attachment
    fi
done
