import { requireAuth } from "@helvety/shared/auth-guard";

import { EncryptionGate } from "@/components/encryption-gate";
import { TaskDashboard } from "@/components/task-dashboard";

/**
 * Main page - server component with auth protection
 * Redirects to centralized auth service if not authenticated
 * Wraps content in EncryptionGate to enforce passkey setup
 */
export default async function Page(): Promise<React.JSX.Element> {
  const user = await requireAuth("/tasks");

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <TaskDashboard />
    </EncryptionGate>
  );
}
