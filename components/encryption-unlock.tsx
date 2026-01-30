'use client'

import { Fingerprint, Lock, Loader2 } from 'lucide-react'
import { useState } from 'react'

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
  onUnlock?: () => void
}

/**
 * Component for unlocking encryption with passkey
 * Shown to users who have set up passkey encryption but need to unlock
 */
export function EncryptionUnlock({
  userId,
  passkeyParams,
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
    <Card className="w-full max-w-md">
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
            <Fingerprint className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Passkey Authentication</p>
            <p className="text-sm text-muted-foreground">
              Use Face ID, Touch ID, Windows Hello, or your phone
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
      </CardContent>
    </Card>
  )
}
