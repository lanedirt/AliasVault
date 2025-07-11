#!/usr/bin/env bash

# Check if running with bash
if [ -z "$BASH_VERSION" ]; then
    echo "Error: This script must be run with bash"
    echo "Usage: bash $0"
    exit 1
fi

# Script to export all existing translation files from AliasVault
# Based on the paths defined in crowdin.yml
# Excludes English source files and preserves full directory structure

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to create directory if it doesn't exist
ensure_dir() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        print_status "Created directory: $dir"
    fi
}

# Function to copy file if it exists
copy_if_exists() {
    local src="$1"
    local dest="$2"

    if [ -f "$src" ]; then
        ensure_dir "$(dirname "$dest")"
        cp "$src" "$dest"
        print_success "Copied: $src -> $dest"
        return 0
    else
        print_warning "File not found: $src"
        return 1
    fi
}



# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root
cd "$PROJECT_ROOT"

print_status "Starting translation export from: $PROJECT_ROOT"

# Define target directory for export
EXPORT_DIR="translation_export_$(date +%Y%m%d_%H%M%S)"
print_status "Export directory: $EXPORT_DIR"

# Create export directory
ensure_dir "$EXPORT_DIR"

# Languages to export (from crowdin.yml)
LANGUAGES=("nl" "de" "fr" "es" "it" "pt" "uk" "zh" "ja" "ko")

# Counter for statistics
TOTAL_FILES=0
COPIED_FILES=0
MISSING_FILES=0

print_status "Exporting translations for languages: ${LANGUAGES[*]}"



# ============================================================================
# Export translation files based on crowdin.yml paths
# ============================================================================

print_status "Processing Web App (Blazor WASM) translations..."

# Blazor WASM Client JSON localization files
for lang in "${LANGUAGES[@]}"; do
    src="apps/server/AliasVault.Client/wwwroot/locales/$lang.json"
    dest="$EXPORT_DIR/apps/server/AliasVault.Client/wwwroot/locales/$lang.json"
    if copy_if_exists "$src" "$dest"; then
        ((COPIED_FILES++))
    else
        ((MISSING_FILES++))
    fi
    ((TOTAL_FILES++))
done

# .NET Resource files (RESX) for Blazor components
for lang in "${LANGUAGES[@]}"; do
    src="apps/server/AliasVault.Client/Resources/SharedResources.$lang.resx"
    dest="$EXPORT_DIR/apps/server/AliasVault.Client/Resources/SharedResources.$lang.resx"
    if copy_if_exists "$src" "$dest"; then
        ((COPIED_FILES++))
    else
        ((MISSING_FILES++))
    fi
    ((TOTAL_FILES++))
done

# Blazor component resource files (find all .en.resx files and copy their translations)
while IFS= read -r -d '' en_file; do
    for lang in "${LANGUAGES[@]}"; do
        # Replace .en.resx with .$lang.resx
        src="${en_file%.en.resx}.$lang.resx"
        # Create destination path maintaining structure
        rel_path="${src#apps/server/AliasVault.Client/Resources/}"
        dest="$EXPORT_DIR/apps/server/AliasVault.Client/Resources/$rel_path"
        if copy_if_exists "$src" "$dest"; then
            ((COPIED_FILES++))
        else
            ((MISSING_FILES++))
        fi
        ((TOTAL_FILES++))
    done
done < <(find apps/server/AliasVault.Client/Resources -name "*.en.resx" -type f -print0)

# ============================================================================
# Browser Extension
# ============================================================================

print_status "Processing Browser Extension translations..."

# Browser Extension JSON translation files (nested structure)
# Find all English JSON files and copy their translations
while IFS= read -r -d '' en_file; do
    for lang in "${LANGUAGES[@]}"; do
        # Get relative path from en directory
        rel_path="${en_file#apps/browser-extension/src/locales/en/}"
        src="apps/browser-extension/src/locales/$lang/$rel_path"
        dest="$EXPORT_DIR/apps/browser-extension/src/locales/$lang/$rel_path"
        if copy_if_exists "$src" "$dest"; then
            ((COPIED_FILES++))
        else
            ((MISSING_FILES++))
        fi
        ((TOTAL_FILES++))
    done
done < <(find apps/browser-extension/src/locales/en -name "*.json" -type f -print0)

# ============================================================================
# Mobile App (React Native + Native iOS/Android)
# ============================================================================

print_status "Processing Mobile App translations..."

# React Native JSON translation files
for lang in "${LANGUAGES[@]}"; do
    src="apps/mobile-app/i18n/locales/$lang.json"
    dest="$EXPORT_DIR/apps/mobile-app/i18n/locales/$lang.json"
    if copy_if_exists "$src" "$dest"; then
        ((COPIED_FILES++))
    else
        ((MISSING_FILES++))
    fi
    ((TOTAL_FILES++))
done

# iOS native localization files
for lang in "${LANGUAGES[@]}"; do
    # AliasVault main app
    src="apps/mobile-app/ios/AliasVault/$lang.lproj/Localizable.strings"
    dest="$EXPORT_DIR/apps/mobile-app/ios/AliasVault/$lang.lproj/Localizable.strings"
    if copy_if_exists "$src" "$dest"; then
        ((COPIED_FILES++))
    else
        ((MISSING_FILES++))
    fi
    ((TOTAL_FILES++))

    src="apps/mobile-app/ios/AliasVault/$lang.lproj/InfoPlist.strings"
    dest="$EXPORT_DIR/apps/mobile-app/ios/AliasVault/$lang.lproj/InfoPlist.strings"
    if copy_if_exists "$src" "$dest"; then
        ((COPIED_FILES++))
    else
        ((MISSING_FILES++))
    fi
    ((TOTAL_FILES++))

    # iOS Autofill extension
    src="apps/mobile-app/ios/Autofill/$lang.lproj/Localizable.strings"
    dest="$EXPORT_DIR/apps/mobile-app/ios/Autofill/$lang.lproj/Localizable.strings"
    if copy_if_exists "$src" "$dest"; then
        ((COPIED_FILES++))
    else
        ((MISSING_FILES++))
    fi
    ((TOTAL_FILES++))

    # iOS VaultUI framework
    src="apps/mobile-app/ios/VaultUI/$lang.lproj/Localizable.strings"
    dest="$EXPORT_DIR/apps/mobile-app/ios/VaultUI/$lang.lproj/Localizable.strings"
    if copy_if_exists "$src" "$dest"; then
        ((COPIED_FILES++))
    else
        ((MISSING_FILES++))
    fi
    ((TOTAL_FILES++))
done

# Android native localization files
for lang in "${LANGUAGES[@]}"; do
    src="apps/mobile-app/android/app/src/main/res/values-$lang/strings.xml"
    dest="$EXPORT_DIR/apps/mobile-app/android/app/src/main/res/values-$lang/strings.xml"
    if copy_if_exists "$src" "$dest"; then
        ((COPIED_FILES++))
    else
        ((MISSING_FILES++))
    fi
    ((TOTAL_FILES++))
done

# ============================================================================
# Summary and cleanup
# ============================================================================

print_status "Export completed!"
print_success "Export directory: $EXPORT_DIR"
print_status "Statistics:"
print_status "  Total files processed: $TOTAL_FILES"
print_status "  Translation files copied: $COPIED_FILES"
print_status "  Translation files missing: $MISSING_FILES"

if [ $MISSING_FILES -gt 0 ]; then
    print_warning "Some translation files were not found. This is normal if translations are not complete for all languages."
fi

print_status "Export structure:"
print_status "  - Only translation files copied (as defined in crowdin.yml)"
print_status "  - Full directory hierarchy preserved for translation files"
print_status "  - Ready for distribution or archiving"

# Create zip archive in scripts folder
ZIP_NAME="translation_export_$(date +%Y%m%d_%H%M%S).zip"
ZIP_PATH="$SCRIPT_DIR/$ZIP_NAME"

print_status "Creating zip archive..."
if command -v zip >/dev/null 2>&1; then
    cd "$EXPORT_DIR"
    zip -r "$ZIP_PATH" . >/dev/null 2>&1
    cd "$PROJECT_ROOT"
    print_success "Zip archive created: $ZIP_PATH"
else
    print_warning "zip command not available. Please install zip or manually create archive."
fi

print_status "Export completed!"
print_success "Export directory: $EXPORT_DIR"
print_success "Zip archive: $ZIP_PATH"
print_status "Statistics:"
print_status "  Total files processed: $TOTAL_FILES"
print_status "  Translation files copied: $COPIED_FILES"
print_status "  Translation files missing: $MISSING_FILES"

if [ $MISSING_FILES -gt 0 ]; then
    print_warning "Some translation files were not found. This is normal if translations are not complete for all languages."
fi

print_status "Export structure:"
print_status "  - Only translation files copied (as defined in crowdin.yml)"
print_status "  - Full directory hierarchy preserved for translation files"
print_status "  - Ready for distribution or archiving"

print_status "You can now upload the zip file: $ZIP_PATH"
