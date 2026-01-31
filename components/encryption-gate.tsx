'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState, useMemo, type ReactNode } from 'react'

import { getEncryptionParams } from '@/app/actions/encryption-actions'
import { EncryptionSetup } from '@/components/encryption-setup'
import { EncryptionUnlock } from '@/components/encryption-unlock'
import { useEncryptionContext, type PRFKeyParams } from '@/lib/crypto'

interface EncryptionGateProps {
  userId: string
  userEmail: string
  children: ReactNode
}

type EncryptionStatus = 
  | 'loading'
  | 'needs_setup'
  | 'needs_unlock'
  | 'unlocked'
  | 'error'

/**
 * Gate component that ensures encryption is set up and unlocked
 * before rendering children.
 * 
 * Supports passkey-based encryption (PRF).
 */
export function EncryptionGate({ userId, userEmail, children }: EncryptionGateProps) {
  const { isUnlocked, isLoading: contextLoading, checkEncryptionState } = useEncryptionContext()
  
  const [hasCheckedParams, setHasCheckedParams] = useState(false)
  const [passkeyParams, setPasskeyParams] = useState<PRFKeyParams | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualUnlock, setManualUnlock] = useState(false)

  // Check encryption state on mount
  useEffect(() => {
    async function checkState() {
      try {
        // First check if we have a cached key
        await checkEncryptionState(userId)
        
        // Then check if user has encryption params in DB
        const result = await getEncryptionParams()
        
        if (!result.success) {
          setError(result.error ?? 'Failed to check encryption status')
          setHasCheckedParams(true)
          return
        }

        if (result.data?.type === 'passkey' && result.data.passkeyParams) {
          // User has passkey encryption set up
          setPasskeyParams({
            prfSalt: result.data.passkeyParams.prf_salt,
            version: result.data.passkeyParams.version,
          })
        }
        
        setHasCheckedParams(true)
      } catch {
        setError('Failed to check encryption status')
        setHasCheckedParams(true)
      }
    }

    void checkState()
  }, [userId, checkEncryptionState])

  // Derive status from state (no setState in effect)
  const status: EncryptionStatus = useMemo(() => {
    if (error) return 'error'
    if (contextLoading || !hasCheckedParams) return 'loading'
    if (isUnlocked || manualUnlock) return 'unlocked'
    if (passkeyParams) return 'needs_unlock'
    return 'needs_setup'
  }, [error, contextLoading, hasCheckedParams, isUnlocked, manualUnlock, passkeyParams])

  // Handle unlock success
  const handleUnlock = () => {
    setManualUnlock(true)
  }

  // Handle setup complete
  const handleSetupComplete = () => {
    setManualUnlock(true)
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading encryption...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
        <div className="text-center">
          <p className="text-destructive">{error ?? 'An error occurred'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-muted-foreground hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (status === 'needs_setup') {
    return (
      <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
        <EncryptionSetup 
          userId={userId} 
          userEmail={userEmail}
          onComplete={handleSetupComplete} 
        />
      </div>
    )
  }

  if (status === 'needs_unlock' && passkeyParams) {
    return (
      <div className="flex flex-col items-center px-4 pt-8 md:pt-16 lg:pt-24">
        <EncryptionUnlock 
          userId={userId} 
          passkeyParams={passkeyParams}
          onUnlock={handleUnlock}
        />
      </div>
    )
  }

  // Unlocked - render children
  return <>{children}</>
}
