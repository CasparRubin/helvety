"use client";

import { User, CreditCard, Building2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import * as React from "react";

import { getSpoExplorerSubscriptions } from "@/app/actions/tenant-actions";
import { ProfileTab, SubscriptionsTab, TenantsTab } from "@/components/account";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabValue = "profile" | "subscriptions" | "tenants";

export function AccountClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get initial tab from URL or default to "profile"
  const initialTab = (searchParams.get("tab") as TabValue) ?? "profile";
  const [activeTab, setActiveTab] = React.useState<TabValue>(initialTab);

  // Check if user has SPO Explorer subscription
  const [hasSpoSubscription, setHasSpoSubscription] = React.useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] =
    React.useState(true);

  React.useEffect(() => {
    async function checkSpoSubscription() {
      try {
        const result = await getSpoExplorerSubscriptions();
        if (result.success && result.data && result.data.length > 0) {
          setHasSpoSubscription(true);
        }
      } catch {
        // Silently fail - just don't show tenants tab
      } finally {
        setIsCheckingSubscription(false);
      }
    }
    void checkSpoSubscription();
  }, []);

  // Update URL when tab changes
  const handleTabChange = React.useCallback(
    (value: string) => {
      const newTab = value as TabValue;
      setActiveTab(newTab);

      // Update URL without full page reload
      const params = new URLSearchParams(searchParams.toString());
      if (newTab === "profile") {
        params.delete("tab");
      } else {
        params.set("tab", newTab);
      }
      const newUrl = params.toString()
        ? `?${params.toString()}`
        : window.location.pathname;
      router.replace(newUrl, { scroll: false });
    },
    [router, searchParams]
  );

  // Navigate to tenants tab (for subscriptions tab callback)
  const navigateToTenants = React.useCallback(() => {
    handleTabChange("tenants");
  }, [handleTabChange]);

  // Sync with URL changes (e.g., browser back/forward)
  React.useEffect(() => {
    const urlTab = searchParams.get("tab") as TabValue;
    if (urlTab && urlTab !== activeTab) {
      // Only set if it's a valid tab and user has access
      if (
        urlTab === "tenants" &&
        !hasSpoSubscription &&
        !isCheckingSubscription
      ) {
        // Redirect to subscriptions if they don't have SPO subscription
        handleTabChange("subscriptions");
      } else if (["profile", "subscriptions", "tenants"].includes(urlTab)) {
        setActiveTab(urlTab);
      }
    } else if (!urlTab && activeTab !== "profile") {
      setActiveTab("profile");
    }
  }, [
    searchParams,
    activeTab,
    hasSpoSubscription,
    isCheckingSubscription,
    handleTabChange,
  ]);

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account</h1>
          <p className="text-muted-foreground">
            Manage your profile, subscriptions, and licensed products
          </p>
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscriptions">
              <CreditCard className="mr-2 h-4 w-4" />
              Subscriptions
            </TabsTrigger>
            {(hasSpoSubscription || isCheckingSubscription) && (
              <TabsTrigger value="tenants" disabled={isCheckingSubscription}>
                <Building2 className="mr-2 h-4 w-4" />
                Tenants
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-6">
            <SubscriptionsTab onNavigateToTenants={navigateToTenants} />
          </TabsContent>

          {hasSpoSubscription && (
            <TabsContent value="tenants" className="mt-6">
              <TenantsTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
