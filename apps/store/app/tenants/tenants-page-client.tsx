"use client";

import { Button } from "@helvety/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@helvety/ui/card";
import { Building2 } from "lucide-react";
import Link from "next/link";

import { TenantsTab } from "@/components/account";
import { type SpoSubscription } from "@/components/account/tenants-tab";

/**
 * Client wrapper for the tenants page: SPO check, empty state, or TenantsTab.
 */
export function TenantsPageClient({
  hasSpoSubscription,
  initialSpoSubscriptions,
}: {
  hasSpoSubscription: boolean;
  initialSpoSubscriptions: SpoSubscription[];
}) {
  if (!hasSpoSubscription) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
            <p className="text-muted-foreground">
              Manage your licensed SharePoint tenants for SPO Explorer
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5" />
                SPO Explorer required
              </CardTitle>
              <CardDescription>
                Tenant management is available with an active SPO Explorer
                subscription. Subscribe to SPO Explorer to register and manage
                your SharePoint tenants.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/subscriptions">View subscriptions</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">
            Manage your licensed SharePoint tenants for SPO Explorer
          </p>
        </div>
        <TenantsTab initialSpoSubscriptions={initialSpoSubscriptions} />
      </div>
    </div>
  );
}
