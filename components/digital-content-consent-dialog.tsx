"use client";

/**
 * Digital Content Consent Dialog
 *
 * EU Consumer Rights Directive requires explicit consent before delivering
 * digital content. Consumers must acknowledge they lose their 14-day withdrawal
 * right when digital content is made available immediately.
 *
 * This dialog must be shown before redirecting to checkout for digital products.
 */

import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 *
 */
interface DigitalContentConsentDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Called when user confirms consent and wants to proceed */
  onConfirm: () => void;
  /** Whether the checkout is in progress */
  isLoading?: boolean;
  /** Product name for display */
  productName?: string;
}

/**
 *
 * @param root0
 * @param root0.open
 * @param root0.onOpenChange
 * @param root0.onConfirm
 * @param root0.isLoading
 * @param root0.productName
 */
export function DigitalContentConsentDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  productName,
}: DigitalContentConsentDialogProps) {
  const [hasConsented, setHasConsented] = useState(false);

  // Reset consent when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setHasConsented(false);
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = () => {
    if (hasConsented) {
      onConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Digital Content Purchase</DialogTitle>
          <DialogDescription>
            {productName
              ? `You are about to purchase "${productName}".`
              : "You are about to purchase digital content."}{" "}
            Please read the following information carefully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="text-muted-foreground">
              Under EU consumer protection law, you have a 14-day right of
              withdrawal for online purchases. However, for digital content that
              is delivered immediately, this right is waived once the content is
              made available to you.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="withdrawal-consent"
              checked={hasConsented}
              onChange={(e) => setHasConsented(e.target.checked)}
              className={cn(
                "mt-1 h-4 w-4 shrink-0 rounded border",
                "border-primary ring-offset-background",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "accent-primary"
              )}
              disabled={isLoading}
            />
            <Label
              htmlFor="withdrawal-consent"
              className="cursor-pointer text-sm leading-relaxed font-normal"
            >
              I expressly request that you begin the supply of digital content
              immediately and I acknowledge that I will lose my right of
              withdrawal once the digital content has been made available to me.
            </Label>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!hasConsented || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Proceed to Checkout"
            )}
          </Button>
        </DialogFooter>

        <p className="text-muted-foreground text-center text-xs">
          By proceeding, you also agree to our{" "}
          <a
            href="https://helvety.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground inline-flex items-center gap-0.5 underline underline-offset-2"
          >
            Terms of Service
            <ExternalLink className="h-3 w-3" />
          </a>{" "}
          and{" "}
          <a
            href="https://helvety.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground inline-flex items-center gap-0.5 underline underline-offset-2"
          >
            Privacy Policy
            <ExternalLink className="h-3 w-3" />
          </a>
          .
        </p>
      </DialogContent>
    </Dialog>
  );
}
