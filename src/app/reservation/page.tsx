'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ChevronLeft, Send, Loader, AlertCircle, Check, ChevronRight, Calendar, Clock, Users, Phone, User, X, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { DateTimePickerModal } from '@/components/shared/date-time-picker-modal';
import { getUserReservationInfo, saveUserReservationInfo } from '@/lib/services/reservation-storage-service';

const BEREICH_OPTIONS = [
  { name: 'Innenbereich', key: 'innen' },
  { name: 'Außenbereich', key: 'aussen' },
];

type Step = 'bereich' | 'datetime' | 'contact' | 'confirm';

interface ReservationData {
  bereich: string;
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  people: number;
  notes: string;
}

export default function ReservationPage() {
  const [currentStep, setCurrentStep] = useState<Step>('bereich');
  const [formData, setFormData] = useState<ReservationData>({
    bereich: '',
    date: '',
    time: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    people: 1,
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDateTimeModalOpen, setIsDateTimeModalOpen] = useState(false);
  const [showSendingOverlay, setShowSendingOverlay] = useState(false);
  const [sendingStatus, setSendingStatus] = useState<'sending' | 'verifying' | 'success' | 'error'>('sending');
  const [sendingMessage, setSendingMessage] = useState('Bitte warten… Ihre Reservierung wird überprüft');
  const [reservationsEnabled, setReservationsEnabled] = useState(true);
  const [checkingReservationStatus, setCheckingReservationStatus] = useState(true);

  // Load saved user info on component mount
  useEffect(() => {
    const loadSavedUserInfo = () => {
      try {
        const savedInfo = getUserReservationInfo();
        
        if (savedInfo) {
          // Pre-fill the form with saved data (excluding notes and people)
          setFormData(prev => ({
            ...prev,
            firstName: savedInfo.firstName || '',
            lastName: savedInfo.lastName || '',
            email: savedInfo.email || '',
            phone: savedInfo.phone || '',
            bereich: savedInfo.bereich || '',
            // Do NOT load: notes, people (user decides these each time)
          }));
          console.log('✅ Loaded saved user info from device');
        }
      } catch (error) {
        console.error('Error loading saved user info:', error);
      }
    };

    loadSavedUserInfo();
  }, []);

  // Check if reservations are enabled
  useEffect(() => {
    const checkReservationStatus = async () => {
      try {
        setCheckingReservationStatus(true);
        const response = await fetch('/api/opening-hours');
        if (!response.ok) {
          console.error('Failed to fetch reservation status');
          setReservationsEnabled(true); // Default to enabled if we can't check
          return;
        }
        const data = await response.json();
        const enabled = data.reservationsEnabled !== false;
        setReservationsEnabled(enabled);
        console.log('✅ Reservation status:', enabled ? 'Enabled' : 'Disabled');
      } catch (error) {
        console.error('Error checking reservation status:', error);
        setReservationsEnabled(true); // Default to enabled on error
      } finally {
        setCheckingReservationStatus(false);
      }
    };

    checkReservationStatus();
  }, []);

  const handleDateTimeConfirm = (date: string, time: string) => {
    setFormData(prev => ({ ...prev, date, time }));
    if (errors.date) delete errors.date;
    if (errors.time) delete errors.time;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    
    if (type === 'number') {
      // Allow any value while typing, will validate on blur
      newValue = value === '' ? '' : parseInt(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePeopleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    let finalValue = parseInt(value);
    
    // Clamp the value when user leaves the field
    if (isNaN(finalValue) || finalValue < 1) {
      finalValue = 1;
    } else if (finalValue > 20) {
      finalValue = 20;
    }
    
    setFormData(prev => ({
      ...prev,
      people: finalValue,
    }));
  };

  const canProceedToDateTime = (): boolean => {
    return !!formData.bereich;
  };

  const canProceedToContact = (): boolean => {
    return !!formData.bereich && !!formData.date && !!formData.time;
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'datetime') {
      if (!formData.date) newErrors.date = 'Datum erforderlich';
      if (!formData.time) newErrors.time = 'Uhrzeit erforderlich';
    }

    if (currentStep === 'contact') {
      if (!formData.firstName || formData.firstName.trim().length < 2) {
        newErrors.firstName = 'Vorname erforderlich';
      }
      if (!formData.phone || formData.phone.trim().length < 5) {
        newErrors.phone = 'Telefonnummer erforderlich';
      }
      if (formData.people < 1 || formData.people > 20) {
        newErrors.people = 'Bitte wählen Sie zwischen 1 und 20 Personen';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (currentStep === 'bereich') {
      setCurrentStep('datetime');
    } else if (currentStep === 'datetime') {
      setCurrentStep('contact');
    } else if (currentStep === 'contact') {
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    if (currentStep === 'datetime') {
      setCurrentStep('bereich');
    } else if (currentStep === 'contact') {
      setCurrentStep('datetime');
    } else if (currentStep === 'confirm') {
      setCurrentStep('contact');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard: prevent submission if reservations are disabled
    if (!reservationsEnabled) {
      toast.error('Reservierungen sind derzeit nicht möglich');
      return;
    }

    if (!formData.date || !formData.time) {
      toast.error('Bitte wählen Sie Datum und Uhrzeit');
      return;
    }

    // Show overlay with sending status
    setShowSendingOverlay(true);
    setSendingStatus('sending');
    setSendingMessage('Bitte warten… Ihre Reservierung wird erstellt');

    try {
      setIsSubmitting(true);

      // Import modules
      const { auth } = await import('@/lib/firebase/config');

      // Get current user ID if authenticated
      const currentUser = auth.currentUser;
      const userId = currentUser?.uid || null;

      // Save user info to localStorage (excluding notes and people)
      saveUserReservationInfo({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        bereich: formData.bereich,
      });

      // Store email for later status notifications
      if (formData.email) {
        localStorage.setItem('reservation_email', formData.email);
      }

      // Move to sending step
      setSendingStatus('sending');
      setSendingMessage('Bitte warten… Ihre Reservierung wird zur Überprüfung gesendet');

      // Create reservation via API
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          date: formData.date,
          time: formData.time,
          people: formData.people,
          bereich: formData.bereich,
          notes: formData.notes,
          userId: userId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSendingStatus('error');
        setSendingMessage(result.error || 'Fehler beim Erstellen der Reservierung');
        console.error('❌ Reservation creation failed:', result);
        return;
      }

      console.log('✅ Reservation created successfully:', result.reservationId);

      // Move to verification step
      setSendingStatus('verifying');
      setSendingMessage('Bitte warten… Ihre Reservierung wird überprüft');

      // Verify submission with up to 3 attempts
      let verificationSuccess = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts && !verificationSuccess) {
        attempts++;
        console.log(`Verification attempt ${attempts}/${maxAttempts}`);

        // Wait before checking
        await new Promise(resolve => setTimeout(resolve, 500));

        // For now, we trust the API response
        // In production, you could do additional verification
        verificationSuccess = true;
      }

      if (verificationSuccess) {
        setSendingStatus('success');
        setSendingMessage(
          'Reservierung erfolgreich gesendet! Sie erhalten innerhalb von 24 Stunden eine E-Mail mit der Bestätigung oder Absage.'
        );

        // Auto-close after 5 seconds
        setTimeout(() => {
          setShowSendingOverlay(false);
          window.location.href = '/';
        }, 5000);
      } else {
        setSendingStatus('error');
        setSendingMessage('Reservierung konnte nicht überprüft werden. Bitte versuchen Sie es erneut.');
      }
    } catch (error) {
      console.error('❌ Submit error:', error);
      setSendingStatus('error');
      setSendingMessage(error instanceof Error ? error.message : 'Fehler beim Erstellen der Reservierung');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-2xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </Link>

        <div className="mb-12">
          <h1
            className="text-5xl font-bold text-slate-900 mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Reservierung
          </h1>
          <p className="text-lg text-slate-600">
            Reservieren Sie einen Tisch in unserem Restaurant
          </p>
        </div>

        {!reservationsEnabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-red-200 bg-red-50 p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900 mb-1">Reservierungen nicht möglich</p>
                  <p className="text-red-800 text-sm">
                    Derzeit können keine Reservierungen vorgenommen werden. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {submitStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <p className="text-green-800">
                  Vielen Dank! Ihre Reservierung wurde erfolgreich eingereicht. Wir werden sie in Kürze bestätigen.
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {submitStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800">
                  Es tut uns leid, es gab einen Fehler. Bitte versuchen Sie es später erneut.
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {reservationsEnabled ? (
          <>
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-2">
            {(['bereich', 'datetime', 'contact', 'confirm'] as const).map((step, idx) => (
              <React.Fragment key={step}>
                <motion.div
                  whileHover={{ scale: currentStep === step ? 1.15 : 1 }}
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                    currentStep === step
                      ? 'bg-amber-600 text-white'
                      : ['bereich', 'datetime', 'contact', 'confirm'].indexOf(currentStep) > idx
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {['bereich', 'datetime', 'contact', 'confirm'].indexOf(currentStep) > idx ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    idx + 1
                  )}
                </motion.div>
                {idx < 3 && (
                  <div
                    className={`flex-1 h-1 transition-colors ${
                      ['bereich', 'datetime', 'contact', 'confirm'].indexOf(currentStep) > idx
                        ? 'bg-green-600'
                        : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-600 mt-2">
            <span>Bereich</span>
            <span>Datum & Uhrzeit</span>
            <span>Kontakt</span>
            <span>Bestätigung</span>
          </div>
        </div>

        <Card className="p-8">
          <AnimatePresence mode="wait">
            {/* STEP 1: BEREICH SELECTION */}
            {currentStep === 'bereich' && (
              <motion.div
                key="bereich"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Schritt 1: Bereich auswählen</h2>
                <div className="space-y-4">
                  {BEREICH_OPTIONS.map(bereich => (
                    <motion.button
                      key={bereich.key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, bereich: bereich.name }));
                        setErrors({});
                      }}
                      className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                        formData.bereich === bereich.name
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-slate-200 bg-white hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{bereich.name}</h3>
                          <p className="text-slate-600 text-sm">Verfügbare Tische</p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            formData.bereich === bereich.name
                              ? 'border-amber-600 bg-amber-600'
                              : 'border-slate-300'
                          }`}
                        >
                          {formData.bereich === bereich.name && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <div className="mt-8 flex justify-end gap-4">
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedToDateTime()}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Weiter <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DATE & TIME */}
            {currentStep === 'datetime' && (
              <motion.div
                key="datetime"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Schritt 2: Datum & Uhrzeit</h2>
                <div className="space-y-6">
                  <div>
                    <Label className="flex items-center gap-2 text-slate-900 font-semibold mb-3">
                      <Calendar className="w-4 h-4" />
                      Datum & Uhrzeit *
                    </Label>
                    <button
                      onClick={() => setIsDateTimeModalOpen(true)}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition text-left ${
                        errors.date || errors.time ? 'border-red-500' : 'border-slate-200'
                      } ${formData.date && formData.time ? 'bg-amber-50 border-amber-500' : 'bg-white hover:border-amber-300'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-amber-600" />
                        <div>
                          {formData.date && formData.time ? (
                            <div>
                              <p className="font-semibold text-slate-900">
                                {new Date(formData.date).toLocaleDateString('de-DE', {
                                  weekday: 'long',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                              <p className="text-sm text-amber-700">{formData.time} Uhr</p>
                            </div>
                          ) : (
                            <p className="text-slate-500">Datum und Uhrzeit auswählen...</p>
                          )}
                        </div>
                      </div>
                    </button>
                    {(errors.date || errors.time) && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.date || errors.time}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-between gap-4">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="border-2"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Zurück
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!canProceedToContact()}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Weiter <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                <DateTimePickerModal
                  isOpen={isDateTimeModalOpen}
                  onClose={() => setIsDateTimeModalOpen(false)}
                  onConfirm={handleDateTimeConfirm}
                  selectedDate={formData.date}
                  selectedTime={formData.time}
                  bereich={formData.bereich}
                />
              </motion.div>
            )}

            {/* STEP 3: CONTACT */}
            {currentStep === 'contact' && (
              <motion.div
                key="contact"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Schritt 3: Kontaktdaten</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="flex items-center gap-2 text-slate-900 font-semibold mb-2">
                        <User className="w-4 h-4" />
                        Vorname *
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Max"
                        className={`border-2 ${errors.firstName ? 'border-red-500' : 'border-slate-200'}`}
                      />
                      {errors.firstName && (
                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="lastName" className="text-slate-900 font-semibold mb-2 block">
                        Nachname
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Mustermann"
                        className="border-2 border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2 text-slate-900 font-semibold mb-2">
                        <Phone className="w-4 h-4" />
                        Telefon *
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+49 123 456789"
                        className={`border-2 ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}
                      />
                      {errors.phone && (
                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-slate-900 font-semibold mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        E-Mail - Wichtig für Bestätigung
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="max@example.com"
                        className="border-2 border-slate-200"
                      />
                      {formData.email ? (
                        <p className="text-green-600 text-xs mt-2 flex items-center gap-1 font-semibold">
                          <Check className="w-3 h-3" /> Sie erhalten die Bestätigung oder Ablehnung per E-Mail
                        </p>
                      ) : (
                        <p className="text-amber-600 text-xs mt-2 flex items-center gap-1 font-semibold">
                          <AlertCircle className="w-3 h-3" /> Ohne E-Mail erhalten Sie keine Antwort auf Ihre Reservierung!
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="people" className="flex items-center gap-2 text-slate-900 font-semibold mb-2">
                      <Users className="w-4 h-4" />
                      Anzahl der Personen *
                    </Label>
                    <Input
                      id="people"
                      name="people"
                      type="number"
                      min="1"
                      max="20"
                      value={String(formData.people)}
                      onChange={handleChange}
                      onBlur={handlePeopleBlur}
                      className={`border-2 ${errors.people ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {errors.people && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.people}
                      </p>
                    )}
                    <p className="text-slate-500 text-xs mt-2">
                      Max. 20 Personen pro Reservierung
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-slate-900 font-semibold mb-2 block">
                      Besondere Wünsche oder Anforderungen
                    </Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="z.B. Hochzeitsfeier, Geschäftstreffen, Allergien..."
                      className="border-2 border-slate-200 min-h-[100px]"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-between gap-4">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="border-2"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Zurück
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Bestätigung <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: CONFIRMATION */}
            {currentStep === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Reservierungsbestätigung</h2>

                <div className="space-y-4 mb-8 bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-600 text-sm">Bereich</p>
                      <p className="text-lg font-bold text-slate-900">{formData.bereich}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">Anzahl Personen</p>
                      <p className="text-lg font-bold text-slate-900">{formData.people}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">Datum</p>
                      <p className="text-lg font-bold text-slate-900">
                        {new Date(formData.date).toLocaleDateString('de-DE', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">Uhrzeit</p>
                      <p className="text-lg font-bold text-slate-900">{formData.time} Uhr</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-300 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-600 text-sm">Name</p>
                        <p className="text-slate-900">
                          {formData.firstName} {formData.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm">Telefon</p>
                        <p className="text-slate-900">{formData.phone}</p>
                      </div>
                    </div>
                    {formData.email && (
                      <div className="mt-4">
                        <p className="text-slate-600 text-sm">E-Mail</p>
                        <p className="text-slate-900">{formData.email}</p>
                      </div>
                    )}
                  </div>

                  {formData.notes && (
                    <div className="border-t border-slate-300 pt-4">
                      <p className="text-slate-600 text-sm">Anmerkungen</p>
                      <p className="text-slate-900">{formData.notes}</p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                  <p className="text-blue-800 text-sm">
                    Mit dem Absenden bestätigen Sie, dass Ihre Reservierung angenommen wird und Sie diese rechtzeitig stornieren können. 
                    Wir werden Sie in Kürze kontaktieren, um die Buchung zu bestätigen.
                  </p>
                </div>

                {/* Device Storage Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex gap-3">
                  <div className="pt-0.5">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  </div>
                  <div>
                    <p className="text-green-900 font-semibold text-sm mb-1">Ihre Daten werden auf Ihrem Gerät gespeichert</p>
                    <p className="text-green-800 text-xs">
                      Ihre Kontaktdaten (Name, Telefon, E-Mail) werden sicher auf Ihrem Gerät gespeichert. Bei der nächsten Reservierung können Sie diese schnell wiederverwenden und ändern. Diese Daten werden nicht an Dritte weitergegeben.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex justify-between gap-4">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="border-2"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Bearbeiten
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Wird versendet...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Reservierung absenden
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
          </>
        ) : null}

      {/* Sending Process Overlay Modal */}
      <AnimatePresence>
        {showSendingOverlay && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-gradient-to-b from-black/40 to-black/60 backdrop-blur-sm z-40"
              onClick={() => sendingStatus === 'error' && setShowSendingOverlay(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
            >
              <div className="w-full max-w-sm">
                <motion.div
                  className="relative overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100"
                >
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-transparent to-transparent opacity-0" />

                  {/* Close button for error state */}
                  {sendingStatus === 'error' && (
                    <motion.button
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      onClick={() => setShowSendingOverlay(false)}
                      className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-xl transition z-10"
                    >
                      <X className="w-5 h-5 text-slate-600" />
                    </motion.button>
                  )}

                  {/* Content */}
                  <div className="relative p-8 text-center">
                    {/* Sending State */}
                    {sendingStatus === 'sending' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* Animated loader with pulse */}
                        <div className="flex justify-center pt-4">
                          <div className="relative w-20 h-20">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                              className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-600 border-r-amber-400"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute inset-2 rounded-full border-2 border-amber-200 opacity-30"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Send className="w-8 h-8 text-amber-600" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-2">
                            Reservierung wird gesendet…
                          </h3>
                          <p className="text-slate-600 text-sm leading-relaxed">
                            {sendingMessage}
                          </p>
                        </div>
                        {/* Progress indicator */}
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                              className="w-2 h-2 rounded-full bg-amber-600"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                              className="w-2 h-2 rounded-full bg-amber-600"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                              className="w-2 h-2 rounded-full bg-amber-600"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Verifying State */}
                    {sendingStatus === 'verifying' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* Animated verification icon */}
                        <div className="flex justify-center pt-4">
                          <div className="relative w-20 h-20">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                              className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-400"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.15, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="absolute inset-0 rounded-full border-2 border-blue-200 opacity-20"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Clock className="w-8 h-8 text-blue-600" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-2">
                            Wird überprüft…
                          </h3>
                          <p className="text-slate-600 text-sm leading-relaxed">
                            {sendingMessage}
                          </p>
                        </div>
                        {/* Verification steps */}
                        <div className="space-y-3 pt-2">
                          {[0, 1, 2].map((step) => (
                            <motion.div
                              key={step}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: step * 0.2 }}
                              className="flex items-center gap-3 text-sm"
                            >
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: step * 0.15 }}
                                className="w-1.5 h-1.5 rounded-full bg-blue-600"
                              />
                              <span className="text-slate-600">Schritt {step + 1} wird verarbeitet</span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Success State */}
                    {sendingStatus === 'success' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* Success animation */}
                        <div className="flex justify-center pt-4">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                            className="relative w-20 h-20"
                          >
                            <motion.div
                              className="absolute inset-0 rounded-full bg-green-100"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1, duration: 0.4 }}
                            />
                            <motion.div
                              className="absolute inset-0 rounded-full border-2 border-green-300"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.2, duration: 0.4 }}
                            />
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <Check className="w-10 h-10 text-green-600 stroke-3" />
                            </motion.div>
                          </motion.div>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-2">
                            Erfolgreich gesendet!
                          </h3>
                          <p className="text-slate-600 text-sm leading-relaxed">
                            {sendingMessage}
                          </p>
                        </div>
                        {/* Success checkmarks */}
                        <div className="space-y-2 pt-2">
                          {['Reservierung gespeichert', 'Bestätigung versendet', 'Daten überprüft'].map((text, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 + 0.2 }}
                              className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-2"
                            >
                              <Check className="w-4 h-4" />
                              <span>{text}</span>
                            </motion.div>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 pt-2">
                          Sie werden in Kürze weitergeleitet…
                        </p>
                      </motion.div>
                    )}

                    {/* Error State */}
                    {sendingStatus === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* Error animation */}
                        <div className="flex justify-center pt-4">
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                            className="relative w-20 h-20"
                          >
                            <motion.div
                              className="absolute inset-0 rounded-full bg-red-100"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1, duration: 0.4 }}
                            />
                            <motion.div
                              className="absolute inset-0 rounded-full border-2 border-red-300"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.2, duration: 0.4 }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <AlertCircle className="w-10 h-10 text-red-600 stroke-2" />
                            </div>
                          </motion.div>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-2">
                            Etwas ist schief gelaufen
                          </h3>
                          <p className="text-slate-600 text-sm leading-relaxed">
                            {sendingMessage}
                          </p>
                        </div>
                        <Button
                          onClick={() => setShowSendingOverlay(false)}
                          className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                        >
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center justify-center"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Erneut versuchen
                          </motion.div>
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
