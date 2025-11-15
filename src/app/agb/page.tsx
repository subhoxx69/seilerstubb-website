'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function AGBPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </Link>
        
        <div className="prose prose-lg max-w-none">
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-5xl font-bold text-slate-900 mb-8">
            Allgemeine Geschäftsbedingungen (AGB)
          </h1>

          <div className="space-y-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                1. Geltungsbereich
              </h2>
              <p>
                Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Leistungen des Restaurants Seilerstubb, 
                insbesondere für Reservierungen, Bestellungen und den Besuch des Restaurants.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                2. Reservierung
              </h2>
              <p>
                Reservierungen können telefonisch unter +49 611 36004940 oder per E-Mail unter 
                seilerstubbwiesbaden@gmail.com vorgenommen werden. Eine Bestätigung der Reservierung erfolgt auf Anfrage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                3. Stornierungsbedingungen
              </h2>
              <p>
                Reservierungen können kostenfrei bis 24 Stunden vor dem vereinbarten Termin storniert werden. 
                Bei Stornierungen mit weniger als 24 Stunden Vorlaufzeit kann eine Stornogebühr berechnet werden.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                4. Zahlungsbedingungen
              </h2>
              <p>
                Die Zahlung erfolgt vor Ort im Restaurant. Es werden alle gängigen Zahlungsmethoden akzeptiert. 
                Bei Reservierungen können Anzahlungen verlangt werden.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                5. Haftung
              </h2>
              <p>
                Das Restaurant Seilerstubb haftet nur für Schäden, die vorsätzlich oder grob fahrlässig verursacht wurden. 
                Für Gäste hinterlegte Gegenstände werden nicht auf Verlust oder Beschädigung hin übernommen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                6. Allergien und Unverträglichkeiten
              </h2>
              <p>
                Bitte teilen Sie dem Personal bei der Bestellung Allergien oder Unverträglichkeiten mit. 
                Das Restaurant bemüht sich, diese zu berücksichtigen, kann aber keine Garantie für die vollständige 
                Vermeidung von Allergenen übernehmen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                7. Änderungen der AGB
              </h2>
              <p>
                Das Restaurant behält sich das Recht vor, diese AGB jederzeit zu ändern. Änderungen werden 
                auf der Website veröffentlicht und sind ab dem Zeitpunkt der Veröffentlichung gültig.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                8. Anwendbares Recht
              </h2>
              <p>
                Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist Wiesbaden, Deutschland.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
