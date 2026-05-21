# Contributing

## Generated API types

`src/generated/api-types.ts` is generated from `https://iwantmymtg.net/api/openapi.json` by `openapi-typescript`. It is checked into the repo so fresh clones and IDEs work without running a build first.

### When it regenerates

- **`npm run build`** runs `prebuild` → `build:types` every time.
- **CI** runs `npm run build` on every push/PR, so PRs with stale generated types will diff.
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
4. Bump version in `package.json` and tag — `publish.yml` releases on tag.

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
