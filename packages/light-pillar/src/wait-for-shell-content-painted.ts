/**
 * Resolves after two animation frames so shell children can paint before WebGL loads.
 */
export function waitForShellContentPainted(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}
