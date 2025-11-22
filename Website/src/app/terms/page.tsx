'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function TermsPage() {
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
            Nutzungsbedingungen
          </h1>

          <div className="space-y-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                1. Allgemein
              </h2>
              <p>
                Diese Nutzungsbedingungen regeln die Nutzung der Website und der mobilen Anwendung von Seilerstubb Restaurant. 
                Durch die Nutzung unserer Website und Services akzeptieren Sie diese Bedingungen. Wenn Sie nicht einverstanden sind, 
                verwenden Sie bitte unsere Services nicht.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                2. Benutzerkonten
              </h2>
              <p>
                Wenn Sie ein Benutzerkonto erstellen, sind Sie für die Vertraulichkeit Ihres Passworts verantwortlich. 
                Sie verpflichten sich, keine Kontoinformationen an Dritte weiterzugeben und alle unautorisierten Zugriffsversuche 
                sofort zu melden. Sie tragen volle Verantwortung für alle Aktivitäten unter Ihrem Konto.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                3. Benutzerverhalten
              </h2>
              <p>
                Sie verpflichten sich nicht zu:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li>Illegalen oder schädlichen Aktivitäten zu beteiligen</li>
                <li>Malware, Viren oder andersartige schädliche Code zu verbreiten</li>
                <li>Das Urheberrecht oder andere Rechte Dritter zu verletzen</li>
                <li>Belästigung, Bedrohungen oder Hassreden gegen andere zu begehen</li>
                <li>Spamming oder Phishing-Aktivitäten durchzuführen</li>
                <li>Unser System zu hacken oder zu manipulieren</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                4. Inhaltsverantwortung
              </h2>
              <p>
                Der Inhalt auf unserer Website dient nur zu Informationszwecken. Wir bemühen uns, die Genauigkeit unserer Inhalte 
                sicherzustellen, können aber keine Garantie für Fehlerfreiheit geben. Menüpreise und Verfügbarkeiten können sich jederzeit ändern.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                5. Einschränkung der Haftung
              </h2>
              <p>
                Seilerstubb haftet nicht für:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li>Indirekte, zufällige oder Folgeschäden</li>
                <li>Verlust von Daten oder Einnahmen</li>
                <li>Unterbrechung oder Fehler der Website</li>
                <li>Schäden durch externe Links oder Third-Party Services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                6. Verfügbarkeit des Services
              </h2>
              <p>
                Wir bemühen uns, unsere Website 24/7 verfügbar zu halten, können aber nicht garantieren, dass der Service 
                fehlerlos, unterbrechungsfrei oder frei von Sicherheitsmängeln ist. Wir können den Service jederzeit ändern 
                oder einstellen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                7. Geistiges Eigentum
              </h2>
              <p>
                Alle Inhalte auf unserer Website, einschließlich Text, Grafiken, Logos, Bilder und Software, sind 
                Eigentum von Seilerstubb oder unseren Lizenzbetreibern und sind durch internationale Urheberrechtsgesetze geschützt. 
                Unbefugte Vervielfältigung ist nicht gestattet.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                8. Links zu externen Websites
              </h2>
              <p>
                Unsere Website kann Links zu externen Websites enthalten. Wir sind nicht verantwortlich für den Inhalt 
                externer Websites. Das Folgen von Links erfolgt auf Ihre eigene Verantwortung.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                9. Beendigung
              </h2>
              <p>
                Wir behalten uns das Recht vor, Benutzerkonten zu beenden, wenn gegen diese Bedingungen verstoßen wird 
                oder wenn wir Grund zu der Annahme haben, dass die Nutzung illegal oder schädlich ist.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                10. Änderungen der Bedingungen
              </h2>
              <p>
                Wir behalten uns das Recht vor, diese Nutzungsbedingungen jederzeit zu ändern. Änderungen werden auf 
                dieser Seite veröffentlicht und sind ab dem Zeitpunkt der Veröffentlichung gültig.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                11. Anwendbares Recht
              </h2>
              <p>
                Diese Nutzungsbedingungen unterliegen den Gesetzen der Bundesrepublik Deutschland. 
                Gerichtsstand für alle Streitigkeiten ist Wiesbaden, Deutschland.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                12. Kontakt
              </h2>
              <p>
                Bei Fragen oder Bedenken bezüglich dieser Nutzungsbedingungen kontaktieren Sie uns unter:<br/>
                <strong>E-Mail:</strong> seilerstubbwiesbaden@gmail.com<br/>
                <strong>Telefon:</strong> +49 611 36004940<br/>
                <strong>Adresse:</strong> Seilerpfad 4, 65205 Wiesbaden, Deutschland
              </p>
            </section>

            <section>
              <p className="text-sm text-slate-500 mt-8 pt-8 border-t border-slate-200">
                Letzte Aktualisierung: November 2025
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
