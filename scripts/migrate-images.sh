#!/usr/bin/env bash
#
# This script is used to migrate Docker images from one host/namespace to another.
# Was used for migrating from lanedirt/aliasvault to aliasvault/aliasvault, kept for reference.
#
# mirror-multiarch.sh — copy ALL platforms from OLD_NS to NEW_NS using skopeo.
# Edit OLD_NS, NEW_NS, TAGS below.

# ----------------------- EDIT THESE -----------------------
OLD_NS="ghcr.io/lanedirt/aliasvault"
NEW_NS="ghcr.io/aliasvault/aliasvault"
TAGS=(
  0.7.0
  0.8.0
  0.8.1
  0.8.2
  0.8.3
  0.9.0
  0.9.1
  0.9.2
  0.9.3
  0.9.4
  0.10.0
  0.10.1
  0.10.2
  0.10.3
  0.11.0
  0.11.1
  0.12.0
  0.12.1
  0.12.2
  0.12.3
  0.13.0
  0.14.0
  0.15.0
  0.15.1
  0.16.0
  0.16.1
  0.16.2
  0.17.0
  0.17.1
  0.17.2
  0.17.3
  0.18.0
  0.18.1
  0.19.0
  0.19.1
  0.19.2
  0.20.0
  0.20.1
  0.20.2
  0.21.0
  0.21.1
  0.21.2
  0.22.0
  latest
)

# Optional auth (leave empty to use `skopeo login ghcr.io`)
SRC_CREDS=""   # "username:token" with read:packages for lanedirt
DST_CREDS=""   # "username:token" with write:packages for aliasvault
# -----------------------

set -euo pipefail

RETRIES=3
DRY_RUN=0      # set to 1 to print commands only

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1"; exit 1; }; }
need skopeo

src_args=()
dst_args=()
[[ -n "$SRC_CREDS" ]] && src_args+=( --src-creds "$SRC_CREDS" )
[[ -n "$DST_CREDS" ]] && dst_args+=( --dest-creds "$DST_CREDS" )

probe_exists() {
  local ref="$1"
  # Use --raw so skopeo doesn't try to pick darwin/arm64; works for manifest lists and single-manifest images.
  skopeo inspect --raw --retry-times "${RETRIES}" "${src_args[@]}" "docker://${ref}" >/dev/null 2>&1
}

copy_multiarch() {
  local src="$1" dst="$2"
  local cmd=(skopeo copy --all --retry-times "${RETRIES}" "${src_args[@]}" "${dst_args[@]}"
             "docker://${src}" "docker://${dst}")
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[DRY-RUN] ${cmd[*]}"
  else
    "${cmd[@]}"
  fi
}

echo "Source: ${OLD_NS}"
echo "Dest  : ${NEW_NS}"
[[ "$DRY_RUN" -eq 1 ]] && echo "(dry-run mode)"

for TAG in "${TAGS[@]}"; do
  SRC="${OLD_NS}:${TAG}"
  DST="${NEW_NS}:${TAG}"
  echo
  echo "Processing ${SRC} → ${DST}"

  if ! probe_exists "${SRC}"; then
    echo "Tag ${SRC} not found or not accessible; skipping"
    continue
  fi

  copy_multiarch "${SRC}" "${DST}"

  echo "Verified destination (manifest digest + platforms):"
  # Use --raw to avoid host-platform selection; then summarize platforms with jq if available.
  if command -v jq >/dev/null 2>&1; then
    man="$(skopeo inspect --raw "docker://${DST}")"
    mt="$(echo "$man" | jq -r '.mediaType // ""')"
    if [[ "$mt" == "application/vnd.docker.distribution.manifest.list.v2+json" || "$mt" == "application/vnd.oci.image.index.v1+json" ]]; then
      echo "$man" | jq -r '.manifests | map(.platform) | .[] | "\(.os)/\(.architecture)\(if .variant then "/\(.variant)" else "" end)"' | sort -u
    else
      echo "$man" | jq -r '.config.digest'
    fi
  else
    skopeo inspect --raw "docker://${DST}" >/dev/null && echo "(raw manifest retrieved)"
  fi
done

echo
echo "Done."
