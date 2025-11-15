'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function CookieRichtliniePage() {
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
            Cookie-Richtlinie
          </h1>

          <div className="space-y-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                1. Was sind Cookies?
              </h2>
              <p>
                Cookies sind kleine Textdateien, die auf Ihrem Gerät (Computer, Tablet oder Smartphone) gespeichert werden, 
                wenn Sie unsere Website besuchen. Sie ermöglichen es uns, Ihre Präferenzen zu speichern und Ihre Erfahrung 
                auf unserer Website zu personalisieren.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                2. Arten von Cookies
              </h2>
              <p>Wir verwenden die folgenden Arten von Cookies:</p>
              <ul className="list-disc pl-8 space-y-2">
                <li>
                  <strong>Notwendige Cookies:</strong> Diese sind erforderlich für die Funktionalität unserer Website, 
                  z.B. für Sicherheit und Benutzeranmeldung.
                </li>
                <li>
                  <strong>Funktionale Cookies:</strong> Diese ermöglichen es uns, sich an Ihre Einstellungen zu erinnern 
                  und Ihre Erfahrung zu verbessern.
                </li>
                <li>
                  <strong>Analytische Cookies:</strong> Diese helfen uns zu verstehen, wie Besucher unsere Website nutzen, 
                  damit wir diese ständig verbessern können.
                </li>
                <li>
                  <strong>Marketing Cookies:</strong> Diese werden verwendet, um Ihnen relevante Anzeigen und 
                  personalisierten Inhalten zu zeigen.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                3. Cookies auf unserer Website
              </h2>
              <p>
                Unsere Website verwendet folgende Cookies:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li><strong>Sitzungs-Cookies:</strong> Werden beim Schließen Ihres Browsers gelöscht</li>
                <li><strong>Persistente Cookies:</strong> Bleiben auf Ihrem Gerät für einen festgelegten Zeitraum</li>
                <li><strong>Third-Party Cookies:</strong> Von Dritten (z.B. Google Analytics) platziert</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                4. Ihre Kontrolle über Cookies
              </h2>
              <p>
                Sie können Ihre Cookie-Präferenzen in Ihrem Browser verwalten. Die meisten Browser ermöglichen es Ihnen, 
                Cookies abzulehnen oder Sie zu benachrichtigen, wenn Cookies gespeichert werden. Sie können auch Cookies 
                manuell aus Ihrem Browser löschen. Bitte beachten Sie, dass das Deaktivieren von Cookies die Funktionalität 
                unserer Website beeinträchtigen kann.
              </p>
              <p className="mt-4">
                Für mehr Informationen über Cookie-Verwaltung besuchen Sie bitte:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li>
                  <a href="https://www.aboutcookies.org/" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700">
                    www.aboutcookies.org
                  </a>
                </li>
                <li>
                  <a href="https://www.allaboutcookies.org/" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700">
                    www.allaboutcookies.org
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                5. Datenschutz
              </h2>
              <p>
                Die Nutzung von Cookies unterliegt unserer Datenschutzerklärung. Bitte lesen Sie diese für weitere 
                Informationen darüber, wie wir Ihre persönlichen Daten verarbeiten und schützen.
              </p>
              <p className="mt-4">
                <Link href="/privacy" className="text-orange-600 hover:text-orange-700">
                  Zur Datenschutzerklärung →
                </Link>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                6. Änderungen dieser Cookie-Richtlinie
              </h2>
              <p>
                Wir können diese Cookie-Richtlinie jederzeit aktualisieren. Bitte besuchen Sie diese Seite regelmäßig, 
                um über Änderungen informiert zu bleiben. Die letzte Aktualisierung dieser Richtlinie erfolgte im November 2025.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                7. Kontakt
              </h2>
              <p>
                Wenn Sie Fragen zu dieser Cookie-Richtlinie haben, kontaktieren Sie uns bitte unter:<br/>
                <strong>E-Mail:</strong> seilerstubbwiesbaden@gmail.com<br/>
                <strong>Telefon:</strong> +49 611 36004940<br/>
                <strong>Adresse:</strong> Seilerpfad 4, 65205 Wiesbaden, Deutschland
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
