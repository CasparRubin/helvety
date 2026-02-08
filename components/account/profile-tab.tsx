"use client";

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
  getCurrentUser,
  updateUserEmail,
  requestAccountDeletion,
  exportUserData,
} from "@/app/actions/account-actions";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCSRF } from "@/hooks/use-csrf";
import { TOAST_DURATIONS } from "@/lib/constants";
import { logger } from "@/lib/logger";

/** User profile data returned from the API. */
interface UserData {
  id: string;
  email: string;
  createdAt: string;
}

/**
 * Profile tab component for account settings
 */
export function ProfileTab() {
  // CSRF token for security
  const csrfToken = useCSRF();

  // User state
  const [user, setUser] = React.useState<UserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = React.useState(true);

  // Email change state
  const [newEmail, setNewEmail] = React.useState("");
  const [isChangingEmail, setIsChangingEmail] = React.useState(false);
  const [emailError, setEmailError] = React.useState<string | null>(null);

  // Load user data on mount
  React.useEffect(() => {
    void loadUserData();
  }, []);

  /** Fetches the current user's profile data. */
  async function loadUserData() {
    setIsLoadingUser(true);
    try {
      const result = await getCurrentUser();
      if (result.success && result.data) {
        setUser(result.data);
      }
    } catch (error) {
      logger.error("Error loading user:", error);
      toast.error("Failed to load user data", {
        duration: TOAST_DURATIONS.ERROR,
      });
    } finally {
      setIsLoadingUser(false);
    }
  }

  /**
   *
   * @param e
   */
  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);

    if (!newEmail.trim()) {
      setEmailError("Please enter an email address");
      return;
    }

    setIsChangingEmail(true);
    try {
      const result = await updateUserEmail(newEmail.trim(), csrfToken);

      if (!result.success) {
        setEmailError(result.error ?? "Failed to update email");
        return;
      }

      toast.success("Confirmation email sent", {
        description:
          "Please check your new email address and click the confirmation link.",
        duration: TOAST_DURATIONS.SUCCESS,
      });
      setNewEmail("");
    } catch (error) {
      logger.error("Error changing email:", error);
      setEmailError("An unexpected error occurred");
    } finally {
      setIsChangingEmail(false);
    }
  }

  /**
   *
   * @param dateString
   */
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Data export state
  const [isExporting, setIsExporting] = React.useState(false);

  // Account deletion state
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");

  /** Exports all user data as a JSON download (nDSG Art. 28 compliance). */
  async function handleDataExport() {
    setIsExporting(true);
    try {
      const result = await exportUserData();
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Failed to export data", {
          duration: TOAST_DURATIONS.ERROR,
        });
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

      toast.success("Data exported successfully", {
        description: "Your data has been downloaded as a JSON file.",
        duration: TOAST_DURATIONS.SUCCESS,
      });
    } catch (error) {
      logger.error("Error exporting data:", error);
      toast.error("An unexpected error occurred", {
        duration: TOAST_DURATIONS.ERROR,
      });
    } finally {
      setIsExporting(false);
    }
  }

  /** Requests permanent account deletion after confirmation. */
  async function handleAccountDeletion() {
    setIsDeleting(true);
    try {
      const result = await requestAccountDeletion(csrfToken);
      if (!result.success) {
        toast.error(result.error ?? "Failed to delete account", {
          duration: TOAST_DURATIONS.ERROR,
        });
        return;
      }

      toast.success("Account deleted", {
        description:
          "Your account has been permanently deleted. You will be redirected shortly.",
        duration: TOAST_DURATIONS.SUCCESS,
      });

      // Redirect to homepage after deletion
      setTimeout(() => {
        window.location.href = "https://helvety.com";
      }, 2000);
    } catch (error) {
      logger.error("Error deleting account:", error);
      toast.error("An unexpected error occurred", {
        duration: TOAST_DURATIONS.ERROR,
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmText("");
    }
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-64" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-48" />
              </div>
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
                      <p className="text-destructive text-sm">{emailError}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={isChangingEmail || !newEmail.trim()}
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

      {/* Data Export (nDSG Art. 28 — Right to Data Portability) */}
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
            This export includes your profile information, subscription history,
            purchase history, and tenant registrations. For Helvety Tasks
            (end-to-end encrypted data), please use the export feature within
            the Tasks app while signed in.
          </p>
          <Button
            variant="outline"
            onClick={handleDataExport}
            disabled={isExporting || isLoadingUser}
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

      {/* Account Deletion (nDSG Art. 32(2) — Right to Erasure) */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            This action is irreversible. Deleting your account will:
          </p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>Cancel all active subscriptions immediately</li>
            <li>Delete your profile, credentials, and passkeys</li>
            <li>
              Delete all task data and encrypted file attachments (Helvety
              Tasks)
            </li>
            <li>Remove all tenant registrations</li>
          </ul>
          <p className="text-muted-foreground text-sm">
            Transaction records required for Swiss tax compliance (Art. 958f OR)
            will be retained in anonymized form for 10 years.
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
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <span className="block">
                    This action cannot be undone. Your account and all
                    associated data will be permanently deleted across all
                    Helvety services.
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
