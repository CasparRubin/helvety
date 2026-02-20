/**
 * Visually hidden link that becomes visible on focus, allowing keyboard users
 * to skip the navigation and jump directly to the main content area.
 *
 * Place as the first child inside `<body>` in every layout.
 * The target element must have `id="main-content"`.
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="bg-background text-foreground ring-ring fixed top-0 left-0 z-[100] -translate-y-full rounded-br-md px-4 py-2 text-sm font-medium transition-transform focus:translate-y-0 focus:ring-2 focus:outline-none"
    >
      Skip to main content
    </a>
  );
}
