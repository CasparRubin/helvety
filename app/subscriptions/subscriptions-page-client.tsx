"use client";

import { useRouter } from "next/navigation";

import { SubscriptionsTab } from "@/components/account";

/**
 * Client wrapper for the subscriptions page (title + SubscriptionsTab).
 */
export function SubscriptionsPageClient() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">
            View and manage your active subscriptions
          </p>
        </div>
        <SubscriptionsTab onNavigateToTenants={() => router.push("/tenants")} />
      </div>
    </div>
  );
}
