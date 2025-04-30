#!/bin/bash

set -e  # Stop on error
set -u  # Treat unset variables as errors

# Define the root path to your packages
PACKAGES_DIR="./"

# Define output targets for each package
IDENTITY_TARGETS=(
  #"../apps/mobile-app/shared/identity-generator"
  "../apps/browser-extension/src/utils/shared/identity-generator"
)

PASSWORD_TARGETS=(
  #"../apps/mobile-app/shared/password-generator"
  "../apps/browser-extension/src/utils/shared/password-generator"
)

# Build and distribute a package
build_and_copy() {
  local package_name="$1"
  shift
  local targets=("$@")

  local package_path="$PACKAGES_DIR/$package_name"

  echo "📦 Building $package_name..."
  (cd "$package_path" && npm install && npm run build)

  local dist_path="$package_path/dist"
  local files_to_copy=("index.js" "index.mjs" "index.d.ts" "index.js.map" "index.mjs" "index.mjs.map")

  for target in "${targets[@]}"; do
    echo "📂 Copying $package_name → $target"
    mkdir -p "$target"

    # Copy specific build outputs
    for file in "${files_to_copy[@]}"; do
      cp "$dist_path/$file" "$target/"
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
build_and_copy "identity-generator" "${IDENTITY_TARGETS[@]}"
build_and_copy "password-generator" "${PASSWORD_TARGETS[@]}"

echo "✅ All builds, copies, and readme updates completed."
