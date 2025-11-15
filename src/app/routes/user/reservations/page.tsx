'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import {
  ChevronLeft,
  History,
  Loader,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { getUserReservations } from '@/lib/firebase/user-profile-service';

interface Reservation {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  people: number;
  bereich: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: any;
  updatedAt?: any;
  auditTrail?: any[];
}

export default function ReservationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // Load user and reservations
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/auth/signin');
        return;
      }

      setUser(currentUser);

      try {
        const userReservations = await getUserReservations(currentUser.uid);
        setReservations(userReservations as Reservation[]);
      } catch (error) {
        console.error('Error loading reservations:', error);
        toast.error('Failed to load reservations');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Loader className="w-8 h-8 text-amber-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <motion.button
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/routes/user/profile')}
          className="inline-flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all mb-8"
        >
          <ChevronLeft className="w-5 h-5" />
          Zurück zum Profil
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <History className="w-8 h-8" />
            Reservierungsverlauf
          </h1>
          <p className="text-slate-600">Ihre Reservierungen</p>
        </motion.div>

        {/* Reservations List */}
        <div className="space-y-6">
          <AnimatePresence>
            {reservations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <History className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Noch keine Reservierungen</p>
              </motion.div>
            ) : (
              reservations.map((reservation, index) => {
                const createdTime = reservation.createdAt?.toDate?.() || new Date(reservation.createdAt);
                const now = new Date();
                const minutesAgo = Math.floor((now.getTime() - createdTime.getTime()) / (1000 * 60));

                return (
                  <motion.div
                    key={reservation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-6 bg-white border-slate-100 hover:shadow-lg transition-all">
                      {/* Status Badge & Header */}
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          {reservation.status === 'confirmed' && (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          )}
                          {reservation.status === 'pending' && (
                            <Clock className="w-6 h-6 text-amber-600" />
                          )}
                          {reservation.status === 'rejected' && (
                            <AlertCircle className="w-6 h-6 text-red-600" />
                          )}
                          <div>
                            <h3 className="font-bold text-slate-900">
                              {reservation.firstName} {reservation.lastName}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {minutesAgo > 1 ? `vor ${minutesAgo} Minuten` : 'gerade eben'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* View Mode - Display Only */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <div className="flex items-center gap-2 text-slate-600 mb-2">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-medium">Datum & Uhrzeit</span>
                            </div>
                            <p className="text-lg font-semibold text-slate-900">
                              {new Date(reservation.date).toLocaleDateString('de-DE', { 
                                weekday: 'long', 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric' 
                              })} um {reservation.time} Uhr
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-slate-600 mb-2">
                              <Users className="w-4 h-4" />
                              <span className="text-sm font-medium">Anzahl Personen</span>
                            </div>
                            <p className="text-lg font-semibold text-slate-900">{reservation.people} Personen</p>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-slate-600 mb-2">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm font-medium">Bereich</span>
                            </div>
                            <p className="text-lg font-semibold text-slate-900 capitalize">{reservation.bereich}</p>
                          </div>

                          <div>
                            <div className="text-sm font-medium text-slate-600 mb-2">Kontakt</div>
                            <p className="text-slate-900">{reservation.email}</p>
                            <p className="text-slate-900">{reservation.phone}</p>
                          </div>

                          {reservation.notes && (
                            <div className="md:col-span-2">
                              <div className="text-sm font-medium text-slate-600 mb-2">Notizen</div>
                              <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{reservation.notes}</p>
                            </div>
                          )}
                        </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
