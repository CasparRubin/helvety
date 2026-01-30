import { redirect } from "next/navigation"

import { EncryptionGate } from "@/components/encryption-gate"
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login")
  }

  return (
    <EncryptionGate userId={user.id} userEmail={user.email ?? ""}>
      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Helvety Store</h1>
          <p className="text-muted-foreground text-lg max-w-md">
            Your data is protected with end-to-end encryption.
            Start building your store experience.
          </p>
        </div>
      </main>
    </EncryptionGate>
  )
}
