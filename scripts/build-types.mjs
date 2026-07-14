#!/usr/bin/env node
import { execFileSync } from "node:child_process";

if (process.env.IWMM_SKIP_TYPEGEN === "1") {
  console.log("IWMM_SKIP_TYPEGEN=1 set; skipping OpenAPI type regeneration.");
  process.exit(0);
}

const url = process.env.IWMM_OPENAPI_URL ?? "https://iwantmymtg.net/api/openapi.json";

try {
  execFileSync("npx", ["openapi-typescript", url, "-o", "src/generated/api-types.ts"], {
    stdio: "inherit",
  });
} catch {
  console.error(
    `\nFailed to regenerate OpenAPI types from ${url}.\nIf you're offline or the API is unreachable, build against the\nchecked-in src/generated/api-types.ts by setting IWMM_SKIP_TYPEGEN=1:\n\n  IWMM_SKIP_TYPEGEN=1 npm run build\n`,
  );
  process.exit(1);
}
