#!/bin/bash

# Make sure to install the dotnet ef tool first before running this script:
# dotnet tool install --global dotnet-ef

# Configurable settings
PROJECT="../AliasClientDb.csproj"
STARTUP_PROJECT="../AliasClientDb.csproj"   # Adjust if different from main project
CONTEXT="AliasClientDbContext"
OUTPUT_DIR="MigrationSql"
FULL_FILE="$OUTPUT_DIR/000_FullSchema.sql"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Use 'set --' to build a list of pending migrations into $1 $2 ...
set -- $(dotnet ef migrations list \
  --project "$PROJECT" \
  --startup-project "$STARTUP_PROJECT" \
  --context "$CONTEXT" 2>/dev/null \
  | grep '(Pending)' \
  | sed 's/ (Pending)//')

TOTAL=$#

# Generate full script from scratch if any pending migrations exist
if [ "$TOTAL" -gt 0 ]; then
  echo "Generating full schema script..."
  dotnet ef migrations script \
    --project "$PROJECT" \
    --startup-project "$STARTUP_PROJECT" \
    --context "$CONTEXT" \
    --output "$FULL_FILE"
else
  echo "No pending migrations found. Skipping full script."
fi

# Also generate per-migration scripts if enough exist
if [ "$TOTAL" -lt 2 ]; then
  echo "Not enough pending migrations to generate step-by-step scripts."
  exit 0
fi

# Loop over migration pairs
i=1
while [ "$i" -le "$TOTAL" ]; do
  j=$((i + 1))
  FROM=$(eval echo \${$i})
  TO=$(eval echo \${$j})
  FILE="$OUTPUT_DIR/$(printf "%03d" "$i")_${FROM}_to_${TO}.sql"

  echo "Generating script: $FROM -> $TO"
  dotnet ef migrations script "$FROM" "$TO" \
    --project "$PROJECT" \
    --startup-project "$STARTUP_PROJECT" \
    --context "$CONTEXT" \
    --output "$FILE"

  i=$((i + 1))
done

echo "Done. Scripts written to $OUTPUT_DIR"