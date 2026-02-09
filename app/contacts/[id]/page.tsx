import { redirect } from "next/navigation";

import { ContactEditor } from "@/components/contact-editor";
import { EncryptionGate } from "@/components/encryption-gate";
import { getLoginUrl } from "@/lib/auth-redirect";
import { CSRFProvider } from "@/lib/csrf-client";
import { createServerComponentClient } from "@/lib/supabase/client-factory";

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

  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(getLoginUrl());
  }

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <CSRFProvider>
        <ContactEditor contactId={contactId} />
      </CSRFProvider>
    </EncryptionGate>
  );
}
