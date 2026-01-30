'use client'

import { Fingerprint, Lock, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { AuthStepper, type AuthFlowType } from '@/components/auth-stepper'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useEncryptionContext, type PRFKeyParams } from '@/lib/crypto'

interface EncryptionUnlockProps {
  userId: string
  /** PRF-based params for passkey unlock */
  passkeyParams: PRFKeyParams
  /** Flow type for the stepper */
  flowType?: AuthFlowType
  onUnlock?: () => void
}

/**
 * Component for unlocking encryption with passkey
 * Shown to users who have set up passkey encryption but need to unlock
 */
export function EncryptionUnlock({
  userId,
  passkeyParams,
  flowType = 'returning_user',
  onUnlock,
}: EncryptionUnlockProps) {
  const { unlockWithPasskey } = useEncryptionContext()
  
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleUnlock = async () => {
    setError('')
    setIsLoading(true)

    try {
      const success = await unlockWithPasskey(userId, passkeyParams)
      
      if (!success) {
        setError('Failed to authenticate with passkey')
        setIsLoading(false)
        return
      }

      // Success
      if (onUnlock) {
        onUnlock()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unlock encryption'
      setError(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md">
      <AuthStepper flowType={flowType} currentStep="sign_in" />
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle>Unlock Your Data</CardTitle>
          </div>
          <CardDescription>
            Use your passkey to decrypt and access your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <Fingerprint className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium">Passkey Authentication</p>
              <p className="text-sm text-muted-foreground">
                Scan the QR code with your phone
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button 
            onClick={handleUnlock} 
            className="w-full" 
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Unlocking...
              </>
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                Unlock with Passkey
              </>
            )}
          </Button>

          {isLoading && (
            <p className="text-xs text-center text-muted-foreground">
              Waiting for your phone...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
