"use client"

// React
import * as React from "react"

// Next.js
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

// External libraries
import { Github, Info } from "lucide-react"

// Internal components
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

export function Navbar(): React.JSX.Element {
  const pathname = usePathname()
  const [isAboutOpen, setIsAboutOpen] = React.useState(true)
  const [hasAcknowledged, setHasAcknowledged] = React.useState(false)
  const versionString = process.env.NEXT_PUBLIC_BUILD_VERSION || "v.0.000000.0000 - Experimental"

  // Only show dialog on main page, not on terms/privacy pages
  const shouldShowDialog = pathname === "/"

  // Ensure dialog opens on every page load/refresh (only on main page)
  React.useEffect(() => {
    if (shouldShowDialog) {
      setIsAboutOpen(true)
      setHasAcknowledged(false)
    } else {
      setIsAboutOpen(false)
    }
  }, [shouldShowDialog])

  // Handle dialog open change - only allow opening, prevent closing via outside click or ESC
  const handleOpenChange = React.useCallback((open: boolean) => {
    // Only allow opening, ignore attempts to close
    if (open) {
      setIsAboutOpen(true)
    }
    // If open is false, do nothing - this prevents closing via outside click or ESC
  }, [])

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <a
              href="https://helvety.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3"
              aria-label="Visit Helvety.com"
            >
              <Image
                src="/helvety_logo_white.svg"
                alt="Helvety"
                width={120}
                height={30}
                className="h-8 w-auto hidden sm:block"
                priority
              />
              <Image
                src="/helvety_Identifier_whiteBg.svg"
                alt="Helvety"
                width={30}
                height={30}
                className="h-8 w-auto sm:hidden"
                priority
              />
            </a>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-black tracking-tight hover:opacity-80 transition-opacity">
                PDF
              </Link>
              <Separator orientation="vertical" className="h-4 hidden sm:block" />
              <span className="text-xs font-normal text-muted-foreground/60 hidden sm:inline">
                {versionString}
              </span>
            </div>
          </div>
          <TooltipProvider>
            <div className="flex items-center space-x-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setIsAboutOpen(true)}
                    aria-label="About"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>About</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="https://github.com/CasparRubin/helvety-pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View source code on GitHub"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                    >
                      <Github className="h-4 w-4" />
                    </Button>
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View source code on GitHub</p>
                </TooltipContent>
              </Tooltip>
              <ThemeSwitcher />
            </div>
          </TooltipProvider>
        </div>
      </nav>

      <Dialog open={isAboutOpen && shouldShowDialog} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-xl max-h-[70vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader>
            <DialogTitle>About</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="text-sm text-muted-foreground">
              <ul className="list-disc pl-5 space-y-1">
                <li>All processing happens in your browser</li>
                <li>Performance depends on your device</li>
                <li>Large datasets or filesizes might crash the app</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3 pt-3 border-t">
              <div className="flex items-center gap-3 text-sm">
                <Link
                  href="/terms"
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link
                  href="/privacy"
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </Link>
                <span className="text-muted-foreground">•</span>
                <a
                  href="https://github.com/CasparRubin/helvety-pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  GitHub
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="acknowledge-terms"
                  checked={hasAcknowledged}
                  onCheckedChange={(checked) => setHasAcknowledged(checked === true)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="acknowledge-terms"
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  I have read and understood the Terms and Privacy Policy
                </Label>
              </div>
              <div className="flex justify-end">
                <Button 
                  variant="default"
                  onClick={() => setIsAboutOpen(false)}
                  disabled={!hasAcknowledged}
                >
                  Access App
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

