"use client";

import { ProfileTab } from "@/components/account";

/**
 * Account page client: profile only.
 * Subscriptions and Tenants are separate routes (/subscriptions, /tenants).
 */
export function AccountClient() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account</h1>
          <p className="text-muted-foreground">
            Manage your profile and account settings
          </p>
        </div>
        <ProfileTab />
      </div>
    </div>
  );
}
