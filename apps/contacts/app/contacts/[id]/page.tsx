import { shouldForceHardLogout } from "@helvety/shared/auth-errors";
import { requireAuth } from "@helvety/shared/auth-guard";
import { getLogoutUrl } from "@helvety/shared/auth-redirect";
import { urls } from "@helvety/shared/config";
import { redirect } from "next/navigation";

import { getContact } from "@/app/actions/contact-actions";
import { ContactEditor } from "@/components/contact-editor";

/** Server component that prefetches the encrypted contact for streaming. */
async function PrefetchedEditor({
  contactId,
}: {
  contactId: string;
}): Promise<React.JSX.Element> {
  const result = await getContact(contactId);
  if (!result.success && shouldForceHardLogout(result.error)) {
    redirect(
      getLogoutUrl(`${urls.home}/contacts/contacts/${contactId}`, {
        global: true,
      })
    );
  }
  const initialEncryptedContact = result.success ? result.data : undefined;

  return (
    <ContactEditor
      contactId={contactId}
      initialEncryptedContact={initialEncryptedContact}
    />
  );
}

/** Contact Editor page - edit a contact with rich text notes and category selection. */
export default async function ContactEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const { id: contactId } = await params;
  await requireAuth(`/contacts/contacts/${contactId}`);

  return <PrefetchedEditor contactId={contactId} />;
}
