import { requireAuth } from "@helvety/shared/auth-guard";
import { getCSRFToken } from "@helvety/shared/csrf";

import { ContactEditor } from "@/components/contact-editor";
import { EncryptionGate } from "@/components/encryption-gate";
import { CSRFProvider } from "@/lib/csrf-client";

/**
 * Contact Editor page - edit a contact's names, description, email, phone,
 * birthday, notes, and category.
 * Uses a WYSIWYG rich text editor for notes and an action panel for category selection.
 */
export default async function ContactEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const { id: contactId } = await params;

  // Server-side auth check (includes retry for transient network failures)
  const user = await requireAuth();
  const csrfToken = (await getCSRFToken()) ?? "";

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <CSRFProvider csrfToken={csrfToken}>
        <ContactEditor contactId={contactId} />
      </CSRFProvider>
    </EncryptionGate>
  );
}
