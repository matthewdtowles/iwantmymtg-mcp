#!/usr/bin/env bash
# Build the MCPB bundle (.mcpb) for local one-click install on Smithery and
# Claude Desktop. Stages a production-only copy so dev dependencies and source
# never end up in the bundle. The bundle version is synced from package.json.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$ROOT/build/mcpb"
OUT="$ROOT/iwantmymtg-mcp.mcpb"

# CI already compiles before publishing, so it sets MCPB_SKIP_BUILD to reuse
# that output rather than compiling the same source twice.
if [ -z "${MCPB_SKIP_BUILD:-}" ]; then
  npm --prefix "$ROOT" run build
else
  echo "MCPB_SKIP_BUILD set; using the existing dist/."
  [ -d "$ROOT/dist" ] || { echo "dist/ is missing, so there is nothing to bundle." >&2; exit 1; }
fi

rm -rf "$ROOT/build"
mkdir -p "$STAGE"
cp -r "$ROOT/dist" "$STAGE/dist"
cp "$ROOT/package.json" "$ROOT/package-lock.json" "$ROOT/README.md" "$ROOT/manifest.json" "$STAGE/"

# Keep the bundle version in lockstep with package.json so it never drifts.
VERSION="$(node -p "require('$ROOT/package.json').version")"
node -e "const f='$STAGE/manifest.json',m=require(f);m.version='$VERSION';require('fs').writeFileSync(f,JSON.stringify(m,null,2)+'\n')"

# Production dependencies only.
( cd "$STAGE" && npm ci --omit=dev --ignore-scripts --no-audit --no-fund )

npx -y @anthropic-ai/mcpb pack "$STAGE" "$OUT"
echo "Built $OUT (v$VERSION)"
