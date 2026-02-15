/**
 * Helvety identifier / icon (white background, red "H" mark).
 *
 * Renders inline SVG -- no network request, single source of truth.
 * Original viewBox: 500x500
 */
export function HelvetyIdentifier(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      role="img"
      {...props}
    >
      <rect fill="#fff" width="500" height="500" />
      <path
        fill="red"
        d="m0,0v85.69h95.95v104.47h-40.11v114h40.11v110.14H0v85.69h500V0H0Zm307.62,414.31h-96.68v-125.49h-114.99v-84.96h114.99v-118.16h96.68v328.61Z"
      />
    </svg>
  );
}
