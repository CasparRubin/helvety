"use client"

// React
import * as React from "react"

// Next.js
import Image from "next/image"
import Link from "next/link"

// External libraries
import { Github, Info, FileText, Scale, Building2 } from "lucide-react"

// Internal components
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

export function Navbar(): React.JSX.Element {
  const [isAboutOpen, setIsAboutOpen] = React.useState(false)
  const versionString = process.env.NEXT_PUBLIC_BUILD_VERSION ?? "v.0.000000.0000 - Experimental"

  // Handle dialog open change - allow normal opening and closing
  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsAboutOpen(open)
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
                    href="https://helvety.com/legal-notice"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Legal Notice (Impressum)"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                    >
                      <Building2 className="h-4 w-4" />
                    </Button>
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Legal Notice</p>
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

      <Dialog open={isAboutOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>About</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {/* How It Works */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">How It Works</h3>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>All processing happens in your browser</li>
                <li>Performance depends on your device</li>
                <li>Large datasets or filesizes might crash the app</li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Legal</h3>
              <div className="space-y-2">
                <Link
                  href="/terms"
                  onClick={() => setIsAboutOpen(false)}
                  className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-muted/50 transition-colors"
                >
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Terms of Service</p>
                    <p className="text-xs text-muted-foreground">Usage terms, disclaimers, and limitations</p>
                  </div>
                </Link>
                <Link
                  href="/privacy"
                  onClick={() => setIsAboutOpen(false)}
                  className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-muted/50 transition-colors"
                >
                  <Scale className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Privacy Policy</p>
                    <p className="text-xs text-muted-foreground">How your data is handled and protected</p>
                  </div>
                </Link>
                <a
                  href="https://helvety.com/legal-notice"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsAboutOpen(false)}
                  className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-muted/50 transition-colors"
                >
                  <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Legal Notice</p>
                    <p className="text-xs text-muted-foreground">Company information and contact details</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <Button 
                variant="default"
                onClick={() => setIsAboutOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

