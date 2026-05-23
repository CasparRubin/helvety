import { getCachedUser } from "@helvety/shared/cached-server";
import { logger } from "@helvety/shared/logger";
import { Suspense } from "react";

import { HelvetyDocsShell } from "@/components/helvety-docs-shell";

/**
 * Main page: public .docx editor with optional encrypted vault save.
 * No login required for local editing. Editor starts blank on each load.
 * Theme: shared public shell + navbar ThemeSwitcher; Eigenpal bridge in `styles/docx-editor-helvety-bridge.css`.
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
        <div className="bg-background text-muted-foreground flex h-full items-center justify-center text-sm">
          Loading…
        </div>
      }
    >
      <HelvetyDocsShell initialUser={initialUser} />
    </Suspense>
  );
}
