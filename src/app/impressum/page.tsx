'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function ImpressumPage() {
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
            Impressum
          </h1>

          <div className="space-y-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Angaben gemäß § 5 TMG
              </h2>
              <div className="space-y-2">
                <p className="font-semibold text-lg">Jagroop Kaur</p>
                <p className="font-semibold">Seilerstubb Restaurant</p>
                <p>Seilerpfad 4<br/>65205 Wiesbaden<br/>Deutschland</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Kontaktinformationen
              </h2>
              <div className="space-y-2">
                <p><strong>Name:</strong> Jagroop Kaur</p>
                <p><strong>Adresse:</strong> Seilerpfad 4, 65205 Wiesbaden, Deutschland</p>
                <p><strong>Telefon:</strong> +49 611 36004940</p>
                <p><strong>E-Mail:</strong> seilerstubbwiesbaden@gmail.com</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
              </h2>
              <p>
                <strong>Jagroop Kaur</strong><br/>
                Seilerpfad 4<br/>
                65205 Wiesbaden<br/>
                Deutschland
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Geschäftsbetrieb
              </h2>
              <p>
                Seilerstubb ist ein Restaurant, das sich auf die Zubereitung authentischer deutscher und indischer Küche spezialisiert hat. 
                Wir bieten Tischreservierungen, Speisen zum Mitnehmen und gelegentliche Catering-Services an.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Urheberrechte
              </h2>
              <p>
                Die Inhalte und Werke auf dieser Website sind urheberrechtlich geschützt. Die Vervielfältigung, Bearbeitung, 
                Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen 
                Zustimmung des Autors bzw. Erstellers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Haftungsausschluss
              </h2>
              <p>
                Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. 
                Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Streitbeilegung
              </h2>
              <p>
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit unter 
                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700">
                  https://ec.europa.eu/consumers/odr/
                </a>
                . Zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle ist der Betreiber dieser Website nicht verpflichtet.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
