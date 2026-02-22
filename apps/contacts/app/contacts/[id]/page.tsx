import { requireAuth } from "@helvety/shared/auth-guard";
import { LoadingSpinner } from "@helvety/ui/loading-spinner";
import { Suspense } from "react";

import { getContact } from "@/app/actions/contact-actions";
import { ContactEditor } from "@/components/contact-editor";
import { EncryptionGate } from "@/components/encryption-gate";

/** Server component that prefetches the encrypted contact for streaming. */
async function PrefetchedEditor({
  contactId,
}: {
  contactId: string;
}): Promise<React.JSX.Element> {
  const result = await getContact(contactId);
  const initialEncryptedContact = result.success ? result.data : undefined;

  return (
    <ContactEditor
      contactId={contactId}
      initialEncryptedContact={initialEncryptedContact}
    />
  );
}

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
  const [{ id: contactId }, user] = await Promise.all([
    params,
    requireAuth("/contacts"),
  ]);

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <Suspense fallback={<LoadingSpinner />}>
        <PrefetchedEditor contactId={contactId} />
      </Suspense>
    </EncryptionGate>
  );
}
