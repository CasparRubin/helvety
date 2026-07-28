/** Reads `version` from the extension manifest when running in a Chromium extension. */
export function readExtensionVersion(): string {
  if (typeof chrome !== "undefined" && chrome.runtime?.getManifest) {
    return chrome.runtime.getManifest().version;
  }
  return "";
}

/** Chromium extension ID (empty outside extension context). */
export function readExtensionId(): string {
  if (typeof chrome !== "undefined" && chrome.runtime?.id) {
    return chrome.runtime.id;
  }
  return "";
}
