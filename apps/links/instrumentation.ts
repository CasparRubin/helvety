/**
 *
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getValidatedLinksEnv } = await import("@/lib/env");
    getValidatedLinksEnv();
  }
}
