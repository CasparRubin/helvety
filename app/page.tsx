import { redirect } from "next/navigation"

import { EncryptionGate } from "@/components/encryption-gate"
import { ProductsCatalog } from "@/components/products"
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
      <main>
        <ProductsCatalog />
      </main>
    </EncryptionGate>
  )
}
