'use client'

import { Fingerprint, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { savePasskeyParams } from '@/app/actions/encryption-actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useEncryptionContext, PRF_VERSION } from '@/lib/crypto'

interface EncryptionSetupProps {
  userId: string
  userEmail: string
  onComplete?: () => void
}

/**
 * Component for setting up encryption with passkey
 * Uses WebAuthn PRF extension to derive encryption keys from device biometrics
 */
export function EncryptionSetup({ userId, userEmail, onComplete }: EncryptionSetupProps) {
  const router = useRouter()
  const { 
    initializePasskeyEncryption, 
    prfSupported, 
    prfSupportInfo,
    checkPRFSupport,
    isLoading: contextLoading,
  } = useEncryptionContext()
  
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSupport, setIsCheckingSupport] = useState(true)

  // Check PRF support on mount
  useEffect(() => {
    const checkSupport = async () => {
      await checkPRFSupport()
      setIsCheckingSupport(false)
    }
    void checkSupport()
  }, [checkPRFSupport])

  const handleSetup = async () => {
    setError('')
    setIsLoading(true)

    try {
      // Initialize encryption with passkey (registers passkey + derives key from PRF)
      const result = await initializePasskeyEncryption(userId, userEmail)
      
      if (!result) {
        setError('Failed to set up passkey encryption')
        setIsLoading(false)
        return
      }

      // Save passkey params to database
      const saveResult = await savePasskeyParams({
        prf_salt: result.params.prfSalt,
        credential_id: result.credentialId,
        version: PRF_VERSION,
      })

      if (!saveResult.success) {
        setError(saveResult.error ?? 'Failed to save passkey settings')
        setIsLoading(false)
        return
      }

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
    }
  }

  // Show loading while checking PRF support
  if (isCheckingSupport || contextLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Show unsupported message if PRF is not available
  if (prfSupported === false) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle>Browser Not Supported</CardTitle>
          </div>
          <CardDescription>
            Your browser or device doesn&apos;t support passkey encryption.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
            <p className="text-sm text-amber-500">
              {prfSupportInfo?.reason ?? 'Passkey PRF extension is not supported'}
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Supported browsers:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Chrome 128+ / Edge 128+</li>
              <li>Safari 18+ (macOS 15.4+, iOS 18+)</li>
              <li>Android 14+ with Chrome</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <CardTitle>Set Up Encryption</CardTitle>
        </div>
        <CardDescription>
          Use your device&apos;s biometrics (Face ID, Touch ID, or Windows Hello) to
          secure your data with end-to-end encryption.
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
                your passkey from this device, your data cannot be recovered.
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
              <p className="font-medium">Passkey Encryption</p>
              <p className="text-sm text-muted-foreground">
                No password to remember
              </p>
            </div>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1 ml-13">
            <li>• Use Face ID, Touch ID, Windows Hello, or your phone</li>
            <li>• Data is encrypted before leaving your device</li>
            <li>• Only you can decrypt your data</li>
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
              Setting up...
            </>
          ) : (
            <>
              <Fingerprint className="mr-2 h-4 w-4" />
              Create Passkey
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {prfSupportInfo?.browserInfo && `Detected: ${prfSupportInfo.browserInfo}`}
        </p>
      </CardContent>
    </Card>
  )
}
