/**
 * Runs synchronously when the popup bundle loads (before `createRoot`), so `<html>`
 * can match OS `prefers-color-scheme` on first paint (MV3 CSP disallows inline scripts).
 * Saved Light/Dark from `chrome.storage.local` is applied afterward by the React app.
 */
try {
  document.documentElement.classList.toggle(
    "dark",
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
} catch {
  document.documentElement.classList.add("dark");
}
