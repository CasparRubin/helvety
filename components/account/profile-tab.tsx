"use client";

import { User, Mail, Calendar, Loader2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { getCurrentUser, updateUserEmail } from "@/app/actions/account-actions";
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
import { TOAST_DURATIONS } from "@/lib/constants";
import { logger } from "@/lib/logger";

/**
 *
 */
interface UserData {
  id: string;
  email: string;
  createdAt: string;
}

/**
 *
 */
export function ProfileTab() {
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

  /**
   *
   */
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
      const result = await updateUserEmail(newEmail.trim());

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
    </div>
  );
}
