'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function PrivacyPage() {
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
            Datenschutzerklärung
          </h1>

          <div className="space-y-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                1. Verantwortlicher
              </h2>
              <p>
                Verantwortlicher für die Verarbeitung personenbezogener Daten gemäß DSGVO ist:<br/>
                <strong>Jagroop Kaur</strong><br/>
                <strong>Seilerstubb Restaurant</strong><br/>
                Seilerpfad 4<br/>
                65205 Wiesbaden<br/>
                Deutschland<br/>
                <strong>Telefon:</strong> +49 611 36004940<br/>
                <strong>E-Mail:</strong> seilerstubbwiesbaden@gmail.com
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                2. Erhebung und Verarbeitung personenbezogener Daten
              </h2>
              <p>
                Wir erheben und verarbeiten personenbezogene Daten nur in dem Umfang, wie es für den Betrieb 
                unseres Restaurants und unserer Website erforderlich ist. Dies umfasst insbesondere:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li>Reservierungsdaten (Name, Telefon, E-Mail, Anzahl der Gäste, Reservierungszeitpunkt)</li>
                <li>Kontaktdaten bei Anfragen über die Website (Name, E-Mail, Telefon, Nachrichteninhalt)</li>
                <li>Authentifizierungsdaten für Benutzerkonten</li>
                <li>Cookies und Tracking-Daten zur Verbesserung der Website-Erfahrung</li>
                <li>IP-Adresse und Browser-Informationen für analytische Zwecke</li>
                <li>Newsletter-Anmeldedaten (falls zutreffend)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                3. Zweck der Verarbeitung
              </h2>
              <p>
                Die Verarbeitung personenbezogener Daten erfolgt zu folgenden Zwecken:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li>Durchführung und Verwaltung von Tischreservierungen</li>
                <li>Kommunikation mit Gästen bezüglich Reservierungen und Anfragen</li>
                <li>Bereitstellung eines Benutzerkonto-Services für Online-Reservierungen</li>
                <li>Versand von Bestätigungen, Erinnerungen und Updates</li>
                <li>Verbesserung unserer Website-Funktionalität und Benutzerfreundlichkeit</li>
                <li>Analyse von Website-Nutzung durch Cookies und ähnliche Technologien</li>
                <li>Erfüllung rechtlicher Verpflichtungen (z.B. Buchhaltung, Steuern)</li>
                <li>Versand von Newsletter und Angeboten (nur mit expliziter Zustimmung)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                4. Rechtsgrundlage der Verarbeitung
              </h2>
              <p>
                Die Verarbeitung personenbezogener Daten erfolgt auf Grundlage folgender Rechtsgrundlagen:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li><strong>Art. 6 Abs. 1 lit. a) DSGVO:</strong> Verarbeitung mit Ihrer ausdrücklichen Zustimmung</li>
                <li><strong>Art. 6 Abs. 1 lit. b) DSGVO:</strong> Verarbeitung zur Erfüllung eines Vertrags (Reservierungen)</li>
                <li><strong>Art. 6 Abs. 1 lit. c) DSGVO:</strong> Verarbeitung zur Erfüllung rechtlicher Verpflichtungen</li>
                <li><strong>Art. 6 Abs. 1 lit. f) DSGVO:</strong> Verarbeitung zur Wahrung berechtigter Interessen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                5. Speicherdauer
              </h2>
              <p>
                Personenbezogene Daten werden nur so lange gespeichert, wie es für die genannten Zwecke erforderlich ist:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li><strong>Reservierungsdaten:</strong> Werden 3 Jahre nach der Reservierung gespeichert (Aufbewahrungsfrist)</li>
                <li><strong>Kontaktformular-Daten:</strong> Werden bis zur Beantwortung und für 2 Jahre darüber hinaus gespeichert</li>
                <li><strong>Cookies:</strong> Unterschiedliche Gültigkeitsdauer je nach Cookie-Art (siehe Cookie-Richtlinie)</li>
                <li><strong>Benutzerkonten:</strong> Werden für die Dauer des Kontos gespeichert, können aber jederzeit gelöscht werden</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                6. Betroffenenrechte
              </h2>
              <p>
                Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li><strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Recht zu erfahren, welche Daten von Ihnen verarbeitet werden</li>
                <li><strong>Berichtigungsrecht (Art. 16 DSGVO):</strong> Recht auf Korrektur unrichtiger Daten</li>
                <li><strong>Löschungsrecht (Art. 17 DSGVO):</strong> Recht auf Löschung von Daten unter bestimmten Bedingungen</li>
                <li><strong>Recht auf Einschränkung (Art. 18 DSGVO):</strong> Recht zur Einschränkung der Verarbeitung</li>
                <li><strong>Datenportabilität (Art. 20 DSGVO):</strong> Recht, Daten in strukturiertem Format zu erhalten</li>
                <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Recht, der Verarbeitung zu widersprechen</li>
                <li><strong>Beschwerderecht:</strong> Recht, sich an eine Datenschutzbehörde zu beschweren</li>
              </ul>
              <p className="mt-4">
                Um diese Rechte auszuüben, kontaktieren Sie uns bitte unter: seilerstubbwiesbaden@gmail.com oder +49 611 36004940
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                7. Datensicherheit
              </h2>
              <p>
                Wir treffen umfassende technische und organisatorische Maßnahmen zum Schutz Ihrer personenbezogenen Daten:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li>Verschlüsselung von Datenübertragungen (SSL/TLS)</li>
                <li>Sichere Authentifizierung für Benutzerkonten</li>
                <li>Regelmäßige Sicherheitsupdates und Patches</li>
                <li>Zugriffskontrolle und Berechtigungssysteme</li>
                <li>Backup und Datensicherung</li>
                <li>Einhaltung der Industrie-Best-Practices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                8. Cookies und Tracking
              </h2>
              <p>
                Unsere Website verwendet Cookies zur Verbesserung der Benutzerfreundlichkeit. Für weitere Informationen 
                über die Arten von Cookies, die wir verwenden, und wie Sie diese verwalten können, lesen Sie bitte unsere 
                <Link href="/cookie-richtlinie" className="text-orange-600 hover:text-orange-700 ml-1">
                  Cookie-Richtlinie
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                9. Weitergabe von Daten an Dritte
              </h2>
              <p>
                Wir geben Ihre personenbezogenen Daten nicht an Dritte weiter, es sei denn:
              </p>
              <ul className="list-disc pl-8 space-y-2">
                <li>Sie haben ausdrücklich zugestimmt</li>
                <li>Wir sind rechtlich dazu verpflichtet</li>
                <li>Es ist notwendig für die Erbringung unserer Services (z.B. Payment-Provider)</li>
                <li>Wir haben ein berechtigtes Interesse</li>
              </ul>
              <p className="mt-4">
                Unsere Service-Provider (wie Payment-Prozessoren und Hosting-Anbieter) unterliegen streng vertraglichen 
                Datenschutzverpflichtungen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                10. Internationale Datenübertragungen
              </h2>
              <p>
                Sofern Ihre Daten in Länder außerhalb der EU übertragen werden, garantieren wir einen angemessenen Schutz 
                durch entsprechende Garantien wie Standard-Datenschutzklauseln oder Adequanzybeschlüsse.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                11. Kontakt zum Datenschutz
              </h2>
              <p>
                Bei Fragen oder Bedenken zur Verarbeitung Ihrer personenbezogenen Daten kontaktieren Sie uns bitte unter:<br/>
                <strong>Name:</strong> Jagroop Kaur<br/>
                <strong>E-Mail:</strong> seilerstubbwiesbaden@gmail.com<br/>
                <strong>Telefon:</strong> +49 611 36004940<br/>
                <strong>Adresse:</strong> Seilerpfad 4, 65205 Wiesbaden, Deutschland
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                12. Beschwerde bei Behörden
              </h2>
              <p>
                Sie haben das Recht, sich bei der zuständigen Datenschutzbehörde zu beschweren. Die zuständige Behörde 
                ist das Hessische Datenschutzbüro (Hessische Datenschutzbeauftragte) in Wiesbaden.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                13. Änderungen dieser Datenschutzerklärung
              </h2>
              <p>
                Wir behalten uns das Recht vor, diese Datenschutzerklärung jederzeit anzupassen. Die aktuelle Fassung 
                wird immer auf dieser Seite veröffentlicht. Letzte Aktualisierung: November 2025.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
