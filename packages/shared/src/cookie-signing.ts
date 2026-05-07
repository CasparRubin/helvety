const SIGNED_VALUE_PARTS = 2;
const SIGNING_ALGORITHM = "HMAC";
const SIGNING_HASH = "SHA-256";

let cachedSigningKeyPromise: Promise<CryptoKey> | null = null;

/** Encodes bytes into standard base64. */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/** Decodes a standard base64 string into bytes. */
function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Encodes bytes into URL-safe base64 without padding. */
function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/** Decodes URL-safe base64 (with optional omitted padding) into bytes. */
function fromBase64Url(value: string): Uint8Array {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  return fromBase64(padded);
}

/** Compares two byte arrays in constant-time style (no early exit). */
function constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a[i]! ^ b[i]!;
  }
  return mismatch === 0;
}

/** Reads the server-side secret used for cookie signing. */
function getSigningSecret(): string {
  const secret =
    process.env.HELVETY_COOKIE_SIGNING_SECRET?.trim() ??
    process.env.SUPABASE_SECRET_KEY?.trim() ??
    "";
  if (!secret) {
    throw new Error(
      "Missing cookie signing secret. Set HELVETY_COOKIE_SIGNING_SECRET (or SUPABASE_SECRET_KEY)."
    );
  }
  return secret;
}

/** Imports and memoizes the HMAC signing key. */
async function getSigningKey(): Promise<CryptoKey> {
  if (!cachedSigningKeyPromise) {
    const encoder = new TextEncoder();
    const secretBytes = encoder.encode(getSigningSecret());
    cachedSigningKeyPromise = crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: SIGNING_ALGORITHM, hash: SIGNING_HASH },
      false,
      ["sign", "verify"]
    );
  }
  return cachedSigningKeyPromise;
}

/** Signs raw payload bytes with HMAC-SHA256. */
async function signBytes(payload: Uint8Array): Promise<Uint8Array> {
  const key = await getSigningKey();
  const payloadBuffer = new Uint8Array(payload).buffer;
  const signature = await crypto.subtle.sign(
    SIGNING_ALGORITHM,
    key,
    payloadBuffer
  );
  return new Uint8Array(signature);
}

/** Returns a signed cookie value in payload.signature format. */
export async function signCookiePayload(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payload);
  const payloadBase64Url = toBase64Url(payloadBytes);
  const signature = await signBytes(payloadBytes);
  const signatureBase64Url = toBase64Url(signature);
  return `${payloadBase64Url}.${signatureBase64Url}`;
}

/** Verifies a signed cookie value and returns the original payload on success. */
export async function verifySignedCookiePayload(
  signedValue: string | null | undefined
): Promise<string | null> {
  if (!signedValue) {
    return null;
  }

  const parts = signedValue.split(".");
  if (parts.length !== SIGNED_VALUE_PARTS) {
    return null;
  }

  const payloadPart = parts[0];
  const signaturePart = parts[1];
  if (!payloadPart || !signaturePart) {
    return null;
  }

  try {
    const payloadBytes = fromBase64Url(payloadPart);
    const providedSignature = fromBase64Url(signaturePart);
    const expectedSignature = await signBytes(payloadBytes);

    if (!constantTimeEquals(providedSignature, expectedSignature)) {
      return null;
    }

    return new TextDecoder().decode(payloadBytes);
  } catch {
    return null;
  }
}
