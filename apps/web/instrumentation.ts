/** Runs once at server bootstrap to validate gateway rewrite env. */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getValidatedWebEnv } = await import("@/lib/env");
    getValidatedWebEnv();
  }
}
