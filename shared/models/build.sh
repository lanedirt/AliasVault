#!/bin/bash

set -e  # Stop on error
set -u  # Treat unset variables as errors

# Define output targets for models
TARGETS=(
  "../../apps/browser-extension/src/utils/shared/models"
)

# Build and distribute models
package_name="models"
package_path="."

echo "📦 Building $package_name..."
npm install && npm run lint && npm run build

dist_path="dist"
files_to_copy=("index.d.mts" "index.mjs")

for target in "${TARGETS[@]}"; do
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
1. Update the source files in the \`/shared/models/src\` directory
2. Run the \`build.sh\` script in the module directory to regenerate the outputs and copy them here.
EOF
done

echo "✅ Models build and copy completed."