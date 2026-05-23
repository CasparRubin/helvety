import { getCachedUser } from "@helvety/shared/cached-server";
import { logger } from "@helvety/shared/logger";
import { Suspense } from "react";

import { HelvetyDocsShell } from "@/components/helvety-docs-shell";

/**
 * Main page: public .docx editor with optional encrypted vault save.
 * No login required for local editing.
 */
export default async function Page(): Promise<React.JSX.Element> {
  let initialUser: Awaited<ReturnType<typeof getCachedUser>> = null;

  try {
    initialUser = await getCachedUser();
  } catch (error) {
    logger.logUnexpectedError("Docs page session bootstrap failed", error);
  }

  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
          Loading…
        </div>
      }
    >
      <HelvetyDocsShell initialUser={initialUser} />
    </Suspense>
  );
}
