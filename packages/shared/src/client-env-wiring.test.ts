import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = resolve(import.meta.dirname, "../../..");

describe("client env wiring", () => {
  it("browser Supabase client reads validated public env", () => {
    const source = readFileSync(
      resolve(rootDir, "packages/shared/src/supabase/client.ts"),
      "utf8"
    );

    expect(source).toContain("../client-env");
    expect(source).toContain("getClientSupabaseUrl");
    expect(source).toContain("getClientSupabaseKey");
    expect(source).not.toContain('from "../env-validation"');
  });

  it("server env helpers delegate public reads to client-env", () => {
    const source = readFileSync(
      resolve(rootDir, "packages/shared/src/env-validation.ts"),
      "utf8"
    );

    expect(source).toContain("getClientSupabaseUrl");
    expect(source).toContain("getClientSupabaseKey");
  });
});
