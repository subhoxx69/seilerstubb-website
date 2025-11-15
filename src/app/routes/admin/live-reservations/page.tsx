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
  Bell,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
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

interface TerminalLog {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
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
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [showPopupNotification, setShowPopupNotification] = useState(false);
  const [popupReservation, setPopupReservation] = useState<Reservation | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousPendingCountRef = useRef<number>(0);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // Clear selected reservation when tab changes
  useEffect(() => {
    setSelectedReservation(null);
  }, [activeTab]);

  // Add terminal log
  const addLog = (message: string, type: TerminalLog['type'] = 'info') => {
    const newLog: TerminalLog = {
      id: Math.random().toString(),
      timestamp: new Date(),
      message,
      type,
    };
    setTerminalLogs((prev) => [...prev, newLog]);
  };

  // Format timestamp
  const formatTime = (date: Date | Timestamp | undefined): string => {
    if (!date) return '';
    const d = date instanceof Timestamp ? date.toDate() : date;
    return d.toLocaleTimeString('de-DE');
  };

  // Play notification sound - improved musical notification
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant notification melody with multiple notes
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
      
      // Play a 3-note musical notification (like a bell chime)
      const now = audioContext.currentTime;
      const noteDuration = 0.2;
      
      // First note - C5 (523 Hz)
      playNote(523, noteDuration, 0, 0.25);
      
      // Second note - E5 (659 Hz) - higher pitch
      playNote(659, noteDuration, noteDuration + 0.05, 0.25);
      
      // Third note - G5 (784 Hz) - even higher
      playNote(784, noteDuration * 1.5, noteDuration * 2 + 0.1, 0.3);
      
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  // Initialize real-time listener
  useEffect(() => {
    const startListening = async () => {
      try {
        setIsListening(true);
        addLog('🔄 Starte Datenbanküberwachung...', 'info');

        // Query all reservations with any status (no index needed)
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
            const newReservation = pending[0]; // Most recent is first due to orderBy desc
            if (newReservation) {
              // Show popup notification
              setPopupReservation(newReservation);
              setShowPopupNotification(true);
              playNotificationSound();
              
              // Clear any existing timeout
              if (popupTimeoutRef.current) {
                clearTimeout(popupTimeoutRef.current);
              }
              
              // Auto-close popup after 8 seconds
              popupTimeoutRef.current = setTimeout(() => {
                setShowPopupNotification(false);
              }, 8000);

              addLog(
                `🔔 🆕 NEUE RESERVIERUNG von ${newReservation.firstName || 'Gast'} ${newReservation.lastName || ''}!`,
                'success'
              );
            }
          }

          previousPendingCountRef.current = pending.length;
          setPendingReservations(pending);
          setCompletedReservations(completed);

          // Check for pending reservations
          const newPending = pending.length;
          if (newPending > 0) {
            addLog(
              `✅ ${newPending} ausstehende Reservierung${newPending > 1 ? 'en' : ''} verfügbar`,
              'success'
            );
          }

          // Add generic polling log
          addLog(`🔍 Datenbank überprüft - ${formatTime(new Date())}`, 'info');
        });

        unsubscribeRef.current = unsubscribe;
        addLog('✅ Überwachung aktiv - Prüfe alle 1 Sekunde', 'success');
      } catch (error) {
        addLog(
          `❌ Fehler bei der Überwachung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
          'error'
        );
      }
    };

    startListening();

    // Polling interval for consistent updates
    const pollInterval = setInterval(() => {
      if (activeTab === 'pending' && pendingReservations.length === 0) {
        addLog('🔍 Datenbank überprüft - Keine neuen Reservierungen', 'info');
      }
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [activeTab]);

  // Handle new reservation popup notification
  useEffect(() => {
    if (selectedReservation) {
      playNotificationSound();
      addLog(
        `🔔 Neue Reservierung von ${selectedReservation.firstName || 'Gast'} erhalten!`,
        'success'
      );
    }
  }, [selectedReservation]);

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

      // Update status
      const result = await updateReservationStatusWithNotification(
        selectedReservation.id,
        'confirmed',
        undefined,
        idToken
      );

      if (!result.success) {
        toast.error(result.error || 'Fehler beim Aktualisieren');
        addLog(`❌ Fehler beim Akzeptieren: ${result.error}`, 'error');
        return;
      }

      // Send acceptance email
      try {
        const emailResponse = await fetch('/api/email/send-acceptance', {
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

        if (emailResponse.ok) {
          addLog(
            `✅ Reservierung von ${selectedReservation.firstName || 'Gast'} akzeptiert und Email versendet`,
            'success'
          );
        } else {
          const errorData = await emailResponse.json();
          console.error('Email send failed:', errorData);
          addLog(
            `⚠️ Reservierung akzeptiert, aber Email fehlgeschlagen: ${errorData.error}`,
            'warning'
          );
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
        addLog(
          `⚠️ Reservierung akzeptiert, aber Email konnte nicht gesendet werden`,
          'warning'
        );
      }

      toast.success('Reservierung akzeptiert');
      setSelectedReservation(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Fehler beim Verarbeiten');
      addLog(`❌ Fehler: ${error instanceof Error ? error.message : 'Unbekannt'}`, 'error');
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

      // Update status with decline reason
      const result = await updateReservationStatusWithNotification(
        selectedReservation.id,
        'rejected',
        declineReason,
        idToken
      );

      if (!result.success) {
        toast.error(result.error || 'Fehler beim Aktualisieren');
        addLog(`❌ Fehler beim Ablehnen: ${result.error}`, 'error');
        return;
      }

      // Send decline email
      try {
        const emailResponse = await fetch('/api/email/send-decline', {
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

        if (emailResponse.ok) {
          addLog(
            `✅ Reservierung von ${selectedReservation.firstName || 'Gast'} abgelehnt und Email versendet`,
            'warning'
          );
        } else {
          const errorData = await emailResponse.json();
          console.error('Email send failed:', errorData);
          addLog(
            `⚠️ Reservierung abgelehnt, aber Email fehlgeschlagen: ${errorData.error}`,
            'warning'
          );
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
        addLog(
          `⚠️ Reservierung abgelehnt, aber Email konnte nicht gesendet werden`,
          'warning'
        );
      }

      toast.success('Reservierung abgelehnt');
      setSelectedReservation(null);
      setShowDeclineModal(false);
      setDeclineReason('');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Fehler beim Verarbeiten');
      addLog(`❌ Fehler: ${error instanceof Error ? error.message : 'Unbekannt'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = async () => {
    const elem = document.documentElement;
    if (!isFullscreen) {
      try {
        // Hide sidebar
        const sidebar = document.querySelector('aside');
        if (sidebar) {
          sidebar.style.display = 'none';
        }
        // Adjust main content margin
        const mainContent = document.querySelector('div[class*="md:ml-"]');
        if (mainContent) {
          (mainContent as HTMLElement).style.marginLeft = '0';
        }
        
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
          setIsFullscreen(true);
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
          setIsFullscreen(true);
        }
      } catch (error) {
        console.error('Fullscreen error:', error);
      }
    } else {
      try {
        // Show sidebar
        const sidebar = document.querySelector('aside');
        if (sidebar) {
          sidebar.style.display = '';
        }
        // Reset main content margin
        const mainContent = document.querySelector('div[class*="md:ml-"]');
        if (mainContent) {
          (mainContent as HTMLElement).style.marginLeft = '';
        }
        
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else if ((document as any).webkitFullscreenElement) {
          await (document as any).webkitExitFullscreen?.();
        }
        setIsFullscreen(false);
      } catch (error) {
        console.error('Exit fullscreen error:', error);
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const currentReservations =
    activeTab === 'pending' ? pendingReservations : completedReservations;

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded"></div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Reservierungen</h1>
        </div>

        {/* Header right section */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Status indicator */}
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs sm:text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium text-slate-600">LIVE</span>
          </div>

          {/* Fullscreen button */}
          <Button
            onClick={handleFullscreen}
            className="px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg border border-slate-300 transition-colors flex items-center gap-2 text-xs sm:text-sm min-h-10 sm:min-h-11 touch-target"
          >
            {isFullscreen ? (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V5m0 0H5m4 0l-4 4m15 0v4m0 0h4m-4 0l4-4M9 15l-4 4m0 0h4m-4 0v4" />
                </svg>
                <span className="hidden sm:inline">Vollbild beenden</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
                </svg>
                <span className="hidden sm:inline">Vollbild</span>
              </>
            )}
          </Button>
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

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 flex-1">
        {/* Reservations list */}
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto pr-2">
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
                      className={`p-3 sm:p-4 cursor-pointer transition-all border touch-target min-h-16 sm:min-h-20 ${
                        selectedReservation?.id === reservation.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row items-start sm:items-baseline gap-1 sm:gap-2">
                            <h3 className="font-semibold text-slate-900 truncate text-sm sm:text-base">
                              {reservation.firstName || 'Gast'} {reservation.lastName || ''}
                            </h3>
                            <span className="text-xs text-slate-500 flex-shrink-0">
                              {reservation.people || 1} {reservation.people === 1 ? 'Person' : 'Personen'}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-2 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              {reservation.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              {reservation.time}
                            </span>
                          </div>
                        </div>
                        {activeTab === 'pending' && (
                          <div className="flex gap-2 flex-shrink-0 opacity-40 group-hover:opacity-100">
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                            <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedReservation ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="p-4 sm:p-6 bg-white border-slate-200 h-full flex flex-col shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 sm:mb-6 pb-4 border-b border-slate-200">
                    Reservierungsdetails
                  </h3>

                  <div className="space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Gast</p>
                        <p className="text-slate-900 font-medium text-sm sm:text-base">
                          {selectedReservation.firstName || 'Gast'} {selectedReservation.lastName || ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Telefon</p>
                        <p className="text-slate-900 font-medium text-sm sm:text-base">{selectedReservation.phone}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</p>
                      <p className="text-blue-600 text-xs sm:text-sm break-all font-medium">{selectedReservation.email}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Datum</p>
                        <p className="text-slate-900 font-medium text-xs sm:text-sm">{selectedReservation.date}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Uhrzeit</p>
                        <p className="text-slate-900 font-medium text-xs sm:text-sm">{selectedReservation.time}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Personen</p>
                        <p className="text-slate-900 font-medium text-xs sm:text-sm">{selectedReservation.people || 1}</p>
                      </div>
                    </div>

                    {selectedReservation.bereich && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Bereich</p>
                        <p className="text-slate-900 font-medium text-sm sm:text-base">{selectedReservation.bereich}</p>
                      </div>
                    )}

                    {selectedReservation.message && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Anmerkungen</p>
                        <p className="text-slate-700 text-xs sm:text-sm bg-slate-50 p-3 rounded border border-slate-200">
                          {selectedReservation.message}
                        </p>
                      </div>
                    )}

                    {selectedReservation.rejectionReason && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Grund</p>
                        <p className="text-red-700 text-xs sm:text-sm bg-red-50 p-3 rounded border border-red-200">
                          {selectedReservation.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons - only show for pending */}
                  {activeTab === 'pending' && (
                    <div className="flex gap-2 sm:gap-3 mt-6 pt-6 border-t border-slate-200">
                      <Button
                        onClick={handleAccept}
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 sm:py-2 rounded-lg text-xs sm:text-sm min-h-12 sm:min-h-10 touch-target"
                      >
                        {isProcessing ? (
                          <>
                            <Loader className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
                            <span className="hidden sm:inline">Akzeptieren</span>
                            <span className="sm:hidden">OK</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Akzeptieren</span>
                            <span className="sm:hidden">OK</span>
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowDeclineModal(true)}
                        disabled={isProcessing}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 sm:py-2 rounded-lg text-xs sm:text-sm min-h-12 sm:min-h-10 touch-target"
                      >
                        <X className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Ablehnen</span>
                        <span className="sm:hidden">Nein</span>
                      </Button>
                    </div>
                  )}

                  {/* Status badge for completed */}
                  {activeTab === 'completed' && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <div className="inline-flex items-center px-3 py-2 rounded-lg bg-slate-100 text-xs sm:text-sm min-h-10">
                        <span className="font-semibold text-slate-700">
                          {selectedReservation.status === 'confirmed' ? '✓ Bestätigt' : '✕ Abgelehnt'}
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="p-4 sm:p-6 bg-white border-slate-200 h-full flex items-center justify-center shadow-sm">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-xs sm:text-sm text-slate-600 px-4">
                      Wählen Sie eine Reservierung, um Details anzuzeigen
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Terminal */}
      <div className="bg-black border border-slate-300 rounded-lg overflow-hidden flex flex-col h-48 mt-4">
        <div className="bg-slate-900 px-4 py-2 border-b border-slate-700">
          <p className="text-xs font-mono text-slate-400 font-semibold tracking-wider">AKTIVITÄTSLOG</p>
        </div>
        <div className="flex-1 overflow-y-auto bg-black p-4 font-mono text-xs">
          {terminalLogs.length === 0 ? (
            <div className="text-slate-600">$ Warten auf Aktivität...</div>
          ) : (
            terminalLogs.map((log) => (
              <div
                key={log.id}
                className={`text-white mb-1 ${
                  log.type === 'error'
                    ? 'text-red-400'
                    : log.type === 'success'
                    ? 'text-green-400'
                    : log.type === 'warning'
                    ? 'text-yellow-400'
                    : 'text-cyan-300'
                }`}
              >
                <span className="text-slate-600">[{log.timestamp.toLocaleTimeString('de-DE')}]</span>{' '}
                <span>{log.message}</span>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Decline modal */}
      <AnimatePresence>
        {showDeclineModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => !isProcessing && setShowDeclineModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white p-6 rounded-lg border border-slate-200 max-w-md w-full mx-4 shadow-lg"
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
                      Wird verarbeitet
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

      {/* Reservation Notification Popup - Full Page Modal */}
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
              <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 px-8 py-8">
                <div className="flex items-center gap-4 mb-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="w-4 h-4 bg-white rounded-full"
                  ></motion.div>
                  <h1 className="text-4xl font-bold text-white">Neue Reservierung!</h1>
                </div>
                <p className="text-green-100 text-sm font-medium ml-8">Gerade eingegangen</p>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Guest Name - Large Display */}
                <div className="border-b-2 border-gray-200 pb-6">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Reservierung von
                  </p>
                  <p className="text-5xl font-black text-gray-900">
                    {popupReservation.firstName}
                  </p>
                  <p className="text-3xl font-bold text-gray-700">
                    {popupReservation.lastName}
                  </p>
                </div>

                {/* Main Details Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Date */}
                  <div className="bg-blue-50 px-6 py-5 rounded-xl border-2 border-blue-200">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                      Datum
                    </p>
                    <p className="text-2xl font-black text-blue-900">{popupReservation.date}</p>
                  </div>

                  {/* Time */}
                  <div className="bg-purple-50 px-6 py-5 rounded-xl border-2 border-purple-200">
                    <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">
                      Uhrzeit
                    </p>
                    <p className="text-2xl font-black text-purple-900">{popupReservation.time}</p>
                  </div>

                  {/* People */}
                  <div className="bg-orange-50 px-6 py-5 rounded-xl border-2 border-orange-200">
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">
                      Personen
                    </p>
                    <p className="text-2xl font-black text-orange-900">{popupReservation.people || 1}</p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-slate-50 p-6 rounded-xl border-2 border-slate-200 space-y-4">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Kontaktinformation
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200">
                      <Mail className="w-6 h-6 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 mb-1">E-Mail</p>
                        <p className="text-lg font-semibold text-slate-900">{popupReservation.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200">
                      <Phone className="w-6 h-6 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Telefon</p>
                        <p className="text-lg font-semibold text-slate-900">{popupReservation.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bereich */}
                {popupReservation.bereich && (
                  <div className="bg-indigo-50 p-6 rounded-xl border-2 border-indigo-200">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">
                      Reservierungsbereich
                    </p>
                    <p className="text-2xl font-black text-indigo-900">{popupReservation.bereich}</p>
                  </div>
                )}

                {/* Notes */}
                {popupReservation.message && (
                  <div className="bg-amber-50 p-6 rounded-xl border-2 border-amber-200">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">
                      Kunde Anmerkungen
                    </p>
                    <p className="text-lg text-amber-900 leading-relaxed">{popupReservation.message}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-50 px-8 py-6 border-t-2 border-gray-200 flex gap-4">
                <Button
                  onClick={() => {
                    setShowPopupNotification(false);
                    setSelectedReservation(popupReservation);
                    setActiveTab('pending');
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl text-lg"
                >
                  <Check className="w-6 h-6 mr-3" />
                  Zur Reservierung
                </Button>
                <Button
                  onClick={() => setShowPopupNotification(false)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-4 rounded-xl text-lg"
                >
                  <X className="w-6 h-6 mr-3" />
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

