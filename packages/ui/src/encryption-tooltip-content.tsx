import type { ReactNode } from "react";

/**
 * Standard three-block encryption tooltip content used by both `E2eeAppNavbar`
 * (E2EE product apps) and `apps/auth`. `HelvetyShellNavbar` renders these
 * blocks in one left-aligned column, while this component keeps the trailing
 * passkey / cloud-sync / lockout-risk disclaimer as the single source of truth.
 *
 * Callers supply the middle `body` block (typically one or more `<p>`
 * elements describing what is encrypted in their app); the heading and the
 * trailing disclaimer are rendered identically everywhere.
 */
export function EncryptionTooltipContent({
  body,
}: {
  body: ReactNode;
}): React.JSX.Element {
  return (
    <>
      <p className="font-semibold">Client-Side Encryption</p>
      {body}
      <p>
        Encryption is tied to your passkey. If you lose your available passkeys,
        encrypted content cannot be recovered. Helvety cannot restore access.
        Use your platform&apos;s built-in password app with cloud sync to reduce
        lockout risk.
      </p>
    </>
  );
}
