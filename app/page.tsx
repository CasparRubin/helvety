import { redirect } from "next/navigation";

import { ContactsDashboard } from "@/components/contacts-dashboard";
import { EncryptionGate } from "@/components/encryption-gate";
import { getLoginUrl } from "@/lib/auth-redirect";
import { CSRFProvider } from "@/lib/csrf-client";
import { createServerComponentClient } from "@/lib/supabase/client-factory";

/**
 * Main page - server component with auth protection
 * Redirects to centralized auth service if not authenticated
 * Wraps content in EncryptionGate to enforce passkey setup
 */
export default async function Page(): Promise<React.JSX.Element> {
  // Server-side auth check
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to centralized auth service if not authenticated
  if (!user) {
    redirect(getLoginUrl());
  }

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <CSRFProvider>
        <ContactsDashboard />
      </CSRFProvider>
    </EncryptionGate>
  );
}
