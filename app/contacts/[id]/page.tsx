import { ContactEditor } from "@/components/contact-editor";
import { EncryptionGate } from "@/components/encryption-gate";
import { requireAuth } from "@/lib/auth-guard";
import { CSRFProvider } from "@/lib/csrf-client";

/**
 * Contact Editor page - edit a contact's names, email, notes, and category
 * Uses a WYSIWYG rich text editor for notes and an action panel for category selection
 */
export default async function ContactEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const { id: contactId } = await params;

  // Server-side auth check (includes retry for transient network failures)
  const user = await requireAuth();

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <CSRFProvider>
        <ContactEditor contactId={contactId} />
      </CSRFProvider>
    </EncryptionGate>
  );
}
