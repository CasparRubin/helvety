'use client'

import { Fingerprint, ShieldCheck, AlertTriangle, Loader2, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

import { savePasskeyParams } from '@/app/actions/encryption-actions'
import { 
  generatePasskeyRegistrationOptions, 
  verifyPasskeyRegistration 
} from '@/app/actions/passkey-auth-actions'
import { AuthStepper, getSetupStep, type AuthFlowType } from '@/components/auth-stepper'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useEncryptionContext, PRF_VERSION } from '@/lib/crypto'
import { storeMasterKey } from '@/lib/crypto/key-storage'
import { 
  registerPasskey, 
  authenticatePasskeyWithEncryption,
} from '@/lib/crypto/passkey'
import { generatePRFParams, deriveKeyFromPRF } from '@/lib/crypto/prf-key-derivation'

interface EncryptionSetupProps {
  userId: string
  userEmail: string
  flowType?: AuthFlowType
  onComplete?: () => void
}

/** Setup step for tracking progress through the two-step flow */
type SetupStep = 'initial' | 'registering' | 'verifying' | 'complete'

/**
 * Component for setting up encryption with passkey
 * Uses WebAuthn PRF extension to derive encryption keys from device biometrics
 * Also registers the passkey for authentication (passwordless login)
 */
export function EncryptionSetup({ userId, userEmail: _userEmail, flowType = 'new_user', onComplete }: EncryptionSetupProps) {
  const router = useRouter()
  const { 
    prfSupported, 
    prfSupportInfo,
    checkPRFSupport,
    isLoading: contextLoading,
  } = useEncryptionContext()
  
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSupport, setIsCheckingSupport] = useState(true)
  const [setupStep, setSetupStep] = useState<SetupStep>('initial')
  const setupInProgressRef = useRef(false)

  // Get the current auth step for the stepper
  const currentAuthStep = getSetupStep(setupStep)

  // Check PRF support on mount
  useEffect(() => {
    const checkSupport = async () => {
      await checkPRFSupport()
      setIsCheckingSupport(false)
    }
    void checkSupport()
  }, [checkPRFSupport])

  // Reset to initial state (used when cancelling during step 1)
  const resetSetup = () => {
    setSetupStep('initial')
    setIsLoading(false)
    setError('')
    setupInProgressRef.current = false
  }

  const handleSetup = async () => {
    // Prevent double submission
    if (setupInProgressRef.current) return
    setupInProgressRef.current = true
    
    setError('')
    setIsLoading(true)

    try {
      const origin = window.location.origin

      // Generate PRF params for encryption
      const prfParams = generatePRFParams()

      // Step 1: Generate server-side registration options for auth
      const serverOptions = await generatePasskeyRegistrationOptions(origin)
      if (!serverOptions.success || !serverOptions.data) {
        setError(serverOptions.error || 'Failed to generate registration options')
        resetSetup()
        return
      }

      // Step 2: Register passkey with both auth challenge and PRF
      // Show registering step UI before triggering WebAuthn
      setSetupStep('registering')
      
      let regResult
      try {
        // Cast to allow PRF extension (not in standard types but supported by browsers)
        const optionsWithPRF = serverOptions.data as Parameters<typeof registerPasskey>[0] & {
          extensions?: Record<string, unknown>
        }
        
        // Add PRF extension for encryption key derivation
        optionsWithPRF.extensions = {
          ...(optionsWithPRF.extensions || {}),
          prf: {
            eval: {
              first: new Uint8Array(Buffer.from(prfParams.prfSalt, 'base64')),
            },
          },
        }
        
        regResult = await registerPasskey(optionsWithPRF)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Passkey registration failed'
        // Check if user cancelled
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setError('Passkey creation was cancelled. Please try again.')
        } else {
          setError(message)
        }
        resetSetup()
        return
      }

      if (!regResult.prfEnabled) {
        setError('Your authenticator does not support encryption. Please try a different device.')
        resetSetup()
        return
      }

      // Step 3: Verify and store credential for authentication (server-side)
      const verifyResult = await verifyPasskeyRegistration(regResult.response, origin)
      if (!verifyResult.success) {
        // Log but don't fail - encryption is more important
        console.warn('Failed to store auth credential:', verifyResult.error)
        // Continue with encryption setup
      }

      // Step 4: Authenticate to get PRF output (required for encryption key)
      // Show verifying step UI before triggering WebAuthn again
      setSetupStep('verifying')
      
      let authResult
      try {
        authResult = await authenticatePasskeyWithEncryption(
          [regResult.credentialId],
          prfParams.prfSalt
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to authenticate for encryption'
        // Check if user cancelled - they can retry just step 2 since passkey is already created
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setError('Verification was cancelled. Your passkey was created - please verify to complete setup.')
        } else {
          setError(message)
        }
        // Stay on verifying step so user can retry
        setIsLoading(false)
        setupInProgressRef.current = false
        return
      }

      if (!authResult.prfOutput) {
        setError('Failed to get encryption key from passkey. Please try again.')
        setIsLoading(false)
        setupInProgressRef.current = false
        return
      }

      // Step 5: Derive master key from PRF output
      const masterKey = await deriveKeyFromPRF(authResult.prfOutput, prfParams)

      // Step 6: Cache the master key
      await storeMasterKey(userId, masterKey)

      // Step 7: Save encryption params to database
      const saveResult = await savePasskeyParams({
        prf_salt: prfParams.prfSalt,
        credential_id: regResult.credentialId,
        version: PRF_VERSION,
      })

      if (!saveResult.success) {
        setError(saveResult.error ?? 'Failed to save passkey settings')
        setIsLoading(false)
        setupInProgressRef.current = false
        return
      }

      // Mark as complete before redirect
      setSetupStep('complete')

      // Success - redirect or callback
      if (onComplete) {
        onComplete()
      } else {
        router.push('/')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message)
      setIsLoading(false)
      setupInProgressRef.current = false
    }
  }

  // Retry verification step (when user cancelled during step 2)
  const handleRetryVerification = async () => {
    // This would need the stored regResult and prfParams
    // For simplicity, we'll reset and start over
    // A more sophisticated implementation could cache these values
    resetSetup()
  }

  // Show loading while checking PRF support
  if (isCheckingSupport || contextLoading) {
    return (
      <div className="flex flex-col items-center w-full max-w-md">
        <AuthStepper flowType={flowType} currentStep="create_passkey" />
        <Card className="w-full">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show unsupported message if PRF is not available
  if (prfSupported === false) {
    return (
      <div className="flex flex-col items-center w-full max-w-md">
        <AuthStepper flowType={flowType} currentStep="create_passkey" />
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle>Browser Not Supported</CardTitle>
            </div>
            <CardDescription>
              Your browser doesn&apos;t support passkey encryption with your phone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
              <p className="text-sm text-amber-500">
                {prfSupportInfo?.reason ?? 'Phone passkey encryption is not supported'}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Supported browsers:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Chrome 128+ or Edge 128+ on desktop</li>
                <li>Safari 18+ on Mac</li>
              </ul>
              <p className="font-medium mt-3 mb-2">Supported phones:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>iPhone with iOS 18+</li>
                <li>Android 14+ with Chrome</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show step-specific UI when in registering or verifying state
  if (setupStep === 'registering' || setupStep === 'verifying') {
    return (
      <div className="flex flex-col items-center w-full max-w-md">
        <AuthStepper flowType={flowType} currentStep={currentAuthStep} />
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>
                {setupStep === 'registering' ? 'Create Passkey' : 'Verify Encryption'}
              </CardTitle>
            </div>
            <CardDescription>
              {setupStep === 'registering' 
                ? 'Save the passkey to your phone'
                : 'Authenticate to activate encryption'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : (
                    <Fingerprint className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {setupStep === 'registering' ? 'Scan QR Code' : 'Scan Again'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {setupStep === 'registering' 
                      ? 'Use your phone to scan the QR code'
                      : 'Scan once more to complete setup'
                    }
                  </p>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  {setupStep === 'registering' 
                    ? 'Scan the QR code with your phone and save the passkey using Face ID or fingerprint.'
                    : 'Scan the QR code again with your phone to verify and activate encryption.'
                  }
                </p>
              </div>
            </div>

            {error && (
              <div className="space-y-2">
                <p className="text-sm text-destructive">{error}</p>
                {setupStep === 'verifying' && !isLoading && (
                  <Button 
                    onClick={handleRetryVerification} 
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    Start Over
                  </Button>
                )}
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-2">
                <p className="text-sm text-muted-foreground">
                  Waiting for your phone...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Initial state - show setup introduction
  return (
    <div className="flex flex-col items-center w-full max-w-md">
      <AuthStepper flowType={flowType} currentStep="create_passkey" />
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle>Set Up Encryption</CardTitle>
          </div>
          <CardDescription>
            Use your iPhone, iPad, or Android phone to secure your data with 
            end-to-end encryption.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
              <div className="text-sm text-amber-500">
                <p className="font-medium">Important</p>
                <p className="mt-1 text-amber-500/80">
                  Your passkey is the only way to decrypt your data. If you remove
                  the passkey from your phone, your data cannot be recovered.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Fingerprint className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Phone Passkey</p>
                <p className="text-sm text-muted-foreground">
                  Secured with Face ID or fingerprint
                </p>
              </div>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 ml-13">
              <li>• Scan QR code with your phone</li>
              <li>• Verify with Face ID or fingerprint</li>
              <li>• Your data stays encrypted</li>
            </ul>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button 
            onClick={handleSetup} 
            className="w-full" 
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Smartphone className="mr-2 h-4 w-4" />
                Set Up with Phone
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You&apos;ll scan two QR codes with your phone to complete setup.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
