"use client";

import { cn } from "@helvety/shared/utils";
import { Check } from "lucide-react";

/** Type of authentication flow (legacy; prefer `AuthStepperMode`). */
export type AuthFlowType = "new_user" | "returning_user";

/** Steps in the authentication flow */
export type AuthStep = "email" | "verify_code" | "create_passkey" | "sign_in";

/** Stepper layout: 4 steps for everyone before OTP; 4 after OTP when setup needed; 3 when setup is skipped. */
export type AuthStepperMode =
  | "four_before_otp"
  | "four_full"
  | "three_skip_setup";

/** Configuration for a single authentication step. */
interface StepConfig {
  id: AuthStep;
  label: string;
}

const STEPS_BY_MODE: Record<AuthStepperMode, StepConfig[]> = {
  four_before_otp: [
    { id: "email", label: "Email" },
    { id: "verify_code", label: "Verification Code" },
    { id: "create_passkey", label: "Passkey Setup" },
    { id: "sign_in", label: "Passkey Sign-in" },
  ],
  four_full: [
    { id: "email", label: "Email" },
    { id: "verify_code", label: "Verification Code" },
    { id: "create_passkey", label: "Passkey Setup" },
    { id: "sign_in", label: "Passkey Sign-in" },
  ],
  three_skip_setup: [
    { id: "email", label: "Email" },
    { id: "verify_code", label: "Verification Code" },
    { id: "sign_in", label: "Passkey Sign-in" },
  ],
};

/**
 * Maps legacy flow types to the closest stepper mode (for backwards compatibility).
 */
export function authFlowTypeToStepperMode(
  flowType: AuthFlowType
): AuthStepperMode {
  return flowType === "new_user" ? "four_full" : "three_skip_setup";
}

/** Props for the AuthStepper component. */
interface AuthStepperProps {
  /** Current stepper layout (four steps before OTP, or 3/4 after OTP). */
  mode: AuthStepperMode;
  /** Current logical step. */
  currentStep: AuthStep;
  className?: string;
}

/**
 * Stepper component for the authentication flow.
 */
export function AuthStepper({
  mode,
  currentStep,
  className,
}: AuthStepperProps) {
  const steps = STEPS_BY_MODE[mode];
  const rawCurrentIndex = steps.findIndex((s) => s.id === currentStep);
  const currentIndex =
    rawCurrentIndex === -1 ? steps.length - 1 : rawCurrentIndex;

  return (
    <div className={cn("mx-auto mb-6 w-full max-w-md", className)}>
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
      >
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === steps.length - 1;

          return (
            <div
              key={`${mode}-${step.id}`}
              className="flex flex-col items-center"
            >
              {/* Step circle with connector line */}
              <div className="relative flex w-full items-center justify-center">
                {/* Left connector - stops at circle edge */}
                {index > 0 && (
                  <div
                    className={cn(
                      "absolute left-0 h-0.5 w-[calc(50%-24px)]",
                      index <= currentIndex ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
                {/* Right connector - starts at circle edge */}
                {!isLast && (
                  <div
                    className={cn(
                      "absolute left-[calc(50%+24px)] h-0.5 w-[calc(50%-24px)]",
                      isComplete ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
                {/* Circle */}
                <div
                  className={cn(
                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
                    isComplete && "bg-primary text-primary-foreground",
                    isCurrent &&
                      "bg-primary/20 text-primary border-primary border-2",
                    !isComplete &&
                      !isCurrent &&
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {isComplete ? <Check className="h-5 w-5" /> : index + 1}
                </div>
              </div>
              {/* Label */}
              <span
                className={cn(
                  "mt-2 text-center text-xs",
                  isCurrent
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
