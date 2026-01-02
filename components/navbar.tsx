"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Github, Info } from "lucide-react"

import { ThemeSwitcher } from "@/components/theme-switcher"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
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

export function Navbar() {
  const [isAboutOpen, setIsAboutOpen] = React.useState(false)
  const versionString = process.env.NEXT_PUBLIC_BUILD_VERSION || "v.0.000000.0000 - Experimental"

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
            <div className="flex items-center gap-2">
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

      <Dialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>About</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-6">
            <div>
              <h3 className="text-base font-medium mb-2">Client-Side Processing</h3>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p>
                  All file processing (PDFs and images) happens entirely in your browser. No data is sent to any server. This means your files stay completely private, but performance depends on your device's capabilities.
                </p>
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-base font-medium mb-2">Performance</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Large files or many pages may take longer to process, especially on older devices.</p>
                <p>Processing time increases with file size and number of pages.</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-base font-medium mb-2">Terms, Privacy and Responsibility</h3>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p>
                  By using this tool, you confirm that you have the legal right to process the files you upload and that you comply with all applicable laws. The developer is not responsible for any misuse of the application.
                </p>
                <p>
                  We do not collect, store, transmit, or analyze any files or user data.
                </p>
                <p>
                  This is an open-source application developed and maintained by{" "}
                  <a
                    href="https://helvety.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Helvety
                  </a>
                  , a Swiss company committed to transparency and respect for user privacy and data protection. Anyone can verify our privacy and security claims by reviewing the{" "}
                  <a
                    href="https://github.com/CasparRubin/helvety-pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    publicly available code
                  </a>
                  .
                </p>
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-base font-medium mb-2">Simplicity by Design</h3>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p>
                  This app is intentionally simple. No accounts. No logins. No ads. No tracking. No unnecessary features. Just a fast and straightforward tool that does one thing well and stays out of your way.
                </p>
              </div>
            </div>
            <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <a
                href="mailto:contact@helvety.com"
                className="text-primary hover:underline transition-colors"
              >
                contact@helvety.com
              </a>
              <span className="hidden sm:inline">•</span>
              <a
                href="https://helvety.com/legal-notice"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline transition-colors"
              >
                Legal Notice
              </a>
            </div>
            <div className="flex justify-end pt-4">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

