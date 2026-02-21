import { requireAuth } from "@helvety/shared/auth-guard";
import { LoadingSpinner } from "@helvety/ui/loading-spinner";
import { Suspense } from "react";

import { getContacts } from "@/app/actions/contact-actions";
import { ContactsDashboard } from "@/components/contacts-dashboard";
import { EncryptionGate } from "@/components/encryption-gate";

/** Server component that prefetches encrypted contacts for streaming. */
async function PrefetchedDashboard(): Promise<React.JSX.Element> {
  const contactsResult = await getContacts();
  const initialEncryptedContacts = contactsResult.success
    ? contactsResult.data
    : undefined;

  return (
    <ContactsDashboard initialEncryptedContacts={initialEncryptedContacts} />
  );
}

/**
 * Main page - server component with auth protection.
 * Auth resolves first (cached, fast), then EncryptionGate renders
 * immediately while the contacts prefetch streams in via Suspense.
 */
export default async function Page(): Promise<React.JSX.Element> {
  const user = await requireAuth("/contacts");

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <Suspense fallback={<LoadingSpinner />}>
        <PrefetchedDashboard />
      </Suspense>
    </EncryptionGate>
  );
}
