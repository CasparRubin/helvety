/** Runs once at app startup to validate environment variables. */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getValidatedImageUpscalerEnv } = await import("@/lib/env");
    getValidatedImageUpscalerEnv();
  }
}
