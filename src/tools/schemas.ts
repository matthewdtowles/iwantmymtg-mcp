import { z } from "zod";

/**
 * Shared zod building blocks so the same primitives are defined once and can't
 * drift across tools (M3 I1-I4). Consumers chain `.optional()` / `.describe()`
 * as needed - zod schemas are immutable, so chaining returns a new schema.
 */

/** Canonical deck/legality format list. Single source so search/sets/decks agree (I1). */
export const FORMATS = [
  "standard",
  "commander",
  "modern",
  "legacy",
  "vintage",
  "brawl",
  "explorer",
  "historic",
  "oathbreaker",
  "pauper",
  "pioneer",
] as const;

export const formatEnum = z.enum(FORMATS);

/** A positive integer database id, coerced from string path params (I3). */
export const idParam = z.coerce.number().int().min(1);

/** Internal IWMM card UUID (I4). */
export const cardIdSchema = z.string().uuid();

/** 1-based page index shared by every paginated tool. */
export const pageParam = z.number().int().min(1);

/** Page size, capped at the API's 100 max. */
export const limitParam = z.number().int().min(1).max(100);

/** The `{ setCode, setNumber }` card key used to address a specific printing (I2). */
export const setCodeSchema = z.string();
export const setNumberSchema = z.string();
export const cardKey = z.object({
  setCode: setCodeSchema.describe("Set code (e.g. 'lea')."),
  setNumber: setNumberSchema.describe("Collector number within the set (e.g. '1', '234a')."),
});
