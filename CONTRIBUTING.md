# Contributing

## Generated API types

`src/generated/api-types.ts` is generated from `https://iwantmymtg.net/api/openapi.json` by `openapi-typescript`. It is checked into the repo so fresh clones and IDEs work without running a build first.

### When it regenerates

- **`npm run build`** runs `prebuild` → `build:types` every time, so a local build refreshes the file — commit it if it changed.
- **CI** builds against the committed types (`IWMM_SKIP_TYPEGEN=1`) so PR runs are deterministic and not coupled to the live API.
- **Automatically:** the weekly **Sync generated artifacts** workflow (`.github/workflows/sync.yml`) regenerates the types (and `docs/TOOLS.md`) from the live spec, validates they still build and test, and opens a `chore:` PR when anything changed. Run it on demand from the Actions tab.
- **Manually:** `npm run build:types`.

### Pointing at a different API

```bash
IWMM_OPENAPI_URL=http://localhost:3000/api/openapi.json npm run build:types
```

Default is the production spec at `https://iwantmymtg.net/api/openapi.json`.

### Handling breaking API changes

When `iwantmymtg` ships an API change that breaks the generated types:

1. Run `npm run build:types` and commit the regenerated file.
2. `npx tsc --noEmit` surfaces every site that needs to change.
3. Fix tool handlers; existing zod input schemas at the tool boundary stay as-is — they describe the LLM-facing contract, not the wire format.
4. Merge as usual — releases are automatic (see [Releasing](#releasing)).

### Adding a new tool

Use the typed `apiClient`, which checks paths and params against the generated spec:

```ts
import { apiClient } from "../api-client.js";

const { data, error } = await apiClient.GET("/api/v1/cards/{setCode}/{setNumber}", {
  params: { path: { setCode, setNumber } },
});
```

For authenticated endpoints, pass the `AUTH_HEADERS` sentinel:

```ts
import { apiClient, AUTH_HEADERS } from "../api-client.js";

const { data, error } = await apiClient.GET("/api/v1/inventory", {
  headers: AUTH_HEADERS,
});
```

The middleware in `api-client.ts` swaps `X-IWMM-Auth: required` for a `Bearer` token from `IWMM_API_KEY` and throws `ApiError` on non-2xx responses with rate-limit headers attached.

After adding or changing a tool, register it in `src/tools/index.ts` and run `npm run gen:tools-doc` to refresh `docs/TOOLS.md`. CI fails (`npm run check:tools-doc`) if that file is stale. Authenticated tools must end their description with `Requires IWMM_API_KEY.` — that's how the catalog (and a test) sort tools into the key/no-key buckets.

## Releasing

Releases are fully automatic and driven by the **squash-merge PR title** — the same scheme as the `i-want-my-mtg` and `scry` repos. Don't hand-edit version numbers.

- Git tags are the source of truth. `package.json`, `server.json`, and `manifest.json` all stay at the `0.0.0-dev` placeholder and are stamped from the computed version at publish time, so versions can't drift across files.
- The PR title decides the bump (`.github/scripts/next-version.sh`): `feat:` → minor, `fix:`/`docs:`/`chore:`/etc → patch, a `!` (e.g. `feat!:`) → major.
- On merge to `main`, CI computes the version, creates the tag + GitHub release, and publishes to npm, the MCP Registry, and Smithery. Re-runs are idempotent (a version already on npm is skipped).

So: title the PR by the change you want released, merge, and the version follows.
