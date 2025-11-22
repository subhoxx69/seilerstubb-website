'use client';

import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

interface MaintenancePageProps {
  message: string;
  estimatedEndTime: string;
}

export default function MaintenancePage({
  message,
  estimatedEndTime,
}: MaintenancePageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo/Restaurant Name */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-amber-500 mb-2">Seilerstubb</h1>
          <p className="text-amber-400 text-sm font-semibold">Restaurant</p>
        </div>

        {/* Maintenance Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Maintenance Message */}
        <div className="mb-8 space-y-4">
          <h2 className="text-3xl font-bold text-amber-50">
            Wartungsarbeiten im Gange
          </h2>
          <p className="text-amber-100 leading-relaxed text-base font-medium">
            {message ||
              'Wir führen gerade Wartungsarbeiten durch, um Ihr Erlebnis zu verbessern.'}
          </p>

          {/* Estimated Time */}
          <div className="flex items-center justify-center gap-3 text-amber-100 mt-6 p-4 bg-amber-900/30 rounded-lg border border-amber-700/50">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm text-amber-200">Voraussichtlich wieder online:</p>
              <p className="font-semibold text-amber-50">
                {estimatedEndTime || 'Innerhalb von 24 Stunden'}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-amber-900/20 rounded-lg p-6 mb-8 border border-amber-700/50">
          <h3 className="text-amber-50 font-semibold mb-3">Vielen Dank für Ihre Geduld!</h3>
          <ul className="text-amber-200 text-sm space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5 flex-shrink-0">✓</span>
              <span>Wir arbeiten hart daran, um Ihnen besser zu dienen</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5 flex-shrink-0">✓</span>
              <span>Schauen Sie bald vorbei für Updates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5 flex-shrink-0">✓</span>
              <span>Bei dringenden Anliegen kontaktieren Sie uns bitte</span>
            </li>
          </ul>
        </div>

        {/* Contact Information */}
        <div className="text-amber-200 text-sm space-y-2 mb-6">
          <p className="font-medium">Bei Fragen erreichen Sie uns unter:</p>
          <a
            href="mailto:seilerstubbwiesbaden@gmail.com"
            className="text-amber-300 hover:text-amber-200 transition-colors font-semibold block"
          >
            seilerstubbwiesbaden@gmail.com
          </a>
          <p className="text-amber-300">
            <a href="tel:+49611360040" className="hover:text-amber-200 transition-colors">
              +49 (0) 611 36004940
            </a>
          </p>
        </div>

        {/* Reservation Button */}
        <div className="mb-6">
          <a
            href="https://www.foodbooking.com/ordering/restaurant/menu/reservation?restaurant_uid=31149346-af52-4018-96cc-cc5665f1c55b&reservation=true"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 active:scale-95"
          >
            📅 Tisch reservieren
          </a>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-amber-700/50">
          <p className="text-amber-600 text-xs">
            © {new Date().getFullYear()} Seilerstubb Restaurant. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </div>
  );
}
