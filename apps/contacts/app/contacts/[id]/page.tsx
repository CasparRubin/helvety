import { requireAuth } from "@helvety/shared/auth-guard";
import { getCachedCSRFToken } from "@helvety/shared/cached-server";
import { CSRFProvider } from "@helvety/ui/csrf-provider";

import { ContactEditor } from "@/components/contact-editor";
import { EncryptionGate } from "@/components/encryption-gate";

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
  const [{ id: contactId }, user, csrfToken] = await Promise.all([
    params,
    requireAuth("/contacts"),
    getCachedCSRFToken().then((t) => t ?? ""),
  ]);

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <CSRFProvider csrfToken={csrfToken}>
        <ContactEditor contactId={contactId} />
      </CSRFProvider>
    </EncryptionGate>
  );
}
