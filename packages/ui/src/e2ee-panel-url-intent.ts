/** Programmatic panel/URL sync intent to avoid closing before router.replace completes. */
export type E2eePanelUrlIntent = "idle" | "opening" | "closing";

const panelUrlIntentRef: { current: E2eePanelUrlIntent } = { current: "idle" };

/** Returns the shared panel URL intent ref (module singleton). */
export function getE2eePanelUrlIntentRef(): {
  current: E2eePanelUrlIntent;
} {
  return panelUrlIntentRef;
}

/** Sets programmatic panel URL intent. */
export function setE2eePanelUrlIntent(intent: E2eePanelUrlIntent): void {
  panelUrlIntentRef.current = intent;
}
