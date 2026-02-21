/** Runs once at app startup to validate environment variables. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getValidatedTasksEnv } = await import("@/lib/env");
    getValidatedTasksEnv();
  }
}
