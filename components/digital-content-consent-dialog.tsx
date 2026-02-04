"use client";

/**
 * Pre-checkout consent dialog (Terms & Policy + EU digital content).
 *
 * Shown before every purchase, before redirecting to Stripe Checkout. The user
 * must confirm (1) that they have read and understood our Terms of Service and
 * Privacy Policy, and (2) for digital content, the EU Consumer Rights Directive
 * consent (acknowledgement that they lose the 14-day withdrawal right once
 * content is made available). Both checkboxes are required; neither choice is
 * saved — the dialog is shown on every purchase with both unchecked by default.
 */

import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const LEGAL_BASE = "https://helvety.com";

/** Props for the DigitalContentConsentDialog component */
interface DigitalContentConsentDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Called when user confirms consent and wants to proceed */
  onConfirm: () => void;
  /** Whether the checkout is in progress */
  isLoading?: boolean;
  /** Optional; not shown in the dialog (reserved for future use, e.g. analytics). */
  productName?: string;
}

/**
 * Pre-checkout consent dialog. Two sections: (1) Terms & policy — links plus
 * checkbox; (2) Digital content consent — EU withdrawal notice plus checkbox.
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
  productName: _productName, // reserved for future use (e.g. analytics)
}: DigitalContentConsentDialogProps) {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  // Reset both checkboxes when dialog closes (no persistence; required on every purchase)
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setHasAcceptedTerms(false);
      setHasConsented(false);
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = () => {
    if (hasAcceptedTerms && hasConsented) {
      onConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Digital Content Purchase</DialogTitle>
          <DialogDescription>
            Please read the following information carefully before completing
            your purchase.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
          {/* Section 1: Terms & Policy */}
          <div className="space-y-3">
            <p className="text-muted-foreground text-center text-xs font-medium tracking-wider uppercase">
              Terms &amp; policy
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="secondary" size="default" asChild>
                <a
                  href={`${LEGAL_BASE}/terms`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium"
                >
                  Terms of Service
                  <ExternalLink className="size-4" />
                </a>
              </Button>
              <Button variant="secondary" size="default" asChild>
                <a
                  href={`${LEGAL_BASE}/privacy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium"
                >
                  Privacy Policy
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms-policy"
                checked={hasAcceptedTerms}
                onCheckedChange={(value) => setHasAcceptedTerms(value === true)}
                disabled={isLoading}
                className="mt-0.5"
              />
              <Label
                htmlFor="terms-policy"
                className="cursor-pointer text-sm leading-relaxed font-normal"
              >
                I have read and understood the Terms of Service and Privacy
                Policy above.
              </Label>
            </div>
          </div>

          <Separator />

          {/* Section 2: EU digital content consent */}
          <div className="space-y-3">
            <p className="text-muted-foreground text-center text-xs font-medium tracking-wider uppercase">
              Digital content consent
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="text-muted-foreground">
                Under EU consumer protection law, you have a 14-day right of
                withdrawal for online purchases. However, for digital content
                that is delivered immediately, this right is waived once the
                content is made available to you.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="withdrawal-consent"
                checked={hasConsented}
                onCheckedChange={(value) => setHasConsented(value === true)}
                disabled={isLoading}
                className="mt-0.5"
              />
              <Label
                htmlFor="withdrawal-consent"
                className="cursor-pointer text-sm leading-relaxed font-normal"
              >
                I expressly request that you begin the supply of digital content
                immediately and I acknowledge that I will lose my right of
                withdrawal once the digital content has been made available to
                me.
              </Label>
            </div>
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
          <Button
            onClick={handleConfirm}
            disabled={!hasAcceptedTerms || !hasConsented || isLoading}
          >
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
          You must confirm that you have read and understood the Terms of
          Service and Privacy Policy above before proceeding.
        </p>
      </DialogContent>
    </Dialog>
  );
}
