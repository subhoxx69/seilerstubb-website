'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, Mail, Lock, Send, ArrowRight, User, Phone, FileText } from 'lucide-react';
import Link from 'next/link';

const STORAGE_KEY = 'contact_form_data';

interface FormDataType {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  text: string;
}

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SignInModal({ isOpen, onClose }: SignInModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Authentifizierung erforderlich
          </h2>
        </div>
        <p className="mb-8 text-gray-600 leading-relaxed">
          Melden Sie sich an, um das Kontaktformular zu nutzen und Ihre Nachrichten zu verwalten.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 rounded-lg"
          >
            Abbrechen
          </Button>
          <Link href="/auth/signin" className="flex-1">
            <Button className="w-full rounded-lg">
              Anmelden
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const { user, firebaseUser, isLoading } = useAuth();
  const router = useRouter();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [formData, setFormData] = useState<FormDataType>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    text: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved form data from localStorage and populate with user info
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load from localStorage
    const savedData = localStorage.getItem(STORAGE_KEY);
    let loadedData: FormDataType = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      subject: '',
      text: '',
    };

    if (savedData) {
      try {
        loadedData = JSON.parse(savedData);
      } catch (e) {
        console.error('Failed to parse saved form data:', e);
      }
    }

    // Load saved phone number for autofill
    const savedPhone = localStorage.getItem('contact_phone_autofill');
    if (savedPhone) {
      try {
        const phoneData = JSON.parse(savedPhone);
        if (phoneData.phone && !loadedData.phone) {
          loadedData.phone = phoneData.phone;
        }
      } catch (e) {
        console.error('Failed to parse saved phone data:', e);
      }
    }

    // If user is logged in, merge account info with saved data
    if (user && firebaseUser) {
      const displayName = firebaseUser.displayName || '';
      const nameParts = displayName.split(' ');
      const email = firebaseUser.email || '';

      // Only update if localStorage doesn't have values, to preserve user's saved data
      if (!loadedData.firstName && nameParts[0]) {
        loadedData.firstName = nameParts[0];
      }
      if (!loadedData.lastName && nameParts.length > 1) {
        loadedData.lastName = nameParts.slice(1).join(' ');
      }
      if (!loadedData.email && email) {
        loadedData.email = email;
      }
    }

    setFormData(loadedData);
    setIsHydrated(true);
  }, [user, firebaseUser]);

  useEffect(() => {
    console.log(`Contact page - isLoading: ${isLoading}, user: ${user ? 'exists' : 'null'}`);
    
    // Only show modal if loading is done AND user is not authenticated
    if (!isLoading) {
      if (!user) {
        console.log('📍 No user found, showing sign-in modal');
        setShowSignInModal(true);
      } else {
        console.log('✅ User authenticated, hiding sign-in modal');
        setShowSignInModal(false);
      }
    } else {
      console.log('⏳ Still loading, not showing modal yet');
    }
  }, [isLoading, user]);

  const handleSignInModalClose = () => {
    setShowSignInModal(false);
    router.push('/');
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // Auto-save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFormData));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user || !firebaseUser) {
      setShowSignInModal(true);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage('');

    try {
      console.log('📝 Form submission started');
      console.log(`   User: ${firebaseUser.email}`);
      console.log(`   Name: ${formData.firstName} ${formData.lastName}`);
      
      const token = await firebaseUser.getIdToken();
      console.log('✅ ID token obtained');

      const payload = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        text: formData.text,
      };
      
      console.log('📤 Sending request to /api/contact/start-or-append');
      console.log(`   Payload:`, payload);

      const response = await fetch('/api/contact/start-or-append', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log(`   Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API error response:', errorData);
        throw new Error(errorData.error || 'Failed to send message');
      }

      const responseData = await response.json();
      console.log('✅ Message sent successfully');
      console.log(`   Thread ID: ${responseData.threadId}`);
      console.log(`   Message ID: ${responseData.messageId}`);

      setSubmitStatus('success');
      
      // ✅ ONLY clear subject and text after backend confirms success
      // Keep user details (firstName, lastName, email, phone) in localStorage
      if (typeof window !== 'undefined') {
        // Save phone number for autofill
        const phoneStorage = { phone: formData.phone };
        localStorage.setItem('contact_phone_autofill', JSON.stringify(phoneStorage));
        
        // Clear ONLY subject and text, keep other user details
        const clearedFormData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          subject: '', // ✅ CLEAR subject
          text: '', // ✅ CLEAR text
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clearedFormData));
        
        console.log('🧹 Cleared subject and text from localStorage after successful submission');
      }

      setTimeout(() => {
        // Redirect to messages page with the new thread ID as query parameter
        router.push(`/contact/messages?threadId=${responseData.threadId}`);
      }, 2000);
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      setSubmitStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'An error occurred'
      );
      // ❌ DO NOT clear subject and text if there was an error
      console.log('⚠️ Form submission failed - subject and text NOT cleared');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary mx-auto"></div>
          <p className="text-gray-600 font-medium">Wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SignInModal
        isOpen={showSignInModal}
        onClose={handleSignInModalClose}
      />

      <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-16 px-4 transition-all duration-300 ${isLoading || !user ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="mx-auto max-w-3xl">
          {/* Header Section */}
          <div className="mb-12 text-center animate-in fade-in slide-in-from-top-6 duration-500">
            <div className="mb-6 flex justify-center">
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl backdrop-blur-sm border border-primary/10">
                <Mail className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="mb-3 text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Kontaktieren Sie uns
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
              Senden Sie uns Ihre Anfrage, und unser Team antwortet Ihnen so bald wie möglich. Wir schätzen Ihre Kommunikation.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="bg-gradient-to-r from-primary/5 via-primary/2 to-transparent p-8 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Kontaktformular</h2>
              <p className="text-sm text-gray-600 mt-2">Alle Felder sind erforderlich</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-7">
              {/* Name Fields */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide opacity-75">Persönliche Informationen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-900 mb-2.5">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span>Vorname</span>
                        <span className="text-red-500">*</span>
                      </div>
                    </label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="z.B. Max"
                      required
                      minLength={2}
                      disabled={isSubmitting || !user}
                      className={`w-full rounded-lg border-2 transition-all duration-200 py-2.5 px-4 focus:ring-0 ${
                        focusedField === 'firstName'
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                  </div>

                  <div className="group">
                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-900 mb-2.5">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span>Nachname</span>
                        <span className="text-red-500">*</span>
                      </div>
                    </label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('lastName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="z.B. Mustermann"
                      required
                      minLength={2}
                      disabled={isSubmitting || !user}
                      className={`w-full rounded-lg border-2 transition-all duration-200 py-2.5 px-4 focus:ring-0 ${
                        focusedField === 'lastName'
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Email and Phone */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide opacity-75">Kontaktdaten</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2.5">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <span>E-Mail</span>
                        <span className="text-red-500">*</span>
                      </div>
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="max@beispiel.de"
                      required
                      disabled={isSubmitting || !user}
                      className={`w-full rounded-lg border-2 transition-all duration-200 py-2.5 px-4 focus:ring-0 ${
                        focusedField === 'email'
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                  </div>

                  <div className="group">
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2.5">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span>Telefon</span>
                        <span className="text-red-500">*</span>
                      </div>
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="+49 123 456789"
                      required
                      minLength={3}
                      disabled={isSubmitting || !user}
                      className={`w-full rounded-lg border-2 transition-all duration-200 py-2.5 px-4 focus:ring-0 ${
                        focusedField === 'phone'
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide opacity-75">Nachrichteninhalt</h3>
                <div className="group mb-7">
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-900 mb-2.5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>Betreff</span>
                      <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('subject')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Ihr Betreff hier..."
                    required
                    minLength={3}
                    disabled={isSubmitting || !user}
                    className={`w-full rounded-lg border-2 transition-all duration-200 py-2.5 px-4 focus:ring-0 ${
                      focusedField === 'subject'
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                </div>

                <div className="group">
                  <label htmlFor="text" className="block text-sm font-semibold text-gray-900 mb-2.5">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>Nachricht</span>
                      <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <Textarea
                    id="text"
                    name="text"
                    value={formData.text}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('text')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Schreiben Sie Ihre Nachricht hier... (max 5000 Zeichen)"
                    required
                    maxLength={5000}
                    disabled={isSubmitting || !user}
                    className={`w-full h-40 rounded-lg border-2 transition-all duration-200 py-2.5 px-4 resize-none focus:ring-0 ${
                      focusedField === 'text'
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                  <div className="mt-3 flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      {formData.text.length}/5000 Zeichen
                    </p>
                    <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300"
                        style={{ width: `${(formData.text.length / 5000) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              {submitStatus === 'success' && (
                <div className="flex gap-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4 border border-green-200 animate-in fade-in slide-in-from-top-3 duration-300">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 text-sm">Nachricht gesendet!</h3>
                    <p className="text-sm text-green-800 mt-1">
                      Danke für Ihre Nachricht. Sie werden gleich zu Ihren Nachrichten weitergeleitet.
                    </p>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="flex gap-4 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 p-4 border border-red-200 animate-in fade-in slide-in-from-top-3 duration-300">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 text-sm">Fehler beim Senden</h3>
                    <p className="text-sm text-red-800 mt-1">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || !user || submitStatus === 'success'}
                  className="w-full rounded-lg py-2.5 font-semibold text-base group relative overflow-hidden hover:shadow-lg transition-all duration-300"
                  size="lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent group-hover:translate-x-full transition-transform duration-500" />
                  <div className="flex items-center justify-center gap-2 relative">
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Wird gesendet...</span>
                      </>
                    ) : submitStatus === 'success' ? (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Gesendet! Weiterleitung läuft...</span>
                      </>
                    ) : (
                      <>
                        <span>Nachricht senden</span>
                        <Send className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </Button>
              </div>

              {/* Info Text */}
              <p className="text-center text-xs text-gray-500 leading-relaxed">
                Mit dem Senden akzeptieren Sie unsere <Link href="/privacy" className="text-primary hover:underline">Datenschutzerklärung</Link>
              </p>
            </form>
          </div>

          {/* Links Section */}
          {user && (
            <div className="mt-12 text-center animate-in fade-in delay-300 duration-500">
              <Link
                href="/contact/messages"
                className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all duration-200 group"
              >
                <span>Meine Nachrichten ansehen</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
