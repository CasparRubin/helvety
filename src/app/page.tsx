"use client";

import Image from "next/image";
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
          barClassName: "h-full bg-[#FF0000] absolute left-0",
          initial: { width: "0%" },
          animate: { width: "100%" },
        };
      case 1: // Right: top to bottom
        return {
          className: "fixed top-0 right-0 bottom-0 w-0.5 bg-transparent z-50 overflow-hidden",
          barClassName: "w-full bg-[#FF0000] absolute top-0",
          initial: { height: "0%" },
          animate: { height: "100%" },
        };
      case 2: // Bottom: right to left
        return {
          className: "fixed bottom-0 left-0 right-0 h-0.5 bg-transparent z-50 overflow-hidden",
          barClassName: "h-full bg-[#FF0000] absolute right-0",
          initial: { width: "0%" },
          animate: { width: "100%" },
        };
      case 3: // Left: bottom to top
        return {
          className: "fixed top-0 left-0 bottom-0 w-0.5 bg-transparent z-50 overflow-hidden",
          barClassName: "w-full bg-[#FF0000] absolute bottom-0",
          initial: { height: "0%" },
          animate: { height: "100%" },
        };
      default:
        return {
          className: "fixed top-0 left-0 right-0 h-0.5 bg-transparent z-50 overflow-hidden",
          barClassName: "h-full bg-[#FF0000] absolute left-0",
          initial: { width: "0%" },
          animate: { width: "100%" },
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
        />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-20">
        <div className="w-full text-center">
          <motion.div
            key={`logo-${animationKey}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12 logo-glow-wrapper"
          >
            <Image
              src="/logo_whiteBg.svg"
              alt="Helvety logo"
              width={1200}
              height={300}
              className="mx-auto mb-12 h-auto w-[90vw] max-w-6xl"
              sizes="(max-width: 768px) 95vw, (max-width: 1280px) 90vw, 1400px"
              priority
              fetchPriority="high"
            />
          </motion.div>
          
          <div className="max-w-6xl mx-auto w-full">
            <motion.div
              key={`content-${animationKey}`}
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-6"
            >
            <motion.div variants={fadeInUp}>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-light tracking-tight mb-4">
                Software and Apparel
              </h1>
            </motion.div>
            
            <motion.div variants={fadeInUp}>
              <p className="text-lg md:text-xl text-muted-foreground">
                Made in{" "}
                <span className="text-[#FF0000] font-medium">Switzerland</span>
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="pt-8">
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
        </div>

        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-background/80" />
      </section>

    </main>
  );
}
