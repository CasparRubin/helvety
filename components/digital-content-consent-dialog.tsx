"use client";

/**
 * Pre-checkout consent dialog (Terms & Privacy Policy acceptance).
 *
 * Shown before every purchase, before redirecting to Stripe Checkout. The user
 * must confirm that they have read and understood our Terms of Service and
 * Privacy Policy. The checkbox is required; the choice is not saved — the dialog
 * is shown on every purchase with the checkbox unchecked by default.
 *
 * Legal basis: Swiss contract law — proof that the customer accepted the Terms
 * and Privacy Policy before purchase. Consent metadata (timestamp + version) is
 * stored in Stripe session metadata for audit trail purposes.
 *
 * Note: Helvety services are exclusively available to customers in Switzerland.
 * No EU Consumer Rights Directive provisions apply.
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

const LEGAL_BASE = "https://helvety.com";

/** Consent metadata returned when the user confirms. */
export interface ConsentMetadata {
  /** ISO 8601 timestamp when the user accepted the Terms & Privacy checkbox */
  termsAcceptedAt: string;
  /** Version identifier for the consent dialog (for audit trail) */
  consentVersion: string;
}

/** Props for the PurchaseConsentDialog component */
interface PurchaseConsentDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Called when user confirms consent and wants to proceed */
  onConfirm: (consent: ConsentMetadata) => void;
  /** Whether the checkout is in progress */
  isLoading?: boolean;
  /** Optional; not shown in the dialog (reserved for future use, e.g. analytics). */
  productName?: string;
}

/**
 * Pre-checkout consent dialog. The user must confirm they have read and
 * understood the Terms of Service and Privacy Policy before proceeding to
 * Stripe Checkout.
 */
export function PurchaseConsentDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  productName: _productName, // reserved for future use (e.g. analytics)
}: PurchaseConsentDialogProps) {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  // Reset checkbox when dialog closes (no persistence; required on every purchase)
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setHasAcceptedTerms(false);
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = () => {
    if (hasAcceptedTerms) {
      onConfirm({
        termsAcceptedAt: new Date().toISOString(),
        consentVersion: "2026-02-08",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm Purchase</DialogTitle>
          <DialogDescription>
            Please read the following information carefully before completing
            your purchase.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
          {/* Terms & Policy */}
          <div className="space-y-3">
            <p className="text-muted-foreground text-center text-xs font-medium tracking-wider uppercase">
              Terms &amp; Privacy Policy
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
            disabled={!hasAcceptedTerms || isLoading}
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

/**
 * @deprecated Use PurchaseConsentDialog instead. This alias is kept temporarily
 * for backward compatibility during the migration.
 */
export const DigitalContentConsentDialog = PurchaseConsentDialog;
