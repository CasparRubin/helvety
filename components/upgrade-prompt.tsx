"use client";

import { Crown, Check, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { TierLimits } from "@/lib/types/subscription";

/** Props for the upgrade prompt dialog (open, onOpenChange, reason, limits). */
interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: "files" | "pages";
  limits: TierLimits;
}

const REASON_TITLES: Record<UpgradePromptProps["reason"], string> = {
  files: "File Limit Reached",
  pages: "Page Limit Reached",
};

const REASON_DESCRIPTIONS: Record<
  UpgradePromptProps["reason"],
  (limits: TierLimits) => string
> = {
  files: (limits) =>
    `You've reached the maximum of ${limits.maxFiles} files with your Basic plan.`,
  pages: (limits) =>
    `You've reached the maximum of ${limits.maxPages} pages with your Basic plan.`,
};

const PRO_FEATURES = ["Unlimited file uploads", "Unlimited pages"];

/** Dialog prompting the user to upgrade when file or page limits are reached. */
export function UpgradePrompt({
  open,
  onOpenChange,
  reason,
  limits,
}: UpgradePromptProps) {
  const handleUpgrade = () => {
    // Open the store product page in a new tab
    window.open("https://store.helvety.com/products/helvety-pdf", "_blank");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="text-primary h-5 w-5" />
            {REASON_TITLES[reason]}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {REASON_DESCRIPTIONS[reason](limits)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg border p-4">
            <h4 className="mb-3 flex items-center gap-2 font-medium">
              <Crown className="h-4 w-4" />
              Upgrade to Pro
            </h4>
            <ul className="space-y-2">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="text-primary h-4 w-4 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="text-muted-foreground mt-4 text-sm">
              Only{" "}
              <span className="text-foreground font-medium">
                CHF 4.95/month
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Maybe later
            </Button>
            <Button className="flex-1" onClick={handleUpgrade}>
              <ShoppingBag className="h-4 w-4" />
              Upgrade Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
