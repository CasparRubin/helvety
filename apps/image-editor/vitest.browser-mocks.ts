/** No-op ResizeObserver stub for Base UI Slider in jsdom. */
class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver = ResizeObserverMock;

/**
 * jsdom has no 2D canvas and logs "Not implemented" on every call; return the
 * same `null` quietly so redaction falls back to its flat fill in tests.
 */
HTMLCanvasElement.prototype.getContext = (() =>
  null) as typeof HTMLCanvasElement.prototype.getContext;
