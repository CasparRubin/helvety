"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import "./page.css";

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

/**
 * Home page component displaying the Helvety hero section with animated logo.
 * Includes Firefox-specific animation handling for compatibility.
 */
export default function Home() {
  const [isFirefox, setIsFirefox] = useState(false);

  useEffect(() => {
    // Detect Firefox - client-only detection
    const userAgent = navigator.userAgent.toLowerCase();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: browser detection on mount
    setIsFirefox(userAgent.indexOf("firefox") > -1);
  }, []);

  return (
    <main>
      {/* Hero Section */}
      <section className="relative flex flex-col items-center px-6 pt-24 md:pt-40 lg:pt-48">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 text-center">
          <motion.div
            initial={isFirefox ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            animate={isFirefox ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            transition={
              isFirefox
                ? {
                    duration: 0.6,
                    ease: "easeOut",
                  }
                : {
                    duration: 0.8,
                    ease: "easeOut",
                  }
            }
            className="logo-glow-wrapper flex justify-center"
          >
            <Image
              src="/helvety_logo_white.svg"
              alt="Helvety logo"
              width={1200}
              height={300}
              className="mx-auto h-auto w-[90vw] max-w-6xl"
              sizes="(max-width: 768px) 95vw, (max-width: 1280px) 90vw, 1400px"
              loading="eager"
              fetchPriority="high"
            />
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="flex w-full flex-col items-center gap-8"
          >
            <motion.div variants={fadeInUp}>
              <p className="text-muted-foreground text-sm md:text-base">
                Engineered & Designed in{" "}
                <span className="font-medium text-[#FF0000]">Switzerland</span>
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Gradient overlay for depth */}
        <div className="from-background via-background to-background/80 absolute inset-0 -z-10 bg-gradient-to-b" />
      </section>
    </main>
  );
}
