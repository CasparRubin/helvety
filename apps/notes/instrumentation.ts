/** Runs once at app startup to validate environment variables. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getValidatedNotesEnv } = await import("@/lib/env");
    getValidatedNotesEnv();
  }
}
