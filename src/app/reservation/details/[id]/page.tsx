'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  Download,
  Bookmark,
  AlertCircle,
  CheckCircle2,
  Share2,
  Loader,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

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
  status: string;
  createdAt: string;
}

export default function ReservationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const reservationId = params.id as string;

  const [reservation, setReservation] = useState<ReservationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);

  // Load reservation data
  useEffect(() => {
    const loadReservation = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/reservations/${reservationId}`);

        if (!response.ok) {
          toast.error('Reservierung nicht gefunden');
          router.push('/reservation');
          return;
        }

        const data = await response.json();
        setReservation(data);

        // Check if already bookmarked
        const bookmarked = localStorage.getItem(`reservation_bookmarked_${reservationId}`);
        setIsBookmarked(!!bookmarked);
      } catch (error) {
        console.error('Error loading reservation:', error);
        toast.error('Fehler beim Laden der Reservierung');
      } finally {
        setIsLoading(false);
      }
    };

    loadReservation();
  }, [reservationId, router]);

  const handleBookmark = () => {
    if (isBookmarked) {
      localStorage.removeItem(`reservation_bookmarked_${reservationId}`);
      setIsBookmarked(false);
      toast.success('Lesezeichen entfernt');
    } else {
      localStorage.setItem(`reservation_bookmarked_${reservationId}`, 'true');
      setIsBookmarked(true);
      toast.success('Als Lesezeichen gespeichert!');
    }
  };

  const handleAddToCalendar = (format: 'ics' | 'google') => {
    if (!reservation) return;

    const eventTitle = `Reservierung bei Seilerstubb`;
    const eventDescription = `Reservierung für ${reservation.people} Personen im ${reservation.bereich}\n\nTelefon: ${reservation.phone}\nE-Mail: ${reservation.email}\n${reservation.notes ? `Anmerkungen: ${reservation.notes}` : ''}`;
    const eventStart = `${reservation.date}T${reservation.time}:00`;

    if (format === 'ics') {
      // Generate ICS file for calendar import
      const [year, month, day] = reservation.date.split('-');
      const [hour, minute] = reservation.time.split(':');

      const dtStart = `${year}${month}${day}T${hour}${minute}00Z`;
      const dtEnd = `${year}${month}${day}T${parseInt(hour) + 2}${minute}00Z`; // 2-hour reservation

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
      // Open Google Calendar with event details
      const [hour, minute] = reservation.time.split(':');
      const startDate = new Date(`${reservation.date}T${hour}:${minute}:00`);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2-hour duration

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
  };

  const handleSharePage = () => {
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: 'Meine Reservierung bei Seilerstubb',
        text: `Reservierung für ${reservation?.people} Personen am ${reservation?.date} um ${reservation?.time} Uhr`,
        url: url,
      }).catch(err => console.log('Share error:', err));
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(url).then(() => {
        toast.success('Link in die Zwischenablage kopiert');
      });
    }
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
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Reservierung nicht gefunden</h1>
            <p className="text-slate-600">Die gesuchte Reservierung konnte nicht gefunden werden.</p>
          </Card>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(reservation.date).toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Startseite
            </Button>
          </Link>
          <button
            onClick={handleBookmark}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            {isBookmarked ? (
              <Bookmark className="w-6 h-6 fill-amber-600 text-amber-600" />
            ) : (
              <Bookmark className="w-6 h-6 text-slate-600" />
            )}
          </button>
        </div>

        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              reservation.status === 'pending'
                ? 'bg-yellow-50 text-yellow-700'
                : reservation.status === 'accepted'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {reservation.status === 'pending' && (
              <>
                <Clock className="w-4 h-4" />
                <span className="font-semibold">Reservierung ausstehend</span>
              </>
            )}
            {reservation.status === 'accepted' && (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-semibold">Reservierung bestätigt</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-8 mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Ihre Reservierung</h1>

            {/* Reservation Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Date & Time */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm font-medium">Datum</p>
                  <p className="text-slate-900 font-semibold">{formattedDate}</p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm font-medium">Uhrzeit</p>
                  <p className="text-slate-900 font-semibold">{reservation.time} Uhr</p>
                </div>
              </div>

              {/* Party Size */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm font-medium">Anzahl Personen</p>
                  <p className="text-slate-900 font-semibold">{reservation.people} Personen</p>
                </div>
              </div>

              {/* Area */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm font-medium">Bereich</p>
                  <p className="text-slate-900 font-semibold">{reservation.bereich}</p>
                </div>
              </div>

              {/* Name */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm font-medium">Name</p>
                  <p className="text-slate-900 font-semibold">
                    {reservation.firstName} {reservation.lastName}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-pink-100 rounded-lg">
                  <Phone className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm font-medium">Telefon</p>
                  <p className="text-slate-900 font-semibold">{reservation.phone}</p>
                </div>
              </div>

              {/* Email */}
              {reservation.email && (
                <div className="flex items-start gap-4 md:col-span-2">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Mail className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-medium">E-Mail</p>
                    <p className="text-slate-900 font-semibold">{reservation.email}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {reservation.notes && (
                <div className="md:col-span-2">
                  <p className="text-slate-600 text-sm font-medium mb-2">Anmerkungen</p>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-slate-900">{reservation.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-blue-800 text-sm">
                📧 Sie erhalten innerhalb von 24 Stunden eine E-Mail mit der Bestätigung oder Absage Ihrer Reservierung.
              </p>
            </div>

            {/* Calendar Options Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Zum Kalender hinzufügen</h2>
              <div className="space-y-3">
                <button
                  onClick={() => handleAddToCalendar('ics')}
                  className="w-full flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition"
                >
                  <Download className="w-5 h-5 text-amber-600" />
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">Als Datei herunterladen</p>
                    <p className="text-sm text-slate-600">Kompatibel mit iOS, Android und Desktop-Kalendern</p>
                  </div>
                </button>

                <button
                  onClick={() => handleAddToCalendar('google')}
                  className="w-full flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">Zu Google Calendar hinzufügen</p>
                    <p className="text-sm text-slate-600">Öffnet Google Calendar in Ihrem Browser</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Additional Actions */}
            <div className="border-t border-slate-200 pt-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Weitere Optionen</h2>
              <div className="space-y-3">
                <button
                  onClick={handleSharePage}
                  className="w-full flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
                >
                  <Share2 className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">Diese Seite teilen</p>
                    <p className="text-sm text-slate-600">Kopieren Sie den Link oder teilen Sie ihn mit anderen</p>
                  </div>
                </button>

                <button
                  onClick={handleBookmark}
                  className="w-full flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
                >
                  {isBookmarked ? (
                    <>
                      <Bookmark className="w-5 h-5 fill-purple-600 text-purple-600" />
                      <div className="text-left">
                        <p className="font-semibold text-slate-900">Von Lesezeichen entfernen</p>
                        <p className="text-sm text-slate-600">Diese Reservierung ist gespeichert</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-5 h-5 text-purple-600" />
                      <div className="text-left">
                        <p className="font-semibold text-slate-900">Als Lesezeichen speichern</p>
                        <p className="text-sm text-slate-600">Speichern Sie diese Seite für später</p>
                      </div>
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Restaurant Info */}
        <Card className="p-6 bg-amber-50 border border-amber-200">
          <h3 className="font-bold text-slate-900 mb-3">Kontaktieren Sie uns</h3>
          <div className="space-y-2 text-sm">
            <p className="text-slate-600">
              <span className="font-semibold">Seilerstubb</span> · DEUTSCHE & INDISCHE KÜCHE
            </p>
            <p className="text-slate-600">Seilerpfad 4, 65205 Wiesbaden</p>
            <p className="text-slate-600">📞 +49 611 36004940</p>
            <p className="text-slate-600">
              ✉️{' '}
              <a href="mailto:kontakt@seilerstubb.de" className="text-amber-700 hover:underline">
                kontakt@seilerstubb.de
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
