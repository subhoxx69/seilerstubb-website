'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { CalendarReminderModal } from '@/components/reservation/calendar-reminder-modal';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowLeft, Loader } from 'lucide-react';
import Link from 'next/link';

interface ReservationDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  bereich: string;
  notes: string;
}

export default function ReservationConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const reservationId = searchParams.get('id') || '';
  const showCalendar = searchParams.get('showCalendar') === 'true';

  const [reservation, setReservation] = useState<ReservationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Load reservation data
  useEffect(() => {
    if (!reservationId) {
      router.push('/reservation');
      return;
    }

    const loadReservation = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/reservations/${reservationId}`);

        if (!response.ok) {
          router.push('/reservation');
          return;
        }

        const data = await response.json();
        setReservation(data);

        // Show calendar modal if coming from form submission
        if (showCalendar) {
          setShowCalendarModal(true);
        }
      } catch (error) {
        console.error('Error loading reservation:', error);
        router.push('/reservation');
      } finally {
        setIsLoading(false);
      }
    };

    loadReservation();
  }, [reservationId, router, showCalendar]);

  const handleCloseCalendarModal = () => {
    setShowCalendarModal(false);
    // After closing modal, redirect to home or stay on this page
    // User can navigate themselves
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mx-auto">
          <Link href="/reservation">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Reservierung
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-2xl mx-auto">
        {/* Success Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6"
          >
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </motion.div>

          <h1 className="text-4xl font-bold text-slate-900 mb-2">Reservierung erfolgreich!</h1>
          <p className="text-lg text-slate-600">
            Ihre Reservierung wurde gespeichert. Sie erhalten innerhalb von 24 Stunden eine E-Mail mit der Bestätigung oder Absage.
          </p>
        </motion.div>

        {/* Reservation Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white border-2 border-green-200 rounded-2xl p-8 mb-8"
        >
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-slate-600 text-sm font-medium">Datum</p>
              <p className="text-slate-900 font-semibold text-lg">
                {new Date(reservation.date).toLocaleDateString('de-DE', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium">Uhrzeit</p>
              <p className="text-slate-900 font-semibold text-lg">{reservation.time} Uhr</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium">Personen</p>
              <p className="text-slate-900 font-semibold text-lg">{reservation.people}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm font-medium">Bereich</p>
              <p className="text-slate-900 font-semibold text-lg">{reservation.bereich}</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <p className="text-slate-600 text-sm font-medium mb-2">Bestätigungsnummer</p>
            <p className="text-slate-900 font-mono text-lg break-all">{reservationId}</p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button
            onClick={() => setShowCalendarModal(true)}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            size="lg"
          >
            Zum Kalender hinzufügen
          </Button>

          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full" size="lg">
              Zur Startseite
            </Button>
          </Link>
        </motion.div>

        {/* Calendar Modal */}
        <CalendarReminderModal
          isOpen={showCalendarModal}
          onClose={handleCloseCalendarModal}
          reservation={reservation}
          reservationId={reservationId}
        />
      </div>
    </div>
  );
}
