'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: {
    date: string;
    time: string;
    people: number;
    bereich: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    notes: string;
  };
  reservationId: string;
}

export function CalendarReminderModal({
  isOpen,
  onClose,
  reservation,
  reservationId,
}: CalendarModalProps) {
  const handleAddToCalendar = (format: 'ics' | 'google') => {
    const eventTitle = `Reservierung bei Seilerstubb`;
    const eventDescription = `Reservierung für ${reservation.people} Personen im ${reservation.bereich}\n\nTelefon: ${reservation.phone}\nE-Mail: ${reservation.email}\n${reservation.notes ? `Anmerkungen: ${reservation.notes}` : ''}`;

    if (format === 'ics') {
      const [year, month, day] = reservation.date.split('-');
      const [hour, minute] = reservation.time.split(':');

      const dtStart = `${year}${month}${day}T${hour}${minute}00Z`;
      const dtEnd = `${year}${month}${day}T${parseInt(hour) + 2}${minute}00Z`;

      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Seilerstubb//Reservation//EN
BEGIN:VEVENT
UID:${reservationId}@seilerstubb.de
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '')}Z
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${eventTitle}
DESCRIPTION:${eventDescription}
LOCATION:Seilerpfad 4, 65205 Wiesbaden
END:VEVENT
END:VCALENDAR`;

      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `seilerstubb-reservierung-${reservation.date}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Kalender-Datei heruntergeladen');
    } else if (format === 'google') {
      const [hour, minute] = reservation.time.split(':');
      const startDate = new Date(`${reservation.date}T${hour}:${minute}:00`);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: eventTitle,
        dates: `${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/` +
               `${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
        details: eventDescription,
        location: 'Seilerpfad 4, 65205 Wiesbaden',
      });

      window.open(`https://calendar.google.com/calendar/u/0/r/eventedit?${params.toString()}`, '_blank');
      toast.success('Google Calendar geöffnet');
    }

    onClose();
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
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-lg mb-3">
                  <Calendar className="w-6 h-6 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Zum Kalender hinzufügen?
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Speichern Sie Ihre Reservierung als Erinnerung
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleAddToCalendar('ics')}
                  className="w-full flex items-center gap-3 p-3 border-2 border-slate-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition text-left"
                >
                  <Download className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Als Datei laden</p>
                    <p className="text-xs text-slate-600">Kompatibel mit allen Geräten</p>
                  </div>
                </button>

                <button
                  onClick={() => handleAddToCalendar('google')}
                  className="w-full flex items-center gap-3 p-3 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                >
                  <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Google Calendar</p>
                    <p className="text-xs text-slate-600">Öffnet Ihr Kalender</p>
                  </div>
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Später
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
