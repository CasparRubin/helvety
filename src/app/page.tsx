"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Home() {
  const [animationKey, setAnimationKey] = useState(0);
  const [isFirefox, setIsFirefox] = useState(false);

  useEffect(() => {
    // Detect Firefox
    const userAgent = navigator.userAgent.toLowerCase();
    setIsFirefox(userAgent.indexOf("firefox") > -1);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey((prev) => prev + 1);
    }, 20000); // 20 seconds

    return () => clearInterval(interval);
  }, []);

  // Determine which side we're on (0: top, 1: right, 2: bottom, 3: left)
  const side = animationKey % 4;

  // Get animation props based on side
  const getProgressBarProps = () => {
    switch (side) {
      case 0: // Top: left to right
        return {
          className: "fixed top-0 left-0 right-0 h-0.5 bg-transparent z-50 overflow-hidden",
          barClassName: "h-full w-full bg-[#FF0000] absolute left-0 origin-left",
          initial: { scaleX: 0 },
          animate: { scaleX: 1 },
        };
      case 1: // Right: top to bottom
        return {
          className: "fixed top-0 right-0 bottom-0 w-0.5 bg-transparent z-50 overflow-hidden",
          barClassName: "w-full h-full bg-[#FF0000] absolute top-0 origin-top",
          initial: { scaleY: 0 },
          animate: { scaleY: 1 },
        };
      case 2: // Bottom: right to left
        return {
          className: "fixed bottom-0 left-0 right-0 h-0.5 bg-transparent z-50 overflow-hidden",
          barClassName: "h-full w-full bg-[#FF0000] absolute right-0 origin-right",
          initial: { scaleX: 0 },
          animate: { scaleX: 1 },
        };
      case 3: // Left: bottom to top
        return {
          className: "fixed top-0 left-0 bottom-0 w-0.5 bg-transparent z-50 overflow-hidden",
          barClassName: "w-full h-full bg-[#FF0000] absolute bottom-0 origin-bottom",
          initial: { scaleY: 0 },
          animate: { scaleY: 1 },
        };
      default:
        return {
          className: "fixed top-0 left-0 right-0 h-0.5 bg-transparent z-50 overflow-hidden",
          barClassName: "h-full w-full bg-[#FF0000] absolute left-0 origin-left",
          initial: { scaleX: 0 },
          animate: { scaleX: 1 },
        };
    }
  };

  const progressBarProps = getProgressBarProps();

  return (
    <main className="min-h-screen">
      {/* Progress Bar */}
      <div className={progressBarProps.className}>
        <motion.div
          className={progressBarProps.barClassName}
          initial={progressBarProps.initial}
          animate={progressBarProps.animate}
          transition={{ duration: 20, ease: "linear" }}
          key={animationKey}
          style={{ 
            willChange: "transform",
            backfaceVisibility: "hidden",
            transform: "translateZ(0)"
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 text-center">
          <motion.div
            key={`logo-${animationKey}`}
            initial={isFirefox ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            animate={isFirefox ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            transition={isFirefox ? { 
              duration: 0.6, 
              ease: "easeOut" 
            } : { 
              duration: 0.8, 
              ease: "easeOut"
            }}
            className="logo-glow-wrapper flex justify-center"
          >
            <Image
              src="/logo_whiteBg.svg"
              alt="Helvety logo"
              width={1200}
              height={300}
              className="mx-auto h-auto w-[90vw] max-w-6xl"
              sizes="(max-width: 768px) 95vw, (max-width: 1280px) 90vw, 1400px"
              priority
              fetchPriority="high"
            />
          </motion.div>

          <motion.div
            key={`content-${animationKey}`}
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="flex w-full flex-col items-center gap-8"
          >
            <motion.div variants={fadeInUp}>
              <p className="text-lg md:text-xl text-muted-foreground">
                Made in{" "}
                <span className="text-[#FF0000] font-medium">Switzerland</span>
              </p>
            </motion.div>
            
            <motion.div variants={fadeInUp}>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-border/50 hover:bg-accent/50"
              >
                <a href="mailto:contact@helvety.com">contact@helvety.com</a>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-background/80" />
      </section>

      {/* Legal Notice Link */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center">
        <Link 
          href="/legal-notice"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Legal Notice
        </Link>
      </div>
    </main>
  );
}
