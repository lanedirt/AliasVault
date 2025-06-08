#!/bin/bash

set -e  # Stop on error
set -u  # Treat unset variables as errors

# Define the root path to your packages
PACKAGES_DIR="./"

# Define output targets and their file patterns for each package
declare -A IDENTITY_FILES
IDENTITY_FILES=(
  ["index.js"]=1
  ["index.mjs"]=1
  ["index.d.ts"]=1
  ["index.js.map"]=1
  ["index.mjs.map"]=1
)

declare -A PASSWORD_FILES
PASSWORD_FILES=(
  ["index.js"]=1
  ["index.mjs"]=1
  ["index.d.ts"]=1
  ["index.js.map"]=1
  ["index.mjs.map"]=1
)

declare -A MODELS_FILES
MODELS_FILES=(
  ["*.ts"]=1
  ["*.d.ts"]=1
)

# Define output targets for each package
IDENTITY_TARGETS=(
  "../apps/browser-extension/src/utils/shared/identity-generator"
  "../apps/mobile-app/utils/shared/identity-generator"
  "../apps/server/AliasVault.Client/wwwroot/js/shared/identity-generator"
)

PASSWORD_TARGETS=(
  "../apps/browser-extension/src/utils/shared/password-generator"
  "../apps/mobile-app/utils/shared/password-generator"
  "../apps/server/AliasVault.Client/wwwroot/js/shared/password-generator"
)

MODELS_TARGETS=(
  "../apps/browser-extension/src/utils/shared/models"
)

# Build and distribute a package
build_and_copy() {
  local package_name="$1"
  shift
  local targets=("$@")
  local -n files_to_copy="$1"  # Use nameref to access the associative array

  local package_path="$PACKAGES_DIR/$package_name"

  echo "📦 Building $package_name..."
  (cd "$package_path" && npm install && npm run lint && npm run test && npm run build)

  local dist_path="$package_path/dist"

  for target in "${targets[@]}"; do
    echo "📂 Copying $package_name → $target"
    mkdir -p "$target"

    # Copy files based on the patterns defined in the associative array
    for pattern in "${!files_to_copy[@]}"; do
      if [[ "$pattern" == *"*"* ]]; then
        # Handle wildcard patterns
        find "$dist_path" -maxdepth 1 -name "$pattern" -exec cp {} "$target/" \;
      else
        # Handle specific files
        if [ -f "$dist_path/$pattern" ]; then
          cp "$dist_path/$pattern" "$target/"
        fi
      fi
    done

    # Write README
    cat > "$target/README.md" <<EOF
# ⚠️ Auto-Generated Files

This folder contains the output of the shared \`$package_name\` module from the \`/shared\` directory in the AliasVault project.

**Do not edit any of these files manually.**

To make changes:
1. Update the source files in \`packages/$package_name/src\`
2. Run the \`build-and-distribute.sh\` script at the root of the project to regenerate the outputs and copy them here.
EOF
  done
}

# Run build + copy for each module
build_and_copy "identity-generator" "${IDENTITY_TARGETS[@]}" IDENTITY_FILES
build_and_copy "password-generator" "${PASSWORD_TARGETS[@]}" PASSWORD_FILES
build_and_copy "models" "${MODELS_TARGETS[@]}" MODELS_FILES

echo "✅ All builds, copies, and readme updates completed."
