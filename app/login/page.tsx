"use client"

import { Mail, Loader2, ArrowLeft } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

type LoginStep = 'email' | 'check_email'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<LoginStep>('email')

  // Check for auth errors from callback - initialize error from URL params
  useEffect(() => {
    const authError = searchParams.get('error')
    if (authError === 'auth_failed' || authError === 'missing_params') {
      // Using startTransition to avoid cascading render warning
      const errorMessage = authError === 'auth_failed' 
        ? 'Authentication failed. Please try again.'
        : 'Invalid authentication link.'
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: reading from URL params on mount
      setError(errorMessage)
    }
  }, [searchParams])

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push("/")
      }
    }
    void checkUser()
  }, [router, supabase])

  // Send OTP to email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Get the current origin for the redirect URL
      const redirectTo = `${window.location.origin}/auth/callback`

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true, // Auto-register new users
          emailRedirectTo: redirectTo,
        },
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      setStep('check_email')
      setIsLoading(false)
    } catch {
      setError("Failed to send sign-in link")
      setIsLoading(false)
    }
  }

  // Go back to email step
  const handleBack = () => {
    setStep('email')
    setError("")
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center space-y-8">
        {/* Login Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              {step === 'email' && 'Welcome'}
              {step === 'check_email' && 'Check Your Email'}
            </CardTitle>
            <CardDescription>
              {step === 'email' && 'Enter your email to sign in or create an account'}
              {step === 'check_email' && `We sent an email to ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Continue with Email
                    </>
                  )}
                </Button>
              </form>
            )}

            {step === 'check_email' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Click the link in your email to continue.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={handleBack}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Use different email
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info about passwordless */}
        <p className="text-center text-xs text-muted-foreground max-w-sm">
          No password needed. We&apos;ll send a link to your email.
        </p>
      </div>
    </div>
  )
}

// Wrap in Suspense because useSearchParams requires it
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
