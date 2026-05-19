# Onboarding — iwantmymtg-mcp

This is the MCP server for [iwantmymtg.net](https://iwantmymtg.net). It lets an
MCP client (e.g. Claude Code) search the MTG card catalog and manage your
personal collection — inventory, transactions, portfolio, and price alerts.

## How it works

```
MCP client  ──spawns──▶  npx -y iwantmymtg-mcp   (this server)
                                 │ HTTPS, Authorization: Bearer iwm_live_…
                                 ▼
                         iwantmymtg.net  ──▶ CloudFront ──▶ API
```

- The server is published to npm as `iwantmymtg-mcp`. `npx -y` fetches and runs
  it — no clone or build required.
- It reads two environment variables:
  - `IWMM_API_KEY` — your personal `iwm_live_…` key. Required only for
    authenticated tools (inventory, portfolio, transactions, alerts).
    Catalog tools (cards, sets, prices) work without it.
  - `IWMM_BASE_URL` — defaults to `https://iwantmymtg.net`. Override only for
    self-hosted or local-dev instances.

## Setup on a new computer / for a new user

Prerequisites: Node.js (provides `npx`).

1. Create an API key at <https://iwantmymtg.net/user/api-keys> (starts with
   `iwm_live_`). **Each person uses their own key — it is tied to their
   account. Do not share keys.**

2. Register the server at user scope so it is available in every directory:

   ```
   claude mcp add --scope user iwmm \
     --env IWMM_API_KEY=iwm_live_YOUR_OWN_KEY \
     --env IWMM_BASE_URL=https://iwantmymtg.net \
     -- npx -y iwantmymtg-mcp
   ```

   Omit `--env IWMM_API_KEY` entirely for catalog-only use (no account needed).
   `IWMM_BASE_URL` is optional since it matches the default.

3. Verify:

   ```
   claude mcp list
   ```

   Look for `iwmm: npx -y iwantmymtg-mcp - ✓ Connected`.

## Notes

- `npx -y` pulls the latest published version automatically; no manual updates.
- Configuration lives in `~/.claude.json` (user scope) — your key stays in your
  home config, outside any git repo.
- Do **not** commit a project `.mcp.json` containing a real key; it is
  gitignored for that reason.
- If authenticated tools return `401 "Authentication required"`, the API key is
  not reaching the origin — see the project memory on CloudFront `Authorization`
  header forwarding.

## Releasing a new version (maintainers)

Publishing is tag-driven, not merge-driven:

1. Merge changes into `main` and bump `version` in `package.json`.
2. Tag the tip of `main` and push the tag:

   ```
   git tag vX.Y.Z origin/main
   git push origin vX.Y.Z
   ```

3. The `publish.yml` workflow verifies the tag is reachable from `main`, runs
   build + tests, and publishes to npm via trusted publishing.
