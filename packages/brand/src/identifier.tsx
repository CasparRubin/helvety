/**
 * Helvety identifier / icon (white background, red "H" mark).
 *
 * Renders inline SVG — no network request. Optional `edgeHighlight` adds a duplicate stroked path
 * with an SVG-animated linear gradient (SMIL) under the fill; leave it off where the mark stays static
 * (e.g. navbar).
 * Original viewBox: 500x500
 */
import { useId, type SVGProps } from "react";

/**
 * Compound path `d` for the red mark (shared by fill and optional edge stroke).
 */
export const HELVETY_IDENTIFIER_PATH_D =
  "m0,0v85.69h95.95v104.47h-40.11v114h40.11v110.14H0v85.69h500V0H0Zm307.62,414.31h-96.68v-125.49h-114.99v-84.96h114.99v-118.16h96.68v328.61Z";

/**
 * {@link HelvetyIdentifier} props: standard SVG attributes plus optional edge highlight.
 */
export type HelvetyIdentifierProps = Readonly<
  SVGProps<SVGSVGElement> & {
    /** When true, draws an animated gradient stroke under the fill (hero / emphasis only). */
    edgeHighlight?: boolean;
  }
>;

/**
 * Renders the Helvety square icon: white tile, red “H”, and optional animated edge highlight.
 */
export function HelvetyIdentifier({
  edgeHighlight = false,
  ...props
}: HelvetyIdentifierProps) {
  const reactId = useId();
  const gradId = `helvety-ident-edge-${reactId.replace(/:/g, "")}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      role="img"
      {...props}
    >
      {edgeHighlight ? (
        <defs>
          <linearGradient
            id={gradId}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="250"
            x2="500"
            y2="250"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#ff5555" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="75%" stopColor="#ff2a2a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#cce0ff" stopOpacity="0.5" />
            <animateTransform
              attributeName="gradientTransform"
              type="rotate"
              from="0 250 250"
              to="360 250 250"
              dur="4.2s"
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>
      ) : null}

      <rect fill="#fff" width="500" height="500" />

      {edgeHighlight ? (
        <path
          className="helvety-identifier-edge-shine"
          vectorEffect="nonScalingStroke"
          d={HELVETY_IDENTIFIER_PATH_D}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeLinejoin="round"
          strokeWidth={2.5}
        />
      ) : null}

      <path
        className="helvety-identifier-mark"
        fill="red"
        d={HELVETY_IDENTIFIER_PATH_D}
      />
    </svg>
  );
}
