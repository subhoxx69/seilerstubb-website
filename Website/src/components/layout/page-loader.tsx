'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const PRIMARY_COLOR = '#da671f';

export default function PageLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Start loading when pathname changes
    setIsLoading(true);

    // Simulate page load completion
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-white/95 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="flex flex-col items-center justify-center gap-6">
            {/* Animated Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-4xl font-bold tracking-tight"
              style={{ color: PRIMARY_COLOR }}
            >
              Seilerstubb
            </motion.div>

            {/* Animated Loading Bars */}
            <div className="flex items-center justify-center gap-1.5">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  initial={{ height: 8 }}
                  animate={{ height: [8, 24, 8] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: index * 0.15,
                    ease: 'easeInOut',
                  }}
                  className="w-1.5 rounded-full"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                />
              ))}
            </div>

            {/* Loading Text */}
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-sm font-medium text-slate-600"
            >
              Loading...
            </motion.p>
          </div>

          {/* Animated Background Gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 bg-gradient-to-r from-orange-400/10 via-transparent to-orange-400/10"
            style={{ pointerEvents: 'none' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
