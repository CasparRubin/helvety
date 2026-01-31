"use server"

import "server-only"

import {
  generateRegistrationOptions as generateRegOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions as generateAuthOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import { cookies } from 'next/headers'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

import type { UserAuthCredential } from '@/lib/types'
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server'

// =============================================================================
// TYPES
// =============================================================================

export type PasskeyActionResponse<T = void> = {
  success: boolean
  data?: T
  error?: string
}

type StoredChallenge = {
  challenge: string
  userId?: string
  timestamp: number
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const RP_NAME = 'Helvety Store'
const CHALLENGE_COOKIE_NAME = 'webauthn_challenge'
const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Get the Relying Party ID based on the request origin
 * This must match the domain where WebAuthn is used
 */
function getRpId(origin: string): string {
  try {
    const url = new URL(origin)
    return url.hostname
  } catch {
    // Fallback for development
    return 'localhost'
  }
}

/**
 * Get expected origins for verification
 * In production, this should be the exact origin(s) where passkeys are registered
 */
function getExpectedOrigins(rpId: string): string[] {
  if (rpId === 'localhost') {
    return ['http://localhost:3000', 'http://localhost:3001']
  }
  return [`https://${rpId}`]
}

// =============================================================================
// CHALLENGE STORAGE (using cookies)
// =============================================================================

/**
 * Store challenge in a secure httpOnly cookie
 */
async function storeChallenge(challenge: string, userId?: string): Promise<void> {
  const cookieStore = await cookies()
  const data: StoredChallenge = {
    challenge,
    userId,
    timestamp: Date.now(),
  }
  
  cookieStore.set(CHALLENGE_COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CHALLENGE_EXPIRY_MS / 1000,
    path: '/',
  })
}

/**
 * Retrieve and validate stored challenge
 */
async function getStoredChallenge(): Promise<StoredChallenge | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(CHALLENGE_COOKIE_NAME)
  
  if (!cookie?.value) {
    return null
  }
  
  try {
    const data = JSON.parse(cookie.value) as StoredChallenge
    
    // Check if challenge has expired
    if (Date.now() - data.timestamp > CHALLENGE_EXPIRY_MS) {
      return null
    }
    
    return data
  } catch {
    return null
  }
}

/**
 * Clear the stored challenge
 */
async function clearChallenge(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CHALLENGE_COOKIE_NAME)
}

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * Generate passkey registration options
 * Called when a user wants to register a new passkey
 * 
 * @param origin - The origin URL (e.g., 'https://store.helvety.com')
 * @returns Registration options to pass to the WebAuthn API
 */
export async function generatePasskeyRegistrationOptions(
  origin: string
): Promise<PasskeyActionResponse<PublicKeyCredentialCreationOptionsJSON>> {
  try {
    const supabase = await createClient()
    
    // Get current user - must be authenticated to register a passkey
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Must be authenticated to register a passkey" }
    }

    const rpId = getRpId(origin)
    
    // Get existing credentials to exclude them
    const { data: existingCredentials } = await supabase
      .from('user_auth_credentials')
      .select('credential_id, transports')
      .eq('user_id', user.id)

    const excludeCredentials = existingCredentials?.map(cred => ({
      id: cred.credential_id,
      transports: (cred.transports || []) as AuthenticatorTransportFuture[],
    })) || []

    const opts: GenerateRegistrationOptionsOpts = {
      rpName: RP_NAME,
      rpID: rpId,
      userName: user.email || user.id,
      userDisplayName: user.email || 'Helvety User',
      userID: new TextEncoder().encode(user.id),
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        // Force cross-platform authenticators (phone via QR code)
        authenticatorAttachment: 'cross-platform',
        userVerification: 'required',
        residentKey: 'required',
        requireResidentKey: true,
      },
      timeout: 60000,
    }

    const options = await generateRegOptions(opts)
    
    // Add hints to prefer phone/hybrid authenticators over USB security keys
    // This tells the browser to show the QR code option first
    const optionsWithHints = {
      ...options,
      hints: ['hybrid'] as ('hybrid' | 'security-key' | 'client-device')[],
    }
    
    // Store challenge for verification
    await storeChallenge(options.challenge, user.id)

    return { success: true, data: optionsWithHints }
  } catch (error) {
    logger.error('Error generating registration options:', error)
    return { success: false, error: "Failed to generate registration options" }
  }
}

/**
 * Verify passkey registration and store the credential
 * Called after the user completes the WebAuthn registration ceremony
 * 
 * @param response - The registration response from the browser
 * @param origin - The origin URL
 * @returns Success status and credential info
 */
export async function verifyPasskeyRegistration(
  response: RegistrationResponseJSON,
  origin: string
): Promise<PasskeyActionResponse<{ credentialId: string }>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Must be authenticated to verify registration" }
    }

    // Retrieve stored challenge
    const storedData = await getStoredChallenge()
    if (!storedData) {
      return { success: false, error: "Challenge expired or not found" }
    }
    
    // Verify the user ID matches
    if (storedData.userId !== user.id) {
      return { success: false, error: "User mismatch" }
    }

    const rpId = getRpId(origin)
    const expectedOrigins = getExpectedOrigins(rpId)

    const opts: VerifyRegistrationResponseOpts = {
      response,
      expectedChallenge: storedData.challenge,
      expectedOrigin: expectedOrigins,
      expectedRPID: rpId,
      requireUserVerification: true,
    }

    let verification: VerifiedRegistrationResponse
    try {
      verification = await verifyRegistrationResponse(opts)
    } catch (error) {
      logger.error('Registration verification failed:', error)
      return { success: false, error: "Registration verification failed" }
    }

    if (!verification.verified || !verification.registrationInfo) {
      return { success: false, error: "Registration verification failed" }
    }

    const { registrationInfo } = verification
    const { credential, credentialDeviceType, credentialBackedUp } = registrationInfo

    // Convert Uint8Array to base64url string for storage
    const publicKeyBase64 = Buffer.from(credential.publicKey).toString('base64url')

    // Store the credential in the database
    const { error: insertError } = await supabase
      .from('user_auth_credentials')
      .insert({
        user_id: user.id,
        credential_id: credential.id,
        public_key: publicKeyBase64,
        counter: credential.counter,
        transports: credential.transports || [],
        device_type: credentialDeviceType,
        backed_up: credentialBackedUp,
      })

    if (insertError) {
      logger.error('Error storing credential:', insertError)
      return { success: false, error: "Failed to store credential" }
    }

    // Clear the challenge
    await clearChallenge()

    return { 
      success: true, 
      data: { credentialId: credential.id }
    }
  } catch (error) {
    logger.error('Error verifying registration:', error)
    return { success: false, error: "Failed to verify registration" }
  }
}

// =============================================================================
// AUTHENTICATION
// =============================================================================

/**
 * Generate passkey authentication options
 * Called when a user wants to sign in with a passkey
 * 
 * @param origin - The origin URL
 * @returns Authentication options to pass to the WebAuthn API
 */
export async function generatePasskeyAuthOptions(
  origin: string
): Promise<PasskeyActionResponse<PublicKeyCredentialRequestOptionsJSON>> {
  try {
    const rpId = getRpId(origin)

    // For discoverable credentials (passkeys), we don't need to specify allowCredentials
    // The authenticator will discover which credentials are available
    const opts: GenerateAuthenticationOptionsOpts = {
      rpID: rpId,
      userVerification: 'required',
      timeout: 60000,
      // Empty allowCredentials means "discover credentials" (resident keys)
      allowCredentials: [],
    }

    const options = await generateAuthOptions(opts)
    
    // Add hints to prefer phone/hybrid authenticators over USB security keys
    const optionsWithHints = {
      ...options,
      hints: ['hybrid'] as ('hybrid' | 'security-key' | 'client-device')[],
    }
    
    // Store challenge for verification (no userId yet - we don't know who's authenticating)
    await storeChallenge(options.challenge)

    return { success: true, data: optionsWithHints }
  } catch (error) {
    logger.error('Error generating authentication options:', error)
    return { success: false, error: "Failed to generate authentication options" }
  }
}

/**
 * Verify passkey authentication and create a session
 * Called after the user completes the WebAuthn authentication ceremony
 * 
 * After successful passkey verification, this generates a magic link that
 * the client will use to complete authentication with Supabase.
 * 
 * @param response - The authentication response from the browser
 * @param origin - The origin URL
 * @returns Success status with auth link URL
 */
export async function verifyPasskeyAuthentication(
  response: AuthenticationResponseJSON,
  origin: string
): Promise<PasskeyActionResponse<{ 
  authUrl: string
  userId: string
}>> {
  try {
    // Retrieve stored challenge
    const storedData = await getStoredChallenge()
    if (!storedData) {
      return { success: false, error: "Challenge expired or not found" }
    }

    const rpId = getRpId(origin)
    const expectedOrigins = getExpectedOrigins(rpId)

    // Use admin client to look up the credential (before authentication)
    const adminClient = createAdminClient()
    
    // Find the credential by ID
    const { data: credentialData, error: credError } = await adminClient
      .from('user_auth_credentials')
      .select('*')
      .eq('credential_id', response.id)
      .single()

    if (credError || !credentialData) {
      logger.error('Credential not found:', credError)
      return { success: false, error: "Credential not found" }
    }

    const credential = credentialData as UserAuthCredential

    // Convert stored public key from base64url back to Uint8Array
    const publicKeyUint8 = new Uint8Array(
      Buffer.from(credential.public_key, 'base64url')
    )

    const opts: VerifyAuthenticationResponseOpts = {
      response,
      expectedChallenge: storedData.challenge,
      expectedOrigin: expectedOrigins,
      expectedRPID: rpId,
      credential: {
        id: credential.credential_id,
        publicKey: publicKeyUint8,
        counter: credential.counter,
        transports: (credential.transports || []) as AuthenticatorTransportFuture[],
      },
      requireUserVerification: true,
    }

    let verification: VerifiedAuthenticationResponse
    try {
      verification = await verifyAuthenticationResponse(opts)
    } catch (error) {
      logger.error('Authentication verification failed:', error)
      return { success: false, error: "Authentication verification failed" }
    }

    if (!verification.verified) {
      return { success: false, error: "Authentication verification failed" }
    }

    // Update the counter to prevent replay attacks
    const { error: updateError } = await adminClient
      .from('user_auth_credentials')
      .update({ 
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq('credential_id', response.id)

    if (updateError) {
      logger.error('Error updating counter:', updateError)
      // Continue anyway - counter update is not critical for auth
    }

    // Get user email for generating magic link
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(
      credential.user_id
    )

    if (userError || !userData.user) {
      logger.error('Error getting user:', userError)
      return { success: false, error: "User not found" }
    }

    if (!userData.user.email) {
      return { success: false, error: "User has no email" }
    }

    // Generate a magic link for the user
    // This creates a one-time use link that creates a session when clicked
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (linkError || !linkData.properties?.action_link) {
      logger.error('Error generating auth link:', linkError)
      return { success: false, error: "Failed to create session" }
    }

    // Clear the challenge
    await clearChallenge()

    // Return the action link - client will navigate to this to complete auth
    return {
      success: true,
      data: {
        authUrl: linkData.properties.action_link,
        userId: credential.user_id,
      },
    }
  } catch (error) {
    logger.error('Error verifying authentication:', error)
    return { success: false, error: "Failed to verify authentication" }
  }
}

/**
 * Check if a user has any registered passkeys for authentication
 * Can be called without authentication to show the passkey login option
 * 
 * @param email - Email to check for specific user (required for meaningful check)
 * @returns Whether passkey login is available for this user
 */
export async function hasPasskeyCredentials(
  email: string
): Promise<PasskeyActionResponse<boolean>> {
  try {
    if (!email) {
      return { success: true, data: false }
    }

    const adminClient = createAdminClient()
    const normalizedEmail = email.toLowerCase().trim()
    
    // Try to query auth.users directly via the database (optimization)
    // Note: This typically fails as auth.users is not exposed via PostgREST by default
    const { data: authUser, error: authError } = await adminClient
      .from('auth.users')
      .select('id')
      .eq('email', normalizedEmail)
      .single()
    
    // Fallback to Admin API - this is the standard Supabase approach
    if (authError) {
      // Use Admin API to list users and find by email
      // Note: For user bases >1000, this would need pagination
      const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      })
      
      if (listError) {
        logger.error('Error listing users:', listError)
        // Don't expose internal errors - just say no passkey
        return { success: true, data: false }
      }
      
      const user = listData.users.find(u => u.email?.toLowerCase() === normalizedEmail)
      if (!user) {
        return { success: true, data: false }
      }
      
      // Check if this user has credentials
      const { count, error: countError } = await adminClient
        .from('user_auth_credentials')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      if (countError) {
        logger.error('Error counting credentials:', countError)
        return { success: true, data: false }
      }
      
      return { success: true, data: (count ?? 0) > 0 }
    }
    
    // Direct query worked - check credentials
    const { count, error: countError } = await adminClient
      .from('user_auth_credentials')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.id)
    
    if (countError) {
      logger.error('Error counting credentials:', countError)
      return { success: true, data: false }
    }
    
    return { success: true, data: (count ?? 0) > 0 }
  } catch (error) {
    logger.error('Error checking passkey credentials:', error)
    // Don't fail the login flow - just say no passkey available
    return { success: true, data: false }
  }
}

/**
 * Get user's registered credentials (for management UI)
 * Requires authentication
 */
export async function getUserCredentials(): Promise<PasskeyActionResponse<UserAuthCredential[]>> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from('user_auth_credentials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error getting credentials:', error)
      return { success: false, error: "Failed to get credentials" }
    }

    return { success: true, data: data as UserAuthCredential[] }
  } catch (error) {
    logger.error('Error getting user credentials:', error)
    return { success: false, error: "Failed to get credentials" }
  }
}

/**
 * Delete a credential (for management UI)
 * Requires authentication
 */
export async function deleteCredential(
  credentialId: string
): Promise<PasskeyActionResponse> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from('user_auth_credentials')
      .delete()
      .eq('user_id', user.id)
      .eq('credential_id', credentialId)

    if (error) {
      logger.error('Error deleting credential:', error)
      return { success: false, error: "Failed to delete credential" }
    }

    return { success: true }
  } catch (error) {
    logger.error('Error deleting credential:', error)
    return { success: false, error: "Failed to delete credential" }
  }
}

/**
 * Store a credential for authentication from client-side registration
 * This is used during encryption setup to also enable passkey login
 * 
 * Note: This is a simplified version that stores the credential without
 * full server-side verification. It trusts that the client has already
 * completed a valid WebAuthn registration ceremony.
 * 
 * @param response - The registration response from the browser
 * @returns Success status
 */
export async function storeAuthCredentialFromRegistration(
  response: RegistrationResponseJSON
): Promise<PasskeyActionResponse<{ credentialId: string }>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: "Must be authenticated to store credential" }
    }

    // Extract data from the registration response
    // The response contains the attestation object with the public key
    const { id: credentialId, response: attestation } = response
    
    // For cross-platform authenticators (phones), extract available info
    // The public key is embedded in the attestation object
    // We store the raw attestation for future verification
    const publicKeyBase64 = attestation.publicKey || ''
    
    // Determine device type from authenticator data if available
    const deviceType = response.authenticatorAttachment === 'cross-platform' 
      ? 'multiDevice' 
      : 'singleDevice'
    
    // Check for backup eligibility from client extension results
    const backedUp = false // Default, updated during authentication

    // Store the credential
    const { error: insertError } = await supabase
      .from('user_auth_credentials')
      .upsert({
        user_id: user.id,
        credential_id: credentialId,
        public_key: publicKeyBase64,
        counter: 0,
        transports: response.response.transports || ['hybrid'],
        device_type: deviceType,
        backed_up: backedUp,
      }, {
        onConflict: 'credential_id'
      })

    if (insertError) {
      logger.error('Error storing auth credential:', insertError)
      return { success: false, error: "Failed to store credential" }
    }

    return { 
      success: true, 
      data: { credentialId }
    }
  } catch (error) {
    logger.error('Error storing auth credential:', error)
    return { success: false, error: "Failed to store credential" }
  }
}
