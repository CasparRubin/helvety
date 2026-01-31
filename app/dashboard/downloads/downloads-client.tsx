"use client";

import {
  Download,
  Package,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { getPackageDownloadUrl } from "@/app/actions/download-actions";
import { getSpoExplorerSubscriptions } from "@/app/actions/tenant-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { logger } from "@/lib/logger";
import { PACKAGE_CONFIG } from "@/lib/packages/config";

interface Subscription {
  id: string;
  tier_id: string;
  status: string;
  current_period_end: string | null;
  tenantCount: number;
  maxTenants: number;
}

export function DownloadsClient() {
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDownloading, setIsDownloading] = React.useState(false);

  // Load data on mount
  React.useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const result = await getSpoExplorerSubscriptions();
      if (result.success && result.data) {
        setSubscriptions(result.data);
      }
    } catch (error) {
      logger.error("Error loading data:", error);
      toast.error("Failed to load subscription data");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownload(packageId: string) {
    setIsDownloading(true);
    try {
      const result = await getPackageDownloadUrl(packageId);

      if (result.success && result.data) {
        // Open download URL in a new tab/trigger download
        window.location.href = result.data.downloadUrl;
        toast.success(`Downloading ${result.data.filename}`);
      } else {
        toast.error(result.error ?? "Failed to generate download link");
      }
    } catch (error) {
      logger.error("Error downloading:", error);
      toast.error("Failed to download package");
    } finally {
      setIsDownloading(false);
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

  const spoExplorerPackage = PACKAGE_CONFIG["spo-explorer"]!;
  const hasActiveSubscription = subscriptions.length > 0;

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid gap-4">
            <Skeleton className="h-48 w-full" />
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
            <h1 className="text-2xl font-bold tracking-tight">Downloads</h1>
            <p className="text-muted-foreground">
              Download your licensed software packages
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={loadData}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* No subscription warning */}
        {!hasActiveSubscription && (
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="font-medium">No Active Subscription</p>
                <p className="text-muted-foreground text-sm">
                  You need an active subscription to download packages.{" "}
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

        {/* SPO Explorer Package */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                  <Package className="text-primary h-6 w-6" />
                </div>
                <div>
                  <CardTitle>{spoExplorerPackage.productName}</CardTitle>
                  <CardDescription>
                    SharePoint Framework extension for enhanced navigation
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="font-mono">
                v{spoExplorerPackage.version}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subscription status */}
            {hasActiveSubscription ? (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>You have access to this package</span>
              </div>
            ) : (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Subscription required</span>
              </div>
            )}

            {/* Active subscriptions */}
            {subscriptions.length > 0 && (
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">Your Subscriptions</p>
                <div className="space-y-2">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{getTierDisplayName(sub.tier_id)}</span>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(sub.status)}
                        {sub.current_period_end && (
                          <span className="text-muted-foreground text-xs">
                            Renews{" "}
                            {new Date(
                              sub.current_period_end
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Download section */}
            <div className="flex flex-col gap-4 pt-2 sm:flex-row">
              <Button
                onClick={() => handleDownload("spo-explorer")}
                disabled={!hasActiveSubscription || isDownloading}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                {isDownloading
                  ? "Preparing download..."
                  : `Download ${spoExplorerPackage.filename}`}
              </Button>
              <Button variant="outline" asChild>
                <a href="/dashboard/tenants" className="flex items-center">
                  Manage Tenants
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>

            {/* Installation instructions */}
            <div className="bg-muted/50 space-y-2 rounded-lg p-4">
              <p className="text-sm font-medium">Installation Instructions</p>
              <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-sm">
                <li>Download the .sppkg file above</li>
                <li>Upload to your SharePoint App Catalog</li>
                <li>Enable the app and deploy to your sites</li>
                <li>
                  Register your tenant in the{" "}
                  <a
                    href="/dashboard/tenants"
                    className="text-primary hover:underline"
                  >
                    Tenants
                  </a>{" "}
                  section
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Help section */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <p className="text-muted-foreground text-sm">
              <strong>Need help?</strong> Check out our{" "}
              <a
                href="https://github.com/Helvety/helvety-spo-explorer#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                documentation
              </a>{" "}
              for detailed installation and configuration instructions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
