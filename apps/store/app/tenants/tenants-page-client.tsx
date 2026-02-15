"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { getSpoExplorerSubscriptions } from "@/app/actions/tenant-actions";
import { TenantsTab } from "@/components/account";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Client wrapper for the tenants page: SPO check, empty state, or TenantsTab.
 */
export function TenantsPageClient() {
  const [hasSpoSubscription, setHasSpoSubscription] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    /** Check if user has SPO Explorer subscription. */
    async function check() {
      try {
        const result = await getSpoExplorerSubscriptions();
        if (
          !cancelled &&
          result.success &&
          result.data &&
          result.data.length > 0
        ) {
          setHasSpoSubscription(true);
        }
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isChecking) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
            <p className="text-muted-foreground">
              Manage your licensed SharePoint tenants
            </p>
          </div>
          <div className="text-muted-foreground py-8 text-center text-sm">
            Loading…
          </div>
        </div>
      </div>
    );
  }

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
        <TenantsTab />
      </div>
    </div>
  );
}
