"use client";

import {
  Building2,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import {
  getUserTenants,
  getSpoExplorerSubscriptions,
  registerTenant,
  removeTenant,
} from "@/app/actions/tenant-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { logger } from "@/lib/logger";

import type { LicensedTenantWithSubscription } from "@/lib/types/entities";

interface Subscription {
  id: string;
  tier_id: string;
  status: string;
  current_period_end: string | null;
  tenantCount: number;
  maxTenants: number;
}

export function TenantsClient() {
  const [tenants, setTenants] = React.useState<
    LicensedTenantWithSubscription[]
  >([]);
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Form state
  const [newTenantId, setNewTenantId] = React.useState("");
  const [newDisplayName, setNewDisplayName] = React.useState("");
  const [selectedSubscription, setSelectedSubscription] = React.useState("");

  // Load data on mount
  React.useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [tenantsResult, subscriptionsResult] = await Promise.all([
        getUserTenants(),
        getSpoExplorerSubscriptions(),
      ]);

      if (tenantsResult.success && tenantsResult.data) {
        setTenants(tenantsResult.data);
      }

      if (subscriptionsResult.success && subscriptionsResult.data) {
        setSubscriptions(subscriptionsResult.data);
        // Auto-select first subscription if only one
        const firstSub = subscriptionsResult.data[0];
        if (subscriptionsResult.data.length === 1 && firstSub) {
          setSelectedSubscription(firstSub.id);
        }
      }
    } catch (error) {
      logger.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddTenant(e: React.FormEvent) {
    e.preventDefault();

    if (!newTenantId.trim()) {
      toast.error("Tenant ID is required");
      return;
    }

    if (!selectedSubscription) {
      toast.error("Please select a subscription");
      return;
    }

    setIsAdding(true);
    try {
      const result = await registerTenant({
        tenantId: newTenantId.trim(),
        displayName: newDisplayName.trim() || undefined,
        subscriptionId: selectedSubscription,
      });

      if (result.success) {
        toast.success("Tenant registered successfully");
        setIsAddDialogOpen(false);
        setNewTenantId("");
        setNewDisplayName("");
        void loadData();
      } else {
        toast.error(result.error ?? "Failed to register tenant");
      }
    } catch (error) {
      logger.error("Error adding tenant:", error);
      toast.error("Failed to register tenant");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemoveTenant(id: string, tenantId: string) {
    if (
      !confirm(
        `Are you sure you want to remove ${tenantId}? This will disable the extension for this tenant.`
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await removeTenant(id);

      if (result.success) {
        toast.success("Tenant removed successfully");
        void loadData();
      } else {
        toast.error(result.error ?? "Failed to remove tenant");
      }
    } catch (error) {
      logger.error("Error removing tenant:", error);
      toast.error("Failed to remove tenant");
    } finally {
      setDeletingId(null);
    }
  }

  function getTierDisplayName(tierId: string): string {
    if (tierId.includes("enterprise")) return "Enterprise";
    if (tierId.includes("basic")) return "Basic";
    return tierId;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="default"
            className="border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400"
          >
            Active
          </Badge>
        );
      case "trialing":
        return (
          <Badge
            variant="default"
            className="border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400"
          >
            Trial
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  // -1 means unlimited tenants
  const hasAvailableSlots = subscriptions.some(
    (s) => s.maxTenants === -1 || s.tenantCount < s.maxTenants
  );

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Licensed Tenants
            </h1>
            <p className="text-muted-foreground">
              Manage SharePoint tenants for your SPO Explorer subscription
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={loadData}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!hasAvailableSlots}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tenant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAddTenant}>
                  <DialogHeader>
                    <DialogTitle>Register a Tenant</DialogTitle>
                    <DialogDescription>
                      Add a SharePoint tenant to enable the SPO Explorer
                      extension.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="tenantId">Tenant ID *</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="tenantId"
                          placeholder="contoso"
                          value={newTenantId}
                          onChange={(e) =>
                            setNewTenantId(e.target.value.toLowerCase())
                          }
                          className="flex-1"
                        />
                        <span className="text-muted-foreground text-sm">
                          .sharepoint.com
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Enter the tenant name from your SharePoint URL (e.g.,
                        &quot;contoso&quot; from contoso.sharepoint.com)
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="displayName">
                        Display Name (optional)
                      </Label>
                      <Input
                        id="displayName"
                        placeholder="My Organization"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                      />
                    </div>
                    {subscriptions.length > 1 && (
                      <div className="grid gap-2">
                        <Label htmlFor="subscription">Subscription</Label>
                        <select
                          id="subscription"
                          value={selectedSubscription}
                          onChange={(e) =>
                            setSelectedSubscription(e.target.value)
                          }
                          className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                        >
                          <option value="">Select a subscription</option>
                          {subscriptions
                            .filter(
                              (s) =>
                                s.maxTenants === -1 ||
                                s.tenantCount < s.maxTenants
                            )
                            .map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {getTierDisplayName(sub.tier_id)} (
                                {sub.tenantCount}/
                                {sub.maxTenants === -1
                                  ? "Unlimited"
                                  : sub.maxTenants}{" "}
                                tenants)
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isAdding}>
                      {isAdding ? "Registering..." : "Register Tenant"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* No subscriptions warning */}
        {subscriptions.length === 0 && (
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="font-medium">No Active Subscription</p>
                <p className="text-muted-foreground text-sm">
                  You need an active SPO Explorer subscription to register
                  tenants.{" "}
                  <Link
                    href="/products/spo-explorer"
                    className="text-primary hover:underline"
                  >
                    View plans
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription summary */}
        {subscriptions.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {subscriptions.map((sub) => (
              <Card key={sub.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {getTierDisplayName(sub.tier_id)}
                    </CardTitle>
                    {getStatusBadge(sub.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tenants used</span>
                    <span className="font-medium">
                      {sub.tenantCount} /{" "}
                      {sub.maxTenants === -1 ? "Unlimited" : sub.maxTenants}
                    </span>
                  </div>
                  {sub.maxTenants !== -1 && (
                    <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full transition-all"
                        style={{
                          width: `${(sub.tenantCount / sub.maxTenants) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                  {sub.current_period_end && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      Renews{" "}
                      {new Date(sub.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tenants list */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Tenants</CardTitle>
            <CardDescription>
              These SharePoint tenants have access to the SPO Explorer extension
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <div className="py-8 text-center">
                <Building2 className="text-muted-foreground/50 mx-auto h-12 w-12" />
                <p className="text-muted-foreground mt-4">
                  No tenants registered yet
                </p>
                {hasAvailableSlots && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first tenant
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {tenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                        <Building2 className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {tenant.display_name ?? tenant.tenant_id}
                        </p>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {tenant.tenant_domain}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={`https://${tenant.tenant_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open SharePoint"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleRemoveTenant(tenant.id, tenant.tenant_id)
                        }
                        disabled={deletingId === tenant.id}
                        className="text-destructive hover:text-destructive"
                        title="Remove tenant"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help section */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <p className="text-muted-foreground text-sm">
              <strong>Need help?</strong> After registering a tenant, the SPO
              Explorer extension will automatically validate the license when
              users access SharePoint. License validation is cached for 1 hour
              to ensure fast performance.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
