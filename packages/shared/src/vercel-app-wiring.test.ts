import { describe, expect, it } from "vitest";

import { PROJECT_TO_APP } from "../../../scripts/audit-vercel-production-env.mjs";
import { VERCEL_APP_EXPECTATIONS } from "../../../scripts/vercel-app-expectations.mjs";

describe("Vercel zone project wiring", () => {
  it("maps every VERCEL_APP_EXPECTATIONS slug to a helvety-* project", () => {
    const expectedProjects = Object.fromEntries(
      Object.entries(VERCEL_APP_EXPECTATIONS).map(([app, config]) => [
        config.vercelProject,
        app,
      ])
    );

    expect(PROJECT_TO_APP).toEqual(expectedProjects);
  });

  it("covers eleven Helvety zone apps", () => {
    expect(Object.keys(VERCEL_APP_EXPECTATIONS)).toHaveLength(11);
    expect(Object.keys(PROJECT_TO_APP)).toHaveLength(11);
  });
});
