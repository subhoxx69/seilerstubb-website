'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Phone, Mail, Check, X, Search, AlertCircle, Eye, Loader } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { updateReservationStatusWithNotification, deleteReservation } from '@/lib/server-actions/reservation-actions';
import { getAuth } from 'firebase/auth';

interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  partySize: number;
  message: string;
  status: 'pending' | 'confirmed' | 'rejected';
  firstName?: string;
  lastName?: string;
  bereich?: string;
  people?: number;
  rejectionReason?: string;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState('');
  const [isRejectLoading, setIsRejectLoading] = useState(false);
  const [rejectionData, setRejectionData] = useState<{
    reservationId: string;
    reason: string;
  }>({ reservationId: '', reason: '' });

  // Load reservations from Firebase
  useEffect(() => {
    const loadReservations = async () => {
      try {
        const q = query(collection(db, 'reservations'), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        const data: Reservation[] = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          data.push({
            id: doc.id,
            name: docData.name || `${docData.firstName || ''} ${docData.lastName || ''}`.trim(),
            email: docData.email,
            phone: docData.phone,
            date: docData.date,
            time: docData.time,
            partySize: docData.partySize || docData.people || 1,
            message: docData.message || docData.notes || '',
            status: docData.status || 'pending',
            firstName: docData.firstName,
            lastName: docData.lastName,
            bereich: docData.bereich,
            people: docData.people,
            rejectionReason: docData.rejectionReason,
          });
        });
        setReservations(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading reservations:', error);
        toast.error('Fehler beim Laden der Reservierungen');
        setIsLoading(false);
      }
    };

    loadReservations();
  }, []);

  const filteredReservations = reservations.filter(res => {
    const matchesSearch = 
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || res.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'confirmed' | 'rejected') => {
    try {
      // Get ID token from current user
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('User not authenticated');
        return;
      }

      const idToken = await currentUser.getIdToken();

      if (newStatus === 'rejected') {
        setRejectionData({ reservationId: id, reason: '' });
        setShowRejectionModal(true);
      } else {
        // Get reservation details
        const reservation = reservations.find(r => r.id === id);
        if (!reservation) return;

        // Update status with notification
        const result = await updateReservationStatusWithNotification(id, newStatus as 'confirmed' | 'rejected', undefined, idToken);
        if (!result.success) {
          toast.error(result.error || 'Fehler beim Aktualisieren');
          return;
        }

        // Send acceptance email via Gmail
        if (newStatus === 'confirmed' && reservation.email) {
          try {
            const response = await fetch('/api/email/send-acceptance', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                to: reservation.email,
                firstName: reservation.firstName || reservation.name.split(' ')[0],
                date: reservation.date,
                time: reservation.time,
                people: reservation.people || 1,
                bereich: reservation.bereich || 'Innenbereich',
                phone: reservation.phone,
                notes: reservation.message,
                reservationId: id,
              }),
            });

            if (response.ok) {
              const result = await response.json();
              toast.success('Email erfolgreich versendet');
              console.log('✅ Acceptance email sent:', result.messageId);
            } else {
              const error = await response.json();
              toast.error('Email konnte nicht versendet werden: ' + (error.error || 'Fehler'));
              console.error('Email sending failed:', error);
            }
          } catch (error) {
            toast.error('Fehler beim Versenden der Email');
            console.error('Error sending email:', error);
          }
        }

        setReservations(reservations.map(r => 
          r.id === id ? { ...r, status: newStatus, rejectionReason: undefined } : r
        ));
        toast.success('Reservierungsstatus aktualisiert');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Fehler beim Aktualisieren des Status');
    }
  };

  const handleRejectReservation = async () => {
    if (!rejectionData.reason.trim()) {
      toast.error('Bitte geben Sie einen Grund für die Ablehnung an');
      return;
    }

    setIsRejectLoading(true);

    try {
      // Get ID token from current user
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('User not authenticated');
        setIsRejectLoading(false);
        return;
      }

      const idToken = await currentUser.getIdToken();

      // Get reservation details
      const reservation = reservations.find(r => r.id === rejectionData.reservationId);
      if (!reservation) {
        setIsRejectLoading(false);
        return;
      }

      // Update status with notification
      const result = await updateReservationStatusWithNotification(
        rejectionData.reservationId,
        'rejected',
        rejectionData.reason.trim(),
        idToken
      );
      
      if (!result.success) {
        toast.error(result.error || 'Fehler beim Ablehnen');
        setIsRejectLoading(false);
        return;
      }

      // Send decline email via Gmail
      if (reservation.email) {
        try {
          const response = await fetch('/api/email/send-decline', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              to: reservation.email,
              firstName: reservation.firstName || reservation.name.split(' ')[0],
              date: reservation.date,
              time: reservation.time,
              people: reservation.people || 1,
              area: reservation.bereich || 'Innenbereich',
              reason: rejectionData.reason.trim(),
              reservationId: rejectionData.reservationId,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            toast.success('Ablehnungs-Email erfolgreich versendet');
            console.log('✅ Decline email sent:', result.messageId);
          } else {
            const error = await response.json();
            toast.error('Ablehnungs-Email konnte nicht versendet werden: ' + (error.error || 'Fehler'));
            console.error('Email sending failed:', error);
          }
        } catch (error) {
          toast.error('Fehler beim Versenden der Ablehnungs-Email');
          console.error('Error sending email:', error);
        }
      }

      setReservations(reservations.map(r => 
        r.id === rejectionData.reservationId 
          ? { ...r, status: 'rejected', rejectionReason: rejectionData.reason.trim() } 
          : r
      ));
      toast.success('Reservierung abgelehnt');
      setShowRejectionModal(false);
      setRejectionData({ reservationId: '', reason: '' });
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      toast.error('Fehler beim Ablehnen der Reservierung');
    } finally {
      setIsRejectLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Get ID token from current user
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('User not authenticated');
        return;
      }

      const idToken = await currentUser.getIdToken();

      const result = await deleteReservation(id, idToken);
      
      if (!result.success) {
        toast.error(result.error || 'Fehler beim Löschen der Reservierung');
        return;
      }
      
      setReservations(reservations.filter(r => r.id !== id));
      toast.success('Reservierung gelöscht');
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error('Fehler beim Löschen der Reservierung');
    }
  };

  const handleViewNotes = (notes: string) => {
    setSelectedNotes(notes);
    setShowNotesModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-b-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Reservierungen werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Reservierungen verwalten</h1>
        <p className="text-slate-600">Verwalten Sie alle Tischreservierungen</p>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <Card className="flex-1 p-4 rounded-xl border-0 bg-white">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg">
            <Search className="w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Nach Name oder E-Mail suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-0 focus:outline-none text-slate-900 placeholder-slate-400"
            />
          </div>
        </Card>
        <div className="flex gap-2">
          {(['all', 'pending', 'confirmed', 'rejected'] as const).map((status) => (
            <Button
              key={status}
              onClick={() => setFilter(status)}
              variant={filter === status ? 'default' : 'outline'}
              className={`rounded-lg ${filter === status ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
            >
              {status === 'all' ? 'Alle' : status === 'pending' ? 'Ausstehend' : status === 'confirmed' ? 'Bestätigt' : 'Abgelehnt'}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Reservations Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="rounded-2xl border-0 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Reservierungs ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Kontakt</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Datum & Zeit</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Gäste</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Notizen</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation, idx) => (
                  <motion.tr
                    key={reservation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        <p className="text-gray-700 font-semibold">{reservation.id.substring(0, 8)}</p>
                        <p className="text-gray-500 text-xs">{reservation.id.substring(8, 16)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{reservation.name.charAt(0)}</span>
                        </div>
                        <p className="font-medium text-slate-900">{reservation.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        <p className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-3 h-3" />
                          {reservation.email}
                        </p>
                        <p className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-3 h-3" />
                          {reservation.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        <p className="flex items-center gap-2 text-slate-900 font-medium">
                          <Calendar className="w-3 h-3" />
                          {reservation.date}
                        </p>
                        <p className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-3 h-3" />
                          {reservation.time}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-900 font-medium">
                        <Users className="w-4 h-4" />
                        {reservation.partySize}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                      {reservation.rejectionReason && (
                        <span className="text-red-600 font-medium">
                          Grund: {reservation.rejectionReason}
                        </span>
                      ) || (reservation.message ? (
                        <button
                          onClick={() => handleViewNotes(reservation.message)}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors font-medium"
                          title="Notizen anzeigen"
                        >
                          <Eye className="w-3 h-3" />
                          Anzeigen
                        </button>
                      ) : (
                        <span>—</span>
                      ))}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                        reservation.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : reservation.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {reservation.status === 'confirmed' ? 'Bestätigt' : reservation.status === 'rejected' ? 'Abgelehnt' : 'Ausstehend'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {reservation.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors text-green-600"
                              title="Bestätigen"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(reservation.id, 'rejected')}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                              title="Ablehnen"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {reservation.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(reservation.id, 'rejected')}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                            title="Ablehnen"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(reservation.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                          title="Löschen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {filteredReservations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">Keine Reservierungen gefunden</p>
          </div>
        )}
      </motion.div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Reservierung ablehnen</h3>
            </div>

            <p className="text-slate-600 mb-6">
              Bitte geben Sie einen Grund für die Ablehnung dieser Reservierung an.
            </p>

            <div className="mb-6">
              <Label htmlFor="rejection-reason" className="text-slate-900 font-semibold mb-2 block">
                Grund der Ablehnung *
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="z.B. Keine Verfügbarkeit, Geschlossen, Zu viele Gäste..."
                value={rejectionData.reason}
                onChange={(e) => setRejectionData({ ...rejectionData, reason: e.target.value })}
                className="border-2 border-slate-200 rounded-lg p-3 min-h-[100px] focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionData({ reservationId: '', reason: '' });
                }}
                variant="outline"
                className="flex-1 border-2"
                disabled={isRejectLoading}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleRejectReservation}
                disabled={isRejectLoading || !rejectionData.reason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRejectLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Wird verarbeitet...
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
        </div>
      )}

      {/* Notes Preview Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
              <h3 className="text-2xl font-bold text-slate-900">Notizen & Besondere Wünsche</h3>
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setSelectedNotes('');
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 min-w-0">
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 break-words">
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-base word-break: break-word">
                  {selectedNotes || 'Keine Notizen verfügbar'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 flex-shrink-0">
              <Button
                onClick={() => {
                  setShowNotesModal(false);
                  setSelectedNotes('');
                }}
                className="bg-slate-600 hover:bg-slate-700 text-white"
              >
                Schließen
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
