"use client";

import { urls } from "@helvety/shared/config";
import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { logger } from "@helvety/shared/logger";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@helvety/ui/alert-dialog";
import { Button } from "@helvety/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@helvety/ui/card";
import { useCSRFToken } from "@helvety/ui/csrf-provider";
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import { Separator } from "@helvety/ui/separator";
import {
  User,
  Mail,
  Calendar,
  Loader2,
  Download,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  updateUserEmail,
  requestAccountDeletion,
  exportUserData,
} from "@/app/actions/account-actions";

/** User profile data consumed by the Profile tab UI. */
interface UserData {
  id: string;
  email: string;
  createdAt: string;
}

/** Props for the ProfileTab component */
interface ProfileTabProps {
  initialUser: UserData;
}

const MEMBER_SINCE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

/**
 * Profile tab component for account settings.
 * Receives pre-fetched user data from the server to avoid a client-side waterfall.
 */
export function ProfileTab({ initialUser }: ProfileTabProps) {
  const csrfToken = useCSRFToken();

  const [user] = React.useState<UserData>(initialUser);
  const isLoadingUser = false;

  // Email change state
  const [newEmail, setNewEmail] = React.useState("");
  const [isChangingEmail, setIsChangingEmail] = React.useState(false);
  const [emailError, setEmailError] = React.useState<string | null>(null);

  /** Handle email change form submission. */
  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);

    if (!newEmail.trim()) {
      setEmailError("Please enter an email address");
      return;
    }

    setIsChangingEmail(true);
    const result = await updateUserEmail(newEmail.trim(), csrfToken).catch(
      (error: unknown) => {
        logger.logUnexpectedError("Error changing email", error);
        const msg = "Couldn't update your email. Please try again.";
        setEmailError(msg);
        toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
        setIsChangingEmail(false);
        return null;
      }
    );
    if (!result) return;
    if (!result.success) {
      const msg = result.error ?? "Failed to update email";
      setEmailError(msg);
      toast.error(msg, { duration: TOAST_DURATIONS.ERROR });
      setIsChangingEmail(false);
      return;
    }
    toast.success("Confirmation email sent", {
      description:
        "Please check your new email address and click the confirmation link. If you do not see it, check your spam folder.",
      duration: TOAST_DURATIONS.SUCCESS,
    });
    setNewEmail("");
    setIsChangingEmail(false);
  }

  /** Format a date string for display. */
  function formatDate(dateString: string): string {
    return MEMBER_SINCE_FORMATTER.format(new Date(dateString));
  }

  // Data export state
  const [isExporting, setIsExporting] = React.useState(false);

  // Account deletion state
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");

  /** Exports account profile data as JSON. */
  async function handleDataExport() {
    setIsExporting(true);
    const result = await exportUserData().catch((error: unknown) => {
      logger.logUnexpectedError("Error exporting data", error);
      toast.error("Couldn't prepare your data export. Please try again.", {
        duration: TOAST_DURATIONS.ERROR,
      });
      setIsExporting(false);
      return null;
    });
    if (!result) return;
    if (!result.success) {
      toast.error(result.error ?? "Failed to export data. Please try again.", {
        duration: TOAST_DURATIONS.ERROR,
      });
      setIsExporting(false);
      return;
    }

    // Download as JSON file
    const blob = new Blob([JSON.stringify(result.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `helvety-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Data export completed", {
      description:
        "Your data export has been prepared. If the download did not start, check your browser download settings.",
      duration: TOAST_DURATIONS.SUCCESS,
    });
    setIsExporting(false);
  }

  /** Requests permanent account deletion after confirmation. */
  async function handleAccountDeletion() {
    setIsDeleting(true);
    const result = await requestAccountDeletion(csrfToken).catch(
      (error: unknown) => {
        logger.logUnexpectedError("Error deleting account", error);
        toast.error(
          "Couldn't process account deletion. Please try again or contact support.",
          {
            duration: TOAST_DURATIONS.ERROR,
          }
        );
        setIsDeleting(false);
        setDeleteConfirmText("");
        return null;
      }
    );
    if (!result) return;
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete account", {
        duration: TOAST_DURATIONS.ERROR,
      });
      setIsDeleting(false);
      setDeleteConfirmText("");
      return;
    }

    toast.success("Account deleted", {
      description:
        "Your account was deleted successfully. Redirecting you now.",
      duration: TOAST_DURATIONS.SUCCESS,
    });

    // Redirect to homepage after deletion
    setTimeout(() => {
      window.location.href = urls.home;
    }, 2000);
    setIsDeleting(false);
    setDeleteConfirmText("");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Your account information and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingUser ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : user ? (
            <>
              {/* Current Email */}
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <p className="font-medium">{user.email}</p>
              </div>

              {/* Account Created */}
              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </Label>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>

              <Separator />

              {/* Change Email Form */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Change Email Address</h3>
                  <p className="text-muted-foreground text-sm">
                    A confirmation link will be sent to your new email address
                  </p>
                </div>
                <form onSubmit={handleEmailChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-email">New Email Address</Label>
                    <Input
                      id="new-email"
                      type="email"
                      placeholder="Enter new email address"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        setEmailError(null);
                      }}
                      aria-invalid={!!emailError}
                      disabled={isChangingEmail}
                    />
                    {emailError && (
                      <p role="alert" className="text-destructive text-sm">
                        {emailError}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={isChangingEmail ? true : !newEmail.trim()}
                  >
                    {isChangingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending confirmation...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Update Email
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Unable to load user data</p>
          )}
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Your Data
          </CardTitle>
          <CardDescription>
            Download a copy of your personal data in JSON format (nDSG Art. 28)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            This export includes your profile information. For Helvety Tasks,
            Helvety Contacts, Helvety Notes, and Helvety Links (end-to-end
            encrypted data), please use each app&apos;s export feature while
            signed in and unlocked with your passkey. Helvety Docs vault
            documents are opened and downloaded from the Docs app when signed
            in.
          </p>
          <Button
            variant="outline"
            onClick={handleDataExport}
            disabled={isExporting ? true : isLoadingUser}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Request permanent account deletion and removal of account-linked
            data, subject to legal retention obligations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            This action is permanent and cannot be undone. Deleting your account
            will initiate the following:
          </p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>Delete your profile, credentials, and passkeys</li>
            <li>Delete task data (Helvety Tasks)</li>
            <li>Delete contact data (Helvety Contacts)</li>
            <li>Delete note data (Helvety Notes)</li>
            <li>Delete link data (Helvety Links)</li>
            <li>Delete document data (Helvety Docs)</li>
          </ul>
          <p className="text-muted-foreground text-sm">
            Your Helvety account data is deleted through the account deletion
            flow. Certain non-content security/compliance records may be
            retained for a limited period as described in our Privacy Policy.
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isLoadingUser}>
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete your account permanently?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <span className="block">
                    This action is permanent and cannot be undone. We initiate
                    deletion of your account and associated data across Helvety
                    services without undue delay, subject to technical
                    processing time and legally required retention.
                  </span>
                  <span className="block">
                    We recommend exporting your data before proceeding.
                  </span>
                  <span className="block font-medium">
                    Type <span className="font-mono font-bold">DELETE</span> to
                    confirm:
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="font-mono"
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleAccountDeletion}
                  disabled={deleteConfirmText !== "DELETE" || isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Permanently Delete Account"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
