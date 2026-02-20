import { requireAuth } from "@helvety/shared/auth-guard";
import { getCachedCSRFToken } from "@helvety/shared/cached-server";
import { CSRFProvider } from "@helvety/ui/csrf-provider";

import { getContacts } from "@/app/actions/contact-actions";
import { ContactsDashboard } from "@/components/contacts-dashboard";
import { EncryptionGate } from "@/components/encryption-gate";

/**
 * Main page - server component with auth protection.
 * Prefetches encrypted contacts so the client only needs to decrypt
 * after unlock, eliminating one full round-trip.
 */
export default async function Page(): Promise<React.JSX.Element> {
  const [user, csrfToken, contactsResult] = await Promise.all([
    requireAuth("/contacts"),
    getCachedCSRFToken().then((t) => t ?? ""),
    getContacts(),
  ]);

  const initialEncryptedContacts = contactsResult.success
    ? contactsResult.data
    : undefined;

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <CSRFProvider csrfToken={csrfToken}>
        <ContactsDashboard
          initialEncryptedContacts={initialEncryptedContacts}
        />
      </CSRFProvider>
    </EncryptionGate>
  );
}
