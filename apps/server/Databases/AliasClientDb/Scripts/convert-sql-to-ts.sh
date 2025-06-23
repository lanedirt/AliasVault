#!/bin/bash

# Script to convert SQL migration files to TypeScript constants
# Run this after generate-sql-files.sh to create SqlConstants.ts and VaultVersions.ts

# Configurable settings
SQL_DIR="MigrationSql"
OUTPUT_FILE="MigrationTs/SqlConstants.ts"
VERSIONS_FILE="MigrationTs/VaultVersions.ts"
TEMP_DIR="/tmp/sql_to_ts"

# Path to the shared vault-sql package
SHARED_SQL_DIR="../../../../../shared/vault-sql/src/sql"

# Create temp directory and output directory
mkdir -p "$TEMP_DIR"
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Function to escape SQL content for TypeScript
escape_sql_for_ts() {
    local sql_content="$1"
    # Escape backticks and backslashes
    echo "$sql_content" | sed 's/\\/\\\\/g' | sed 's/`/\\`/g'
}

# Function to extract migration number from filename
extract_migration_number() {
    local filename="$1"
    # Extract number from filename like "001_InitialMigration_to_AddEmail.sql"
    echo "$filename" | sed -n 's/^0*\([0-9]*\)_.*\.sql$/\1/p'
}

# Function to extract migration name from filename
extract_migration_name() {
    local filename="$1"
    # Extract name from filename like "001_InitialMigration_to_AddEmail.sql"
    echo "$filename" | sed -n 's/^[0-9]*_\(.*\)\.sql$/\1/p'
}

# Function to extract version, description, and release date from filename (using the last migration segment)
extract_version_info() {
    local filename="$1"
    # Get the last migration segment (after the last _)
    local last_segment=$(echo "$filename" | awk -F'_to_' '{print $NF}' | sed 's/\.sql$//')
    # last_segment example: 20250310131554_1.5.0-AddTotpCodes
    local timestamp=$(echo "$last_segment" | awk -F'_' '{print $1}')
    local version_and_desc=$(echo "$last_segment" | awk -F'_' '{print $2}')
    local version=$(echo "$version_and_desc" | awk -F'-' '{print $1}')
    local description=$(echo "$version_and_desc" | awk -F'-' '{print $2}')
    # Format date
    local year=${timestamp:0:4}
    local month=${timestamp:4:2}
    local day=${timestamp:6:2}
    local release_date="$year-$month-$day"
    # Make description readable
    local readable_desc=$(echo "$description" | sed 's/\([A-Z]\)/ \1/g' | sed 's/^./\U&/' | sed 's/^U //;s/^ *//')
    echo "$version|$readable_desc|$release_date"
}

# Function to copy files to shared vault-sql directory
copy_to_shared_sql() {
    local source_file="$1"
    local target_file="$2"

    if [ -f "$source_file" ]; then
        echo "Copying $source_file to $target_file"
        cp "$source_file" "$target_file"
        if [ $? -eq 0 ]; then
            echo "✓ Successfully copied to shared vault-sql directory"
        else
            echo "✗ Failed to copy to shared vault-sql directory"
            return 1
        fi
    else
        echo "✗ Source file $source_file not found"
        return 1
    fi
}

echo "Converting SQL files to TypeScript constants..."

# Start building the TypeScript file
cat > "$OUTPUT_FILE" << 'EOF'
/* eslint-disable no-irregular-whitespace */

/**
 * Complete database schema SQL (latest version)
 * Auto-generated from EF Core migrations
 */
export const COMPLETE_SCHEMA_SQL = `
EOF

# Add the full schema SQL if it exists
if [ -f "$SQL_DIR/000_FullSchema.sql" ]; then
    echo "Adding complete schema SQL..."
    FULL_SCHEMA=$(cat "$SQL_DIR/000_FullSchema.sql")
    ESCAPED_SCHEMA=$(escape_sql_for_ts "$FULL_SCHEMA")
    echo "$ESCAPED_SCHEMA" >> "$OUTPUT_FILE"
else
    echo "Warning: 000_FullSchema.sql not found"
fi

# Close the complete schema constant
cat >> "$OUTPUT_FILE" << 'EOF'
`;
/**
 * Individual migration SQL scripts
 * Auto-generated from EF Core migrations
 */
export const MIGRATION_SCRIPTS: Record<number, string> = {
EOF

# Process all migration files (excluding the full schema)
migration_files=($(ls "$SQL_DIR"/*.sql | grep -v "000_FullSchema.sql" | sort))

if [ ${#migration_files[@]} -eq 0 ]; then
    echo "No migration files found in $SQL_DIR"
    # Add empty object
    echo "};" >> "$OUTPUT_FILE"
    exit 0
fi

# Process each migration file
for file in "${migration_files[@]}"; do
    filename=$(basename "$file")
    migration_number=$(extract_migration_number "$filename")
    migration_name=$(extract_migration_name "$filename")

    if [ -z "$migration_number" ]; then
        echo "Warning: Could not extract migration number from $filename, skipping..."
        continue
    fi

    echo "Processing migration $migration_number: $migration_name"

    # Read and escape SQL content
    sql_content=$(cat "$file")
    escaped_sql=$(escape_sql_for_ts "$sql_content")

    # Add to TypeScript file
    cat >> "$OUTPUT_FILE" << EOF
  $migration_number: \`$escaped_sql\`,
EOF
done

# Close the TypeScript file
cat >> "$OUTPUT_FILE" << 'EOF'
};
EOF

echo "TypeScript constants file generated: $OUTPUT_FILE"
echo "Total migrations processed: ${#migration_files[@]}"

# Now generate the vault versions file
echo ""
echo "Generating vault versions mapping..."

# Start building the vault versions file
cat > "$VERSIONS_FILE" << 'EOF'
/**
 * Vault version information
 * Auto-generated from EF Core migration filenames
 */

import { IVaultVersion } from "../types/VaultVersion";

/**
 * Available vault versions in chronological order
 */
export const VAULT_VERSIONS: IVaultVersion[] = [
EOF

# Remove: declare -A versions_seen
last_version=""
for file in "${migration_files[@]}"; do
    filename=$(basename "$file")
    # Extract revision from filename prefix
    revision=$(echo "$filename" | sed -n 's/^0*\([0-9]*\)_.*$/\1/p')
    # Debug: print filename
    echo "DEBUG: Processing file $filename"
    last_segment=$(echo "$filename" | awk -F'_to_' '{print $NF}' | sed 's/\.sql$//')
    echo "DEBUG: Last segment: $last_segment"
    version_info=$(extract_version_info "$filename")
    version=$(echo "$version_info" | cut -d'|' -f1)
    description=$(echo "$version_info" | cut -d'|' -f2)
    release_date=$(echo "$version_info" | cut -d'|' -f3)

    echo "DEBUG: $filename -> revision='$revision', version='$version', description='$description', release_date='$release_date'"

    # Only output if version is not empty and not a duplicate of the last one
    if [ -n "$version" ] && [ -n "$description" ] && [ "$version" != "$last_version" ]; then
        last_version="$version"
        echo "Found version $version: $description ($release_date)"
        cat >> "$VERSIONS_FILE" << EOF
  {
    revision: $revision,
    version: '$version',
    description: '$description',
    releaseDate: '$release_date'
  },
EOF
    fi
done

# Close the vault versions file
cat >> "$VERSIONS_FILE" << 'EOF'
];
EOF

echo "Vault versions file generated: $VERSIONS_FILE"

# Copy generated files to shared vault-sql directory
echo ""
echo "Copying generated files to shared vault-sql directory..."

# Check if shared directory exists
if [ ! -d "$SHARED_SQL_DIR" ]; then
    echo "✗ Shared vault-sql directory not found: $SHARED_SQL_DIR"
    echo "Make sure you're running this script from the correct location"
    exit 1
fi

# Copy SqlConstants.ts
copy_to_shared_sql "$OUTPUT_FILE" "$SHARED_SQL_DIR/SqlConstants.ts"

# Copy VaultVersions.ts
copy_to_shared_sql "$VERSIONS_FILE" "$SHARED_SQL_DIR/VaultVersions.ts"

echo ""
echo "Done!"

# Clean up temp directory
rm -rf "$TEMP_DIR"