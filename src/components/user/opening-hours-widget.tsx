'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Clock, MapPin, Phone, Mail, Truck } from 'lucide-react';
import type { NormalizedOpeningHours } from '@/lib/opening-hours-service';

interface WidgetData extends NormalizedOpeningHours {
  lieferung?: { start: string; end: string };
  abholung?: { start: string; end: string };
}

export default function OpeningHoursWidget() {
  const [hours, setHours] = useState<WidgetData | null>(null);
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHours = async () => {
      try {
        const response = await fetch('/api/opening-hours');
        if (!response.ok) throw new Error('Failed to fetch');
        const hoursData: WidgetData = await response.json();
        setHours(hoursData);

        // Check if open now
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: hoursData.timezone });
        const dayName = formatter.format(now).toLowerCase();
        const dayKey = dayName.slice(0, 3) as 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
        
        const timeFormatter = new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: hoursData.timezone,
        });
        const currentTime = timeFormatter.format(now).replace(' ', '');

        const schedule = hoursData.week[dayKey];
        let open = false;
        if (!schedule.closed) {
          open = schedule.intervals.some(interval => currentTime >= interval.start && currentTime < interval.end);
        }
        setIsOpen(open);
      } catch (error) {
        console.error('Error loading hours:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHours();
    // Refresh every minute to update open/closed status
    const interval = setInterval(loadHours, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !hours) {
    return null;
  }

  const dayLabels = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Öffnungszeiten */}
      <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-0 text-white overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/10 rounded-lg">
              <Clock className="w-6 h-6 text-blue-100" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Öffnungszeiten</h3>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                <p className={`text-sm font-semibold ${isOpen ? 'text-emerald-300' : 'text-red-300'}`}>
                  {isOpen ? 'Geöffnet' : 'Geschlossen'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {dayKeys.map((dayKey, index) => {
              const schedule = hours.week[dayKey];
              return (
                <div key={dayKey} className="text-sm">
                  <p className="text-blue-200">{dayLabels[index]}</p>
                  {schedule.closed ? (
                    <p className="font-bold text-red-400">Geschlossen</p>
                  ) : (
                    <p className="font-bold text-blue-100">
                      {schedule.intervals.map(iv => `${iv.start} - ${iv.end}`).join(' / ')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Lieferung */}
      <Card className="bg-gradient-to-br from-orange-900 to-orange-800 border-0 text-white overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/10 rounded-lg">
              <Truck className="w-6 h-6 text-orange-100" />
            </div>
            <h3 className="text-xl font-bold">Lieferung</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-orange-700/50 rounded-lg p-3">
              <p className="text-orange-200 text-sm mb-1">Lieferzeiten</p>
              <p className="text-2xl font-bold text-orange-100">
                {hours.lieferung?.start} - {hours.lieferung?.end}
              </p>
            </div>

            <div>
              <p className="text-orange-200 text-sm">Mindestbestellung</p>
              <p className="text-lg font-bold text-orange-100">Ab €15.00</p>
            </div>

            <div>
              <p className="text-orange-200 text-sm">Liefergebühr</p>
              <p className="text-lg font-bold text-orange-100">€2.00</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Abholung */}
      <Card className="bg-gradient-to-br from-emerald-900 to-emerald-800 border-0 text-white overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/10 rounded-lg">
              <MapPin className="w-6 h-6 text-emerald-100" />
            </div>
            <h3 className="text-xl font-bold">Abholung</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-emerald-700/50 rounded-lg p-3">
              <p className="text-emerald-200 text-sm mb-1">Abholzeiten</p>
              <p className="text-2xl font-bold text-emerald-100">
                {hours.abholung?.start} - {hours.abholung?.end}
              </p>
            </div>

            <div>
              <p className="text-emerald-200 text-sm">Mindestbestellung</p>
              <p className="text-lg font-bold text-emerald-100">Keine Mindestbestellung</p>
            </div>

            <div>
              <p className="text-emerald-200 text-sm">Gebühr</p>
              <p className="text-lg font-bold text-emerald-100">Kostenlos</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
