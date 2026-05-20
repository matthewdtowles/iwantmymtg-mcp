#!/usr/bin/env node
import { execSync } from "node:child_process";

const url =
  process.env.IWMM_OPENAPI_URL ?? "https://iwantmymtg.net/api/openapi.json";

execSync(`npx openapi-typescript ${url} -o src/generated/api-types.ts`, {
  stdio: "inherit",
});
