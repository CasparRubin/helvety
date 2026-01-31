'use client'

import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Type of authentication flow */
export type AuthFlowType = 'new_user' | 'returning_user'

/** Steps in the authentication flow */
export type AuthStep = 'email' | 'create_passkey' | 'verify_encryption' | 'sign_in'

interface StepConfig {
  id: AuthStep
  label: string
}

/** Step configurations for each flow type */
const FLOW_STEPS: Record<AuthFlowType, StepConfig[]> = {
  new_user: [
    { id: 'email', label: 'Email' },
    { id: 'create_passkey', label: 'Setup Passkey' },
    { id: 'verify_encryption', label: 'Sign In' },
  ],
  returning_user: [
    { id: 'email', label: 'Email' },
    { id: 'sign_in', label: 'Sign In' },
  ],
}

interface AuthStepperProps {
  /** The type of flow (new user or returning user) */
  flowType: AuthFlowType
  /** The current step in the flow */
  currentStep: AuthStep
  /** Optional className for the container */
  className?: string
}

/**
 * Unified stepper component for the authentication flow.
 * Shows progress through email -> passkey setup/sign-in steps.
 */
export function AuthStepper({ flowType, currentStep, className }: AuthStepperProps) {
  const steps = FLOW_STEPS[flowType]
  const currentIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className={cn("w-full max-w-md mx-auto mb-6", className)}>
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex
          const isCurrent = index === currentIndex
          const isLast = index === steps.length - 1

          return (
            <div key={step.id} className="flex items-center">
              {/* Step circle and label */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
                    isComplete && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary/20 text-primary border-2 border-primary",
                    !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isComplete ? <Check className="h-5 w-5" /> : index + 1}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs whitespace-nowrap",
                    isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "h-0.5 w-12 mx-2 mb-6",
                    isComplete ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Helper to determine the current auth step based on setup state
 */
export function getSetupStep(setupStep: 'initial' | 'registering' | 'ready_to_sign_in' | 'signing_in' | 'complete'): AuthStep {
  switch (setupStep) {
    case 'initial':
    case 'registering':
      return 'create_passkey'
    case 'ready_to_sign_in':
    case 'signing_in':
    case 'complete':
      return 'verify_encryption'
    default:
      return 'create_passkey'
  }
}
