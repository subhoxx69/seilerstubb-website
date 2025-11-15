'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { getCurrentAnnouncement, type CurrentAnnouncement } from '@/lib/firebase/announcement-service';

interface WelcomePopupProps {
  onClose?: () => void;
}

export default function WelcomePopup({ onClose }: WelcomePopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<CurrentAnnouncement | null>(null);
  const pathname = usePathname();
  const { user, firebaseUser } = useAuth();

  useEffect(() => {
    const loadAnnouncement = async () => {
      // Only show on homepage
      const isHomepage = pathname === '/' || pathname === '/home' || pathname === '';
      if (!isHomepage) {
        return;
      }

      try {
        const data = await getCurrentAnnouncement();
        if (!data || !data.active) {
          return;
        }

        // Check if user has seen this version
        let hasSeen = false;

        // If user is logged in, check user prefs first, then localStorage
        if (firebaseUser?.uid) {
          const userPref = localStorage.getItem(`announcement_${firebaseUser.uid}`);
          if (userPref === data.version) {
            hasSeen = true;
          }
        } else {
          // Not logged in: check localStorage
          const seenVersion = localStorage.getItem('announcementVersionSeen');
          if (seenVersion === data.version) {
            hasSeen = true;
          }
        }

        if (!hasSeen) {
          setAnnouncement(data);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error loading announcement:', error);
      }
    };

    loadAnnouncement();
  }, [pathname, firebaseUser?.uid]);

  const handleClose = async () => {
    if (announcement) {
      // Store in localStorage
      localStorage.setItem('announcementVersionSeen', announcement.version);

      // If logged in, also store in user prefs
      if (firebaseUser?.uid) {
        localStorage.setItem(`announcement_${firebaseUser.uid}`, announcement.version);
      }
    }

    setIsOpen(false);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] top-0"
          />

          {/* Popup - Clean Minimal Design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full px-4"
            style={{ maxWidth: '420px' }}
          >
            {/* Main Card */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header with Close Button */}
              <div className="flex items-start justify-between p-6 pb-4">
                <div className="flex items-center gap-3">
                  <motion.span
                    initial={{ rotate: -20, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                    className="text-4xl"
                  >
                    📢
                  </motion.span>
                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-2xl font-bold text-gray-900"
                  >
                    {announcement?.title || 'Wichtige Information'}
                  </motion.h2>
                </div>
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={handleClose}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-400 hover:text-gray-600"
                  aria-label="Close popup"
                >
                  <X size={24} strokeWidth={2} />
                </motion.button>
              </div>

              {/* Content with Orange Left Border */}
              <div className="px-6 py-5 space-y-4 border-l-4 border-orange-500">
                {/* Main Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="space-y-3"
                >
                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {announcement?.message || 'Momentan ist keine Lieferung möglich.'}
                  </div>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-5 bg-white space-y-3 flex flex-col">
                {/* Primary Button - Pill Style */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  onClick={handleClose}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>✓</span>
                  <span>Verstanden</span>
                </motion.button>

                {/* Secondary Button - Don't Show Again */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={handleClose}
                  className="w-full border-2 border-orange-500 text-orange-600 font-bold py-2.5 px-6 rounded-full transition-all duration-200 hover:bg-orange-50 flex items-center justify-center gap-2 text-sm"
                >
                  <span>🔇</span>
                  <span>Nicht mehr anzeigen</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
