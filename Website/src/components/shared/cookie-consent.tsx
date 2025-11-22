'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always necessary
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const savedPreferences = localStorage.getItem('cookie_preferences');
    if (!savedPreferences) {
      // Show banner only if no preferences are set
      setShowBanner(true);
    } else {
      // Load existing preferences
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (e) {
        setShowBanner(true);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allPreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem('cookie_preferences', JSON.stringify(allPreferences));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setPreferences(allPreferences);
    setShowBanner(false);
  };

  const handleDeclineAll = () => {
    const minimalPreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    localStorage.setItem('cookie_preferences', JSON.stringify(minimalPreferences));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setPreferences(minimalPreferences);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookie_preferences', JSON.stringify(preferences));
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShowBanner(false);
  };

  const togglePreference = (key: 'functional' | 'analytics' | 'marketing') => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end pointer-events-none">
      <div className="w-full pointer-events-auto">
        {/* Semi-transparent overlay - only on cookie banner area */}
        <div 
          className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm h-96 pointer-events-auto transition-opacity duration-300"
          onClick={handleDeclineAll}
        />
        
        {/* Cookie Banner */}
        <div className="bg-white rounded-t-2xl shadow-2xl border-t-4 border-orange-600 animate-in slide-in-from-bottom-4 duration-300 relative z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Close Button */}
            <button
              onClick={handleDeclineAll}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Title and Description */}
            <h2 className="text-xl font-bold text-slate-900 mb-3 pr-8" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              🍪 Cookie-Einstellungen
            </h2>
            
            <p className="text-sm text-slate-700 mb-6 leading-relaxed">
              Wir verwenden Cookies, um Ihre Erfahrung auf unserer Website zu verbessern. Mit Ihrer Zustimmung verwenden 
              wir auch Cookies für Analytics und Marketing, um unsere Services zu optimieren. Sie können Ihre Einstellungen 
              jederzeit anpassen. Weitere Informationen finden Sie in unserer{' '}
              <Link href="/cookie-richtlinie" className="text-orange-600 hover:text-orange-700 font-semibold underline">
                Cookie-Richtlinie
              </Link>
              .
            </p>

            {/* Cookie Categories */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-900">
                    ✓ Notwendige Cookies
                  </label>
                  <p className="text-xs text-slate-600 mt-1">
                    Erforderlich für Website-Sicherheit und Funktionalität
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.necessary}
                  disabled
                  className="w-5 h-5 accent-orange-600 cursor-not-allowed"
                />
              </div>

              <hr className="border-gray-200" />

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-900">
                    Funktionale Cookies
                  </label>
                  <p className="text-xs text-slate-600 mt-1">
                    Merken Sie sich Ihre Einstellungen und Voreinstellungen
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={() => togglePreference('functional')}
                  className="w-5 h-5 accent-orange-600 cursor-pointer"
                />
              </div>

              <hr className="border-gray-200" />

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-900">
                    Analytische Cookies
                  </label>
                  <p className="text-xs text-slate-600 mt-1">
                    Helfen uns zu verstehen, wie Besucher unsere Website nutzen
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={() => togglePreference('analytics')}
                  className="w-5 h-5 accent-orange-600 cursor-pointer"
                />
              </div>

              <hr className="border-gray-200" />

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-900">
                    Marketing Cookies
                  </label>
                  <p className="text-xs text-slate-600 mt-1">
                    Zeigen Sie relevante Anzeigen und personalisierte Inhalte
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={() => togglePreference('marketing')}
                  className="w-5 h-5 accent-orange-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button
                onClick={handleDeclineAll}
                variant="outline"
                className="text-slate-700 border-slate-300 hover:bg-slate-50"
              >
                Alle Ablehnen
              </Button>
              
              <Button
                onClick={handleSavePreferences}
                className="bg-slate-600 hover:bg-slate-700 text-white"
              >
                Einstellungen Speichern
              </Button>
              
              <Button
                onClick={handleAcceptAll}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Alle Akzeptieren
              </Button>
            </div>

            {/* Footer Link */}
            <p className="text-xs text-slate-500 text-center mt-4">
              Durch das Fortfahren stimmen Sie unseren{' '}
              <Link href="/privacy" className="text-orange-600 hover:text-orange-700 underline">
                Datenschutzbestimmungen
              </Link>
              {' '}zu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
