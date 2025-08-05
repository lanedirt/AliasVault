#!/usr/bin/env bash

# Check if running with bash
if [ -z "$BASH_VERSION" ]; then
    echo "Error: This script must be run with bash"
    echo "Usage: bash $0"
    exit 1
fi

# Function to read and validate semantic version
read_semver() {
    # Get current version from server
    local current_major=$(grep "public const int VersionMajor = " ../apps/server/Shared/AliasVault.Shared.Core/AppInfo.cs | tr -d ';' | tr -d ' ' | cut -d'=' -f2)
    local current_minor=$(grep "public const int VersionMinor = " ../apps/server/Shared/AliasVault.Shared.Core/AppInfo.cs | tr -d ';' | tr -d ' ' | cut -d'=' -f2)
    local suggested_version="${current_major}.$((current_minor + 1)).0"

    while true; do
        read -p "Enter new semantic version [$suggested_version]: " version
        # If empty, use suggested version
        if [[ -z "$version" ]]; then
            version=$suggested_version
        fi
        if [[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            break
        else
            echo "Invalid version format. Please use format X.Y.Z (e.g. $suggested_version)"
        fi
    done
}

# Function to handle build number bump
handle_build_number() {
    local current_build=$1
    local project_name=$2
    local new_build=$((current_build + 1))

    read -p "$project_name ($current_build). Enter new build number [$new_build]: " input

    if [[ -z "$input" || "$input" =~ ^[Yy]$ ]]; then
        echo $new_build
    else
        if [[ "$input" =~ ^[0-9]+$ ]]; then
            echo $input
        else
            echo "Invalid input. Using default increment."
            echo $new_build
        fi
    fi
}

# Function to update version in a file
update_version() {
    local file=$1
    local pattern=$2
    local replacement=$3
    local project_name=$4

    if [ -f "$file" ]; then
        # Create a temporary file
        local temp_file=$(mktemp)
        # Replace the pattern and write to temp file
        awk -v pat="$pattern" -v rep="$replacement" '{gsub(pat, rep); print}' "$file" > "$temp_file"
        # Move temp file back to original
        mv "$temp_file" "$file"
    else
        echo "Warning: File $file not found"
    fi
}

# Function to extract version from server AppInfo.cs
get_server_version() {
    local major=$(grep "public const int VersionMajor = " ../apps/server/Shared/AliasVault.Shared.Core/AppInfo.cs | tr -d ';' | tr -d ' ' | cut -d'=' -f2)
    local minor=$(grep "public const int VersionMinor = " ../apps/server/Shared/AliasVault.Shared.Core/AppInfo.cs | tr -d ';' | tr -d ' ' | cut -d'=' -f2)
    local patch=$(grep "public const int VersionPatch = " ../apps/server/Shared/AliasVault.Shared.Core/AppInfo.cs | tr -d ';' | tr -d ' ' | cut -d'=' -f2)
    echo "$major.$minor.$patch"
}

# Function to extract version from browser extension config
get_browser_extension_version() {
    grep "version: " ../apps/browser-extension/wxt.config.ts | head -n1 | tr -d '"' | tr -d ',' | tr -d ' ' | cut -d':' -f2
}

# Function to extract version from browser extension package.json
get_browser_extension_package_json_version() {
    grep "\"version\": " ../apps/browser-extension/package.json | tr -d '"' | tr -d ',' | tr -d ' ' | cut -d':' -f2
}

# Function to extract version from browser extension AppInfo.ts
get_browser_extension_ts_version() {
    grep "public static readonly VERSION = " ../apps/browser-extension/src/utils/AppInfo.ts | tr -d "'" | tr -d ';' | tr -d ' ' | cut -d'=' -f2
}

# Function to extract version from mobile app
get_mobile_app_version() {
    grep "\"version\": " ../apps/mobile-app/app.json | tr -d '"' | tr -d ',' | tr -d ' ' | cut -d':' -f2
}

get_mobile_app_ts_version() {
    grep "public static readonly VERSION = " ../apps/mobile-app/utils/AppInfo.ts | tr -d "'" | tr -d ';' | tr -d ' ' | cut -d'=' -f2
}

# Function to extract version from iOS app
get_ios_version() {
    grep "MARKETING_VERSION = " ../apps/mobile-app/ios/AliasVault.xcodeproj/project.pbxproj | head -n1 | tr -d '"' | tr -d ';' | tr -d ' ' | cut -d'=' -f2
}

# Function to extract version from Android app
get_android_version() {
    grep "versionName " ../apps/mobile-app/android/app/build.gradle | head -n1 | tr -d '"' | tr -d ' ' | cut -d'=' -f2 | sed 's/versionName//'
}

# Function to extract version from Safari extension
get_safari_version() {
    grep "MARKETING_VERSION = " ../apps/browser-extension/safari-xcode/AliasVault/AliasVault.xcodeproj/project.pbxproj | head -n1 | tr -d '"' | tr -d ';' | tr -d ' ' | cut -d'=' -f2
}

# Check current versions
echo "Checking current versions..."
server_version=$(get_server_version)
browser_wxt_version=$(get_browser_extension_version)
browser_package_version=$(get_browser_extension_package_json_version)
browser_ts_version=$(get_browser_extension_ts_version)
mobile_version=$(get_mobile_app_version)
mobile_ts_version=$(get_mobile_app_ts_version)
ios_version=$(get_ios_version)
android_version=$(get_android_version)
safari_version=$(get_safari_version)

# Create associative array of versions
declare -A versions
versions["server"]="$server_version"
versions["browser_wxt"]="$browser_wxt_version"
versions["browser_package"]="$browser_package_version"
versions["browser_ts"]="$browser_ts_version"
versions["mobile"]="$mobile_version"
versions["mobile_ts"]="$mobile_ts_version"
versions["ios"]="$ios_version"
versions["android"]="$android_version"
versions["safari"]="$safari_version"

# Create display names for output
declare -A display_names
display_names["server"]="Server"
display_names["browser_wxt"]="Browser Extension (wxt.config.ts)"
display_names["browser_package"]="Browser Extension (package.json)"
display_names["browser_ts"]="Browser Extension (AppInfo.ts)"
display_names["mobile"]="Mobile App"
display_names["mobile_ts"]="Mobile App (TS)"
display_names["ios"]="iOS App"
display_names["android"]="Android App"
display_names["safari"]="Safari Extension"

# Check if all versions are equal
all_equal=true
first_version=""
for project in "${!versions[@]}"; do
    if [[ -z "$first_version" ]]; then
        first_version="${versions[$project]}"
    elif [[ "${versions[$project]}" != "$first_version" ]]; then
        all_equal=false
        break
    fi
done

# Print current versions
echo -e "\nCurrent versions:"
for project in "${!versions[@]}"; do
    echo "${display_names[$project]}: ${versions[$project]}"
done

# If versions are not equal, ask for confirmation
if [[ "$all_equal" == false ]]; then
    echo -e "\nWARNING: Not all versions are equal!"
    echo "Different versions found:"
    for project in "${!versions[@]}"; do
        if [[ "${versions[$project]}" != "$first_version" ]]; then
            echo "${display_names[$project]}: ${versions[$project]} (differs from $first_version)"
        fi
    done
    read -p "Do you want to continue with the version bump? (y/N) " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Version bump cancelled."
        exit 1
    fi
fi

# Read new version
echo -e "\nEnter new version:"
read_semver

# Extract major, minor, patch from version
major=$(echo $version | cut -d. -f1)
minor=$(echo $version | cut -d. -f2)
patch=$(echo $version | cut -d. -f3)

# Update server version
echo -e "\nUpdating server version..."
update_version "../apps/server/Shared/AliasVault.Shared.Core/AppInfo.cs" \
    "public const int VersionMajor = [0-9]\+;" \
    "public const int VersionMajor = $major;"
update_version "../apps/server/Shared/AliasVault.Shared.Core/AppInfo.cs" \
    "public const int VersionMinor = [0-9]\+;" \
    "public const int VersionMinor = $minor;"
update_version "../apps/server/Shared/AliasVault.Shared.Core/AppInfo.cs" \
    "public const int VersionPatch = [0-9]\+;" \
    "public const int VersionPatch = $patch;"

# Update browser extension version
echo "Updating browser extension version..."
update_version "../apps/browser-extension/wxt.config.ts" \
    "version: \"[0-9]\+\.[0-9]\+\.[0-9]\+\"," \
    "version: \"$version\","

# Update package.json version
echo "Updating package.json version..."
update_version "../apps/browser-extension/package.json" \
    "\"version\": \"[0-9]\+\.[0-9]\+\.[0-9]\+\"," \
    "\"version\": \"$version\","

# Update browser extension AppInfo.ts version
echo "Updating browser extension AppInfo.ts version..."
update_version "../apps/browser-extension/src/utils/AppInfo.ts" \
    "public static readonly VERSION = '[0-9]\+\.[0-9]\+\.[0-9]\+';" \
    "public static readonly VERSION = '$version';"

# Update generic mobile app version
echo "Updating mobile app version..."
update_version "../apps/mobile-app/utils/AppInfo.ts" \
    "public static readonly VERSION = '[0-9]\+\.[0-9]\+\.[0-9]\+';" \
    "public static readonly VERSION = '$version';"
update_version "../apps/mobile-app/app.json" \
    "\"version\": \"[0-9]\+\.[0-9]\+\.[0-9]\+\"," \
    "\"version\": \"$version\","


# Update iOS app version
echo "Updating iOS app version..."
update_version "../apps/mobile-app/ios/AliasVault.xcodeproj/project.pbxproj" \
    "MARKETING_VERSION = [0-9]\+\.[0-9]\+\.[0-9]\+;" \
    "MARKETING_VERSION = $version;"

# Update Android app version
echo "Updating Android app version..."
update_version "../apps/mobile-app/android/app/build.gradle" \
    "versionName \"[0-9]\+\.[0-9]\+\.[0-9]\+\"" \
    "versionName \"$version\""

# Update Safari extension version
echo "Updating Safari extension version..."
update_version "../apps/browser-extension/safari-xcode/AliasVault/AliasVault.xcodeproj/project.pbxproj" \
    "MARKETING_VERSION = [0-9]\+\.[0-9]\+\.[0-9]\+;" \
    "MARKETING_VERSION = $version;"

# Handle build numbers
echo -e "\nIncrementing build numbers..."

# Read current build numbers
current_ios_build=$(grep -A1 "CURRENT_PROJECT_VERSION" ../apps/mobile-app/ios/AliasVault.xcodeproj/project.pbxproj | grep "CURRENT_PROJECT_VERSION = [0-9]\+;" | head -n1 | tr -d ';' | tr -d ' ' | cut -d'=' -f2 | grep -E '^[0-9]+$')
if [ -z "$current_ios_build" ]; then
    echo "Error: Could not read iOS build number or invalid format"
    exit 1
fi

current_android_build=$(grep "versionCode" ../apps/mobile-app/android/app/build.gradle | grep -E "versionCode [0-9]+" | head -n1 | awk '{print $2}' | grep -E '^[0-9]+$')
if [ -z "$current_android_build" ]; then
    echo "Error: Could not read Android build number or invalid format"
    exit 1
fi

current_safari_build=$(grep -A1 "CURRENT_PROJECT_VERSION" ../apps/browser-extension/safari-xcode/AliasVault/AliasVault.xcodeproj/project.pbxproj | grep "CURRENT_PROJECT_VERSION = [0-9]\+;" | head -n1 | tr -d ';' | tr -d ' ' | cut -d'=' -f2 | grep -E '^[0-9]+$')
if [ -z "$current_safari_build" ]; then
    echo "Error: Could not read Safari build number or invalid format"
    exit 1
fi

# Handle iOS build number
new_ios_build=$(handle_build_number "$current_ios_build" "iOS Mobile App")
update_version "../apps/mobile-app/ios/AliasVault.xcodeproj/project.pbxproj" \
    "CURRENT_PROJECT_VERSION = [0-9]\+;" \
    "CURRENT_PROJECT_VERSION = $new_ios_build;" \
    "iOS Mobile App"

# Handle Android build number
new_android_build=$(handle_build_number "$current_android_build" "Android App")
update_version "../apps/mobile-app/android/app/build.gradle" \
    "versionCode [0-9]\+" \
    "versionCode $new_android_build" \
    "Android App"

# Handle Safari build number
new_safari_build=$(handle_build_number "$current_safari_build" "Safari Extension")
update_version "../apps/browser-extension/safari-xcode/AliasVault/AliasVault.xcodeproj/project.pbxproj" \
    "CURRENT_PROJECT_VERSION = [0-9]\+;" \
    "CURRENT_PROJECT_VERSION = $new_safari_build;" \
    "Safari Extension"

# Show reminders
echo -e "\n"
echo "--------------------------------"
echo "IMPORTANT REMINDERS:"
echo "--------------------------------"

# Install.sh reminder
echo "• If you've made changes to install.sh since the last release, remember to update its @version in the header to match this release version ($version)."

# Changelog reminder
echo "• Add changelogs for new version $version to the /fastlane directory:"
echo "  - iOS: fastlane/metadata/ios/[lang]/changelogs/$(echo $new_ios_build | cut -d. -f1-2).txt"
echo "  - Android: fastlane/metadata/android/[lang]/changelogs/$(echo $new_android_build | cut -d. -f1-2).txt"
echo "  - Browser Extension: fastlane/metadata/browser-extension/[lang]/changelogs/$version.txt"

echo "--------------------------------"
read -p "Press Enter to continue..."

echo -e "\nAll build numbers have been updated successfully!"
echo "New version: $version"
echo "New iOS mobile app build: $new_ios_build"
echo "New Android build: $new_android_build"
echo "New Safari extension build: $new_safari_build"