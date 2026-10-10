/** Primitive values allowed in JSON-LD payloads. */
type JsonLdPrimitive = string | number | boolean | null;
/** Recursive JSON-LD value shape used for serialized schema payloads. */
type JsonLdValue =
  JsonLdPrimitive | JsonLdValue[] | { [key: string]: JsonLdValue };

/** Props for rendering a JSON-LD script element. */
export type JsonLdScriptProps = Readonly<{
  json: JsonLdValue;
}>;

/**
 * Renders a hydration-safe JSON-LD script. `application/ld+json` is not
 * executed, so it does not need a CSP nonce.
 */
export function JsonLdScript({ json }: JsonLdScriptProps): React.JSX.Element {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
