/** Primitive values allowed in JSON-LD payloads. */
type JsonLdPrimitive = string | number | boolean | null;
/** Recursive JSON-LD value shape used for serialized schema payloads. */
type JsonLdValue =
  | JsonLdPrimitive
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

/** Props for rendering a JSON-LD script element. */
export type JsonLdScriptProps = Readonly<{
  json: JsonLdValue;
  nonce?: string;
}>;

/**
 * Renders a hydration-safe JSON-LD script with optional CSP nonce.
 * Browsers may expose nonce differently at hydration time, so this centralizes
 * suppressHydrationWarning and keeps all app surfaces consistent.
 */
export function JsonLdScript({
  json,
  nonce,
}: JsonLdScriptProps): React.JSX.Element {
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
