'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  Check,
  X,
  AlertCircle,
  Loader,
  Download,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { updateReservationStatusWithNotification } from '@/lib/server-actions/reservation-actions';

interface Reservation {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  people?: number;
  partySize?: number;
  message?: string;
  notes?: string;
  bereich?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt?: Timestamp | Date;
  rejectionReason?: string;
}

type Tab = 'pending' | 'completed';

export default function LiveReservationsPage() {
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([]);
  const [completedReservations, setCompletedReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPopupNotification, setShowPopupNotification] = useState(false);
  const [popupReservation, setPopupReservation] = useState<Reservation | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousPendingCountRef = useRef<number>(0);

  // PWA Install prompt handler
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setInstallPrompt(null);
  };

  // Clear selected reservation when tab changes
  useEffect(() => {
    setSelectedReservation(null);
  }, [activeTab]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playNote = (
        frequency: number,
        duration: number,
        startTime: number,
        volume: number = 0.2
      ) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime + startTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + startTime + duration - 0.05
        );
        
        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(audioContext.currentTime + startTime + duration);
      };
      
      const now = audioContext.currentTime;
      const noteDuration = 0.2;
      
      playNote(523, noteDuration, 0, 0.25);
      playNote(659, noteDuration, noteDuration + 0.05, 0.25);
      playNote(784, noteDuration * 1.5, noteDuration * 2 + 0.1, 0.3);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  // Initialize real-time listener
  useEffect(() => {
    const startListening = async () => {
      try {
        const q = query(
          collection(db, 'reservations'),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const pending: Reservation[] = [];
          const completed: Reservation[] = [];

          snapshot.docs.forEach((doc) => {
            const data = doc.data() as Reservation;
            const reservation: Reservation = {
              ...data,
              id: doc.id,
            };

            if (data.status === 'pending') {
              pending.push(reservation);
            } else {
              completed.push(reservation);
            }
          });

          // Check if we have a new pending reservation
          if (pending.length > previousPendingCountRef.current) {
            const newReservation = pending[0];
            if (newReservation) {
              setPopupReservation(newReservation);
              setShowPopupNotification(true);
              playNotificationSound();
              
              if (popupTimeoutRef.current) {
                clearTimeout(popupTimeoutRef.current);
              }
              
              popupTimeoutRef.current = setTimeout(() => {
                setShowPopupNotification(false);
              }, 8000);
            }
          }

          previousPendingCountRef.current = pending.length;
          setPendingReservations(pending);
          setCompletedReservations(completed);
        });

        unsubscribeRef.current = unsubscribe;
      } catch (error) {
        console.error('Error setting up listener:', error);
      }
    };

    startListening();

    return () => {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Handle accept reservation
  const handleAccept = async () => {
    if (!selectedReservation) return;

    setIsProcessing(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('Benutzer nicht authentifiziert');
        return;
      }

      const idToken = await currentUser.getIdToken();
      
      if (!idToken) {
        toast.error('Authentifizierungstoken konnte nicht abgerufen werden');
        return;
      }

      const result = await updateReservationStatusWithNotification(
        selectedReservation.id,
        'confirmed',
        undefined,
        idToken
      );

      if (!result.success) {
        toast.error(result.error || 'Fehler beim Aktualisieren');
        return;
      }

      // Send acceptance email
      try {
        await fetch('/api/email/send-acceptance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            to: selectedReservation.email,
            firstName: selectedReservation.firstName || 'Gast',
            date: selectedReservation.date,
            time: selectedReservation.time,
            people: selectedReservation.people || 1,
            bereich: selectedReservation.bereich || 'Innenbereich',
            phone: selectedReservation.phone,
            notes: selectedReservation.message || '',
            reservationId: selectedReservation.id,
          }),
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      toast.success('Reservierung akzeptiert');
      setSelectedReservation(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Fehler beim Verarbeiten');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle decline reservation
  const handleDecline = async () => {
    if (!selectedReservation || !declineReason.trim()) {
      toast.error('Bitte geben Sie einen Grund an');
      return;
    }

    setIsProcessing(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('Benutzer nicht authentifiziert');
        return;
      }

      const idToken = await currentUser.getIdToken();
      
      if (!idToken) {
        toast.error('Authentifizierungstoken konnte nicht abgerufen werden');
        return;
      }

      const result = await updateReservationStatusWithNotification(
        selectedReservation.id,
        'rejected',
        declineReason,
        idToken
      );

      if (!result.success) {
        toast.error(result.error || 'Fehler beim Aktualisieren');
        return;
      }

      // Send decline email
      try {
        await fetch('/api/email/send-decline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            to: selectedReservation.email,
            firstName: selectedReservation.firstName || 'Gast',
            reason: declineReason,
            date: selectedReservation.date,
            time: selectedReservation.time,
            people: selectedReservation.people || 1,
            area: selectedReservation.bereich || 'Innenbereich',
            reservationId: selectedReservation.id,
          }),
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      toast.success('Reservierung abgelehnt');
      setSelectedReservation(null);
      setShowDeclineModal(false);
      setDeclineReason('');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Fehler beim Verarbeiten');
    } finally {
      setIsProcessing(false);
    }
  };

  // Hide sidebar and header when viewing reservation details
  useEffect(() => {
    if (selectedReservation) {
      const sidebar = document.querySelector('aside');
      const header = document.querySelector('header');
      const mainContent = document.querySelector('[class*="md:ml-"]');
      
      if (sidebar) sidebar.style.display = 'none';
      if (header) header.style.display = 'none';
      if (mainContent) (mainContent as HTMLElement).style.marginLeft = '0';
      
      document.documentElement.style.overflow = 'hidden';
    } else {
      const sidebar = document.querySelector('aside');
      const header = document.querySelector('header');
      const mainContent = document.querySelector('[class*="md:ml-"]');
      
      if (sidebar) sidebar.style.display = '';
      if (header) header.style.display = '';
      if (mainContent) (mainContent as HTMLElement).style.marginLeft = '';
      
      document.documentElement.style.overflow = '';
    }

    return () => {
      const sidebar = document.querySelector('aside');
      const header = document.querySelector('header');
      
      if (sidebar) sidebar.style.display = '';
      if (header) header.style.display = '';
      document.documentElement.style.overflow = '';
    };
  }, [selectedReservation]);

  const currentReservations =
    activeTab === 'pending' ? pendingReservations : completedReservations;

  // Fullscreen detail view
  if (selectedReservation) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto">
        {/* Header with back button */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-800 text-white px-4 sm:px-6 py-4 shadow-lg z-10">
          <div className="flex items-center justify-between gap-4">
            <motion.button
              onClick={() => setSelectedReservation(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <h1 className="text-xl sm:text-2xl font-bold flex-1">Reservierungsdetails</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-32">
          {/* Guest Name - Large Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 pt-4"
          >
            <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Gast
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900">
              {selectedReservation.firstName} {selectedReservation.lastName}
            </h2>
          </motion.div>

          {/* Key Details Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8"
          >
            <Card className="p-4 sm:p-6 bg-blue-50 border-2 border-blue-200">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Datum</p>
              <p className="text-xl sm:text-2xl font-black text-blue-900">{selectedReservation.date}</p>
            </Card>

            <Card className="p-4 sm:p-6 bg-purple-50 border-2 border-purple-200">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Uhrzeit</p>
              <p className="text-xl sm:text-2xl font-black text-purple-900">{selectedReservation.time}</p>
            </Card>

            <Card className="p-4 sm:p-6 bg-orange-50 border-2 border-orange-200">
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Gäste</p>
              <p className="text-xl sm:text-2xl font-black text-orange-900">{selectedReservation.people || 1}</p>
            </Card>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">Kontakt</h3>
            <div className="space-y-3">
              <Card className="p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300">
                <div className="flex items-center gap-4">
                  <Mail className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 mb-1">E-Mail</p>
                    <p className="text-sm sm:text-base font-semibold text-slate-900 break-all">
                      {selectedReservation.email}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 sm:p-6 border-2 border-slate-200 hover:border-slate-300">
                <div className="flex items-center gap-4">
                  <Phone className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Telefon</p>
                    <p className="text-sm sm:text-base font-semibold text-slate-900">
                      {selectedReservation.phone}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>

          {/* Area */}
          {selectedReservation.bereich && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <Card className="p-4 sm:p-6 bg-indigo-50 border-2 border-indigo-200">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">
                  Reservierungsbereich
                </p>
                <p className="text-xl sm:text-2xl font-black text-indigo-900">
                  {selectedReservation.bereich}
                </p>
              </Card>
            </motion.div>
          )}

          {/* Notes */}
          {selectedReservation.message && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <Card className="p-4 sm:p-6 bg-amber-50 border-2 border-amber-200">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">
                  Kundennoten
                </p>
                <p className="text-sm sm:text-base text-amber-900 leading-relaxed">
                  {selectedReservation.message}
                </p>
              </Card>
            </motion.div>
          )}

          {/* Rejection Reason */}
          {selectedReservation.rejectionReason && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <Card className="p-4 sm:p-6 bg-red-50 border-2 border-red-200">
                <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3">
                  Ablehnungsgrund
                </p>
                <p className="text-sm sm:text-base text-red-900 leading-relaxed">
                  {selectedReservation.rejectionReason}
                </p>
              </Card>
            </motion.div>
          )}

          {/* Action Buttons - Only for pending */}
          {activeTab === 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 p-4 sm:p-6 shadow-xl"
            >
              <div className="max-w-4xl mx-auto grid grid-cols-2 gap-3 sm:gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAccept}
                  disabled={isProcessing}
                  className="px-6 py-4 sm:py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-3 text-lg shadow-lg transition-all"
                >
                  <Check className="w-6 h-6 sm:w-7 sm:h-7" />
                  <span className="hidden sm:inline">Akzeptieren</span>
                  <span className="sm:hidden">OK</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeclineModal(true)}
                  disabled={isProcessing}
                  className="px-6 py-4 sm:py-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-3 text-lg shadow-lg transition-all"
                >
                  <X className="w-6 h-6 sm:w-7 sm:h-7" />
                  <span className="hidden sm:inline">Ablehnen</span>
                  <span className="sm:hidden">Nein</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Status for completed */}
          {activeTab === 'completed' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 p-4 sm:p-6 shadow-xl"
            >
              <div className="max-w-4xl mx-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedReservation(null)}
                  className="w-full px-6 py-4 sm:py-6 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-bold rounded-xl text-lg shadow-lg transition-all"
                >
                  <ArrowLeft className="w-6 h-6 inline mr-3" />
                  Zurück zur Liste
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Decline Modal */}
        <AnimatePresence>
          {showDeclineModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4"
              onClick={() => !isProcessing && setShowDeclineModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white p-6 rounded-lg border border-slate-200 max-w-md w-full shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Ablehnungsgrund
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Bitte geben Sie einen Grund an, um dem Kunden per E-Mail zu informieren.
                </p>
                <Textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Z.B. Keine Tische zum gewünschten Zeitpunkt verfügbar..."
                  className="mb-6 bg-slate-50 border-slate-200 text-slate-900 resize-none"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowDeclineModal(false)}
                    disabled={isProcessing}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-medium"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleDecline}
                    disabled={isProcessing || !declineReason.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium"
                  >
                    {isProcessing ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Verarbeitet...
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Ablehnen
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Main list view
  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded"></div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Live Reservierungen</h1>
        </div>

        {/* Status indicator + Install button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs sm:text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium text-slate-600">LIVE</span>
          </div>
          
          {installPrompt && (
            <Button
              onClick={handleInstallApp}
              className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 text-xs sm:text-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">App installieren</span>
              <span className="sm:hidden">App</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-lg p-1 border border-slate-200 w-full sm:w-fit shadow-sm overflow-x-auto">
        {(['pending', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-md font-medium transition-all text-xs sm:text-sm min-h-11 touch-target ${
              activeTab === tab
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab === 'pending' ? 'Ausstehend' : 'Abgeschlossen'}
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
              activeTab === tab 
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}>
              {tab === 'pending' ? pendingReservations.length : completedReservations.length}
            </span>
          </button>
        ))}
      </div>

      {/* Reservations List - Desktop and Mobile */}
      <div className="space-y-3 sm:space-y-4 flex-1">
        <AnimatePresence mode="popLayout">
          {currentReservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-xs sm:text-sm text-center px-4">
                {activeTab === 'pending'
                  ? 'Keine ausstehenden Reservierungen'
                  : 'Keine abgeschlossenen Reservierungen'}
              </p>
            </div>
          ) : (
            currentReservations.map((reservation, index) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layoutId={reservation.id}
              >
                <Card
                  onClick={() => setSelectedReservation(reservation)}
                  className="p-4 sm:p-6 cursor-pointer transition-all border-2 border-slate-200 hover:border-slate-300 hover:shadow-md bg-white"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Guest Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-white">
                            {(reservation.firstName || 'G')[0]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                            {reservation.firstName || 'Gast'} {reservation.lastName || ''}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {reservation.people || 1} {reservation.people === 1 ? 'Person' : 'Personen'}
                          </p>
                        </div>
                      </div>

                      {/* DateTime */}
                      <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          {reservation.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          {reservation.time}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        reservation.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : reservation.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {reservation.status === 'confirmed'
                          ? 'Bestätigt'
                          : reservation.status === 'rejected'
                          ? 'Abgelehnt'
                          : 'Ausstehend'}
                      </span>
                      <ChevronDown className="w-5 h-5 text-slate-400 hidden sm:block" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Popup Notification */}
      <AnimatePresence>
        {showPopupNotification && popupReservation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowPopupNotification(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: -100, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: -100, opacity: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 100 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border-t-4 border-green-500"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 px-6 sm:px-8 py-6 sm:py-8">
                <div className="flex items-center gap-4 mb-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="w-4 h-4 bg-white rounded-full"
                  ></motion.div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white">Neue Reservierung!</h1>
                </div>
                <p className="text-green-100 text-xs sm:text-sm font-medium ml-8">Gerade eingegangen</p>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="border-b-2 border-gray-200 pb-6">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Reservierung von
                  </p>
                  <p className="text-4xl sm:text-5xl font-black text-gray-900">
                    {popupReservation.firstName}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-700">
                    {popupReservation.lastName}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-blue-50 px-4 sm:px-6 py-4 sm:py-5 rounded-xl border-2 border-blue-200">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                      Datum
                    </p>
                    <p className="text-lg sm:text-2xl font-black text-blue-900">{popupReservation.date}</p>
                  </div>

                  <div className="bg-purple-50 px-4 sm:px-6 py-4 sm:py-5 rounded-xl border-2 border-purple-200">
                    <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">
                      Uhrzeit
                    </p>
                    <p className="text-lg sm:text-2xl font-black text-purple-900">{popupReservation.time}</p>
                  </div>

                  <div className="bg-orange-50 px-4 sm:px-6 py-4 sm:py-5 rounded-xl border-2 border-orange-200">
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">
                      Personen
                    </p>
                    <p className="text-lg sm:text-2xl font-black text-orange-900">{popupReservation.people || 1}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border-2 border-slate-200 space-y-4">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Kontaktinformation
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200">
                      <Mail className="w-6 h-6 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 mb-1">E-Mail</p>
                        <p className="text-sm sm:text-lg font-semibold text-slate-900 break-all">
                          {popupReservation.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200">
                      <Phone className="w-6 h-6 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Telefon</p>
                        <p className="text-sm sm:text-lg font-semibold text-slate-900">{popupReservation.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {popupReservation.bereich && (
                  <div className="bg-indigo-50 p-4 sm:p-6 rounded-xl border-2 border-indigo-200">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">
                      Reservierungsbereich
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-indigo-900">
                      {popupReservation.bereich}
                    </p>
                  </div>
                )}

                {popupReservation.message && (
                  <div className="bg-amber-50 p-4 sm:p-6 rounded-xl border-2 border-amber-200">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">
                      Kundennoten
                    </p>
                    <p className="text-sm sm:text-lg text-amber-900 leading-relaxed">
                      {popupReservation.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-50 px-6 sm:px-8 py-4 sm:py-6 border-t-2 border-gray-200 flex gap-3 sm:gap-4">
                <Button
                  onClick={() => {
                    setShowPopupNotification(false);
                    setSelectedReservation(popupReservation);
                    setActiveTab('pending');
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 sm:py-4 rounded-xl text-base sm:text-lg"
                >
                  <Check className="w-5 h-5 mr-2 inline" />
                  Anschauen
                </Button>
                <Button
                  onClick={() => setShowPopupNotification(false)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 sm:py-4 rounded-xl text-base sm:text-lg"
                >
                  <X className="w-5 h-5 mr-2 inline" />
                  Schließen
                </Button>
              </div>

              {/* Auto-close Progress Bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 8, ease: 'linear' }}
                className="h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 origin-left"
              ></motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
