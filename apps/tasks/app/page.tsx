import { requireAuth } from "@helvety/shared/auth-guard";
import { getCSRFToken } from "@helvety/shared/csrf";
import { CSRFProvider } from "@helvety/ui/csrf-provider";

import { EncryptionGate } from "@/components/encryption-gate";
import { TaskDashboard } from "@/components/task-dashboard";

/**
 * Main page - server component with auth protection
 * Redirects to centralized auth service if not authenticated
 * Wraps content in EncryptionGate to enforce passkey setup
 */
export default async function Page(): Promise<React.JSX.Element> {
  const [user, csrfToken] = await Promise.all([
    requireAuth("/tasks"),
    getCSRFToken().then((t) => t ?? ""),
  ]);

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <CSRFProvider csrfToken={csrfToken}>
        <TaskDashboard />
      </CSRFProvider>
    </EncryptionGate>
  );
}
