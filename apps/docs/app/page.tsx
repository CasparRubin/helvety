import { bootstrapPublicLayoutUser } from "@helvety/shared/layout-session-bootstrap";
import { ListLoadingState } from "@helvety/ui/list-states";
import { Suspense } from "react";

import { HelvetyDocsShell } from "@/components/helvety-docs-shell";

/**
 * Main page: public .docx editor with optional encrypted vault save.
 * No login required for local editing. Editor starts blank on each load (Eigenpal createEmptyDocument).
 * New resets to a fresh blank document. Theme: shared public shell + navbar ThemeSwitcher; Eigenpal bridge in `styles/docx-editor-helvety-bridge.css` (File/Format/Insert menus, command-bar-aligned toolbar borders).
 */
export default async function Page(): Promise<React.JSX.Element> {
  const initialUser = await bootstrapPublicLayoutUser();

  return (
    <Suspense fallback={<ListLoadingState message="Loading…" />}>
      <HelvetyDocsShell initialUser={initialUser} />
    </Suspense>
  );
}
