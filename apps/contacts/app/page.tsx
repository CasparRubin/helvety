import { requireAuth } from "@helvety/shared/auth-guard";
import { getCSRFToken } from "@helvety/shared/csrf";

import { ContactsDashboard } from "@/components/contacts-dashboard";
import { EncryptionGate } from "@/components/encryption-gate";
import { CSRFProvider } from "@/lib/csrf-client";

/**
 * Main page - server component with auth protection
 * Redirects to centralized auth service if not authenticated
 * Wraps content in EncryptionGate to enforce passkey setup
 */
export default async function Page(): Promise<React.JSX.Element> {
  // Server-side auth check (includes retry for transient network failures)
  const user = await requireAuth();
  const csrfToken = (await getCSRFToken()) ?? "";

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <CSRFProvider csrfToken={csrfToken}>
        <ContactsDashboard />
      </CSRFProvider>
    </EncryptionGate>
  );
}
