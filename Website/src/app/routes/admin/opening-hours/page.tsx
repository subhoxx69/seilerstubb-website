'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { Clock, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface TimeInterval {
  start: string;
  end: string;
}

interface DaySchedule {
  closed: boolean;
  intervals: TimeInterval[];
}

interface OpeningHoursData {
  timezone: string;
  reservationsEnabled: boolean;
  week: {
    mon: DaySchedule;
    tue: DaySchedule;
    wed: DaySchedule;
    thu: DaySchedule;
    fri: DaySchedule;
    sat: DaySchedule;
    sun: DaySchedule;
  };
  slot: {
    stepMinutes: number;
    minLeadMinutes: number;
    maxAdvanceDays: number;
  };
  lieferung: {
    active: boolean;
    leadTimeMinutes: number;
    intervals: TimeInterval[];
    minOrder?: number;
    fee?: number;
  };
  abholung: {
    active: boolean;
    leadTimeMinutes: number;
    intervals: TimeInterval[];
    minOrder?: number;
  };
}

const DAYS = [
  { key: 'mon', label: 'Mo', full: 'Monday' },
  { key: 'tue', label: 'Di', full: 'Tuesday' },
  { key: 'wed', label: 'Mi', full: 'Wednesday' },
  { key: 'thu', label: 'Do', full: 'Thursday' },
  { key: 'fri', label: 'Fr', full: 'Friday' },
  { key: 'sat', label: 'Sa', full: 'Saturday' },
  { key: 'sun', label: 'So', full: 'Sunday' },
];

export default function OpeningHoursPage() {
  const { firebaseUser } = useAuth();
  const [data, setData] = useState<OpeningHoursData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOpeningHours();
  }, []);

  const fetchOpeningHours = async () => {
    try {
      const response = await fetch('/api/opening-hours');
      const result = await response.json();
      
      // Normalize the data to ensure all required fields are present
      const normalizedData: OpeningHoursData = {
        timezone: result.timezone || 'Europe/Berlin',
        reservationsEnabled: result.reservationsEnabled !== false,
        week: result.week || {
          mon: { closed: true, intervals: [] },
          tue: { closed: false, intervals: [] },
          wed: { closed: false, intervals: [] },
          thu: { closed: false, intervals: [] },
          fri: { closed: false, intervals: [] },
          sat: { closed: false, intervals: [] },
          sun: { closed: true, intervals: [] },
        },
        slot: result.slot || { stepMinutes: 30, minLeadMinutes: 60, maxAdvanceDays: 60 },
        lieferung: {
          active: result.lieferung ? true : false,
          leadTimeMinutes: result.lieferung?.leadTimeMinutes || 0,
          intervals: result.lieferung?.windows || result.lieferung?.intervals || [{ start: '11:00', end: '22:00' }],
          minOrder: result.lieferung?.minOrder,
          fee: result.lieferung?.fee,
        },
        abholung: {
          active: result.abholung ? true : false,
          leadTimeMinutes: result.abholung?.leadTimeMinutes || 0,
          intervals: result.abholung?.windows || result.abholung?.intervals || [{ start: '11:00', end: '22:00' }],
          minOrder: result.abholung?.minOrder,
        },
      };
      
      setData(normalizedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching opening hours:', error);
      toast.error('Fehler beim Laden der Öffnungszeiten');
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    if (!firebaseUser || !data) return;

    setSaving(true);
    try {
      const token = await firebaseUser.getIdToken();
      
      // Transform data to backend format
      const backendData = {
        timezone: data.timezone,
        reservationsEnabled: data.reservationsEnabled,
        week: data.week,
        slot: data.slot,
        // Only include lieferung/abholung if active
        ...(data.lieferung.active && {
          lieferung: {
            leadTimeMinutes: data.lieferung.leadTimeMinutes,
            windows: data.lieferung.intervals,
            ...(data.lieferung.minOrder !== undefined && { minOrder: data.lieferung.minOrder }),
            ...(data.lieferung.fee !== undefined && { fee: data.lieferung.fee }),
          }
        }),
        ...(data.abholung.active && {
          abholung: {
            leadTimeMinutes: data.abholung.leadTimeMinutes,
            windows: data.abholung.intervals,
            ...(data.abholung.minOrder !== undefined && { minOrder: data.abholung.minOrder }),
          }
        }),
      };
      
      const response = await fetch('/api/opening-hours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(backendData),
      });

      console.log('Save response status:', response.status);
      console.log('Backend data sent:', JSON.stringify(backendData, null, 2));

      if (!response.ok) {
        let errorMessage = 'Fehler beim Speichern';
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || JSON.stringify(error);
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error('Backend error:', errorMessage);
        throw new Error(errorMessage);
      }

      setHasChanges(false);
      toast.success('Öffnungszeiten gespeichert!');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayKey: string) => {
    if (!data) return;
    setData(prev => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev));
      copy.week[dayKey].closed = !copy.week[dayKey].closed;
      setHasChanges(true);
      return copy;
    });
  };

  const addInterval = (dayKey: string) => {
    if (!data) return;
    setData(prev => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev));
      copy.week[dayKey].intervals.push({ start: '11:00', end: '22:00' });
      setHasChanges(true);
      return copy;
    });
  };

  const updateInterval = (dayKey: string, index: number, field: 'start' | 'end', value: string) => {
    if (!data) return;
    setData(prev => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev));
      copy.week[dayKey].intervals[index][field] = value;
      setHasChanges(true);
      return copy;
    });
  };

  const deleteInterval = (dayKey: string, index: number) => {
    if (!data) return;
    setData(prev => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev));
      copy.week[dayKey].intervals.splice(index, 1);
      setHasChanges(true);
      return copy;
    });
  };

  const updateSlotConfig = (field: keyof OpeningHoursData['slot'], value: number) => {
    if (!data) return;
    setData(prev => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev));
      copy.slot[field] = value;
      setHasChanges(true);
      return copy;
    });
  };

  const updateService = (service: 'lieferung' | 'abholung', field: string, value: any) => {
    if (!data) return;
    setData(prev => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev));
      copy[service][field] = value;
      setHasChanges(true);
      return copy;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Lädt...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-red-600 mb-2" />
          <p className="text-red-700">Fehler beim Laden der Öffnungszeiten</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">Öffnungszeiten & Verfügbarkeit</h1>
            </div>
            <p className="text-gray-600">Verwalten Sie die Öffnungszeiten und blockieren Sie Reservierungsdaten</p>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">Ungespeicherte Änderungen</span>
              </div>
            )}
            <button
              onClick={saveChanges}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Speichert...' : 'Speichern'}
            </button>
          </div>
        </div>

        {/* Settings & Services Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Slot Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">⚙️ Buchungseinstellungen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zeitschritte (Minuten)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={data.slot.stepMinutes}
                  onChange={(e) => updateSlotConfig('stepMinutes', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vorlaufzeit (Minuten)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1440"
                  value={data.slot.minLeadMinutes}
                  onChange={(e) => updateSlotConfig('minLeadMinutes', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximale Vorausbuchung (Tage)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={data.slot.maxAdvanceDays}
                  onChange={(e) => updateSlotConfig('maxAdvanceDays', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Lieferung */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">🚚 Lieferung</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.lieferung.active}
                  onChange={(e) => updateService('lieferung', 'active', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-600">Aktiviert</span>
              </label>
            </div>
            {data.lieferung.active && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vorlaufzeit (Min)
                  </label>
                  <input
                    type="number"
                    value={data.lieferung.leadTimeMinutes}
                    onChange={(e) => updateService('lieferung', 'leadTimeMinutes', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mindestbestellung (€)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={data.lieferung.minOrder || ''}
                    onChange={(e) => updateService('lieferung', 'minOrder', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="z.B. 15.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Liefergebühr (€)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={data.lieferung.fee || ''}
                    onChange={(e) => updateService('lieferung', 'fee', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="z.B. 2.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zeitfenster
                  </label>
                  <div className="space-y-2">
                    {data.lieferung.intervals.map((interval, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="time"
                          value={interval.start}
                          onChange={(e) => updateService('lieferung', 'intervals', 
                            data.lieferung.intervals.map((i, i2) => i2 === idx ? { ...i, start: e.target.value } : i)
                          )}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <span className="text-gray-500">bis</span>
                        <input
                          type="time"
                          value={interval.end}
                          onChange={(e) => updateService('lieferung', 'intervals',
                            data.lieferung.intervals.map((i, i2) => i2 === idx ? { ...i, end: e.target.value } : i)
                          )}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() => updateService('lieferung', 'intervals', 
                            data.lieferung.intervals.filter((_, i) => i !== idx)
                          )}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateService('lieferung', 'intervals', 
                        [...data.lieferung.intervals, { start: '11:00', end: '22:00' }]
                      )}
                      className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 text-sm py-2 border border-dashed border-blue-300 rounded"
                    >
                      <Plus className="w-4 h-4" />
                      Zeitfenster hinzufügen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Abholung */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">🏪 Abholung</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.abholung.active}
                  onChange={(e) => updateService('abholung', 'active', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-600">Aktiviert</span>
              </label>
            </div>
            {data.abholung.active && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vorlaufzeit (Min)
                  </label>
                  <input
                    type="number"
                    value={data.abholung.leadTimeMinutes}
                    onChange={(e) => updateService('abholung', 'leadTimeMinutes', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mindestbestellung (€)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={data.abholung.minOrder || ''}
                    onChange={(e) => updateService('abholung', 'minOrder', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="z.B. 0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zeitfenster
                  </label>
                  <div className="space-y-2">
                    {data.abholung.intervals.map((interval, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="time"
                          value={interval.start}
                          onChange={(e) => updateService('abholung', 'intervals', 
                            data.abholung.intervals.map((i, i2) => i2 === idx ? { ...i, start: e.target.value } : i)
                          )}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <span className="text-gray-500">bis</span>
                        <input
                          type="time"
                          value={interval.end}
                          onChange={(e) => updateService('abholung', 'intervals',
                            data.abholung.intervals.map((i, i2) => i2 === idx ? { ...i, end: e.target.value } : i)
                          )}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() => updateService('abholung', 'intervals', 
                            data.abholung.intervals.filter((_, i) => i !== idx)
                          )}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateService('abholung', 'intervals', 
                        [...data.abholung.intervals, { start: '11:00', end: '22:00' }]
                      )}
                      className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 text-sm py-2 border border-dashed border-blue-300 rounded"
                    >
                      <Plus className="w-4 h-4" />
                      Zeitfenster hinzufügen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">📅 Wochenplan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {DAYS.map(dayObj => (
              <div
                key={dayObj.key}
                className={`p-4 rounded-lg border-2 transition-all ${
                  !data.week[dayObj.key as keyof typeof data.week].closed
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{dayObj.label}</h3>
                  <button
                    onClick={() => toggleDay(dayObj.key)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      !data.week[dayObj.key as keyof typeof data.week].closed
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {!data.week[dayObj.key as keyof typeof data.week].closed ? 'Offen' : 'Geschlossen'}
                  </button>
                </div>

                {!data.week[dayObj.key as keyof typeof data.week].closed && (
                  <div className="space-y-2">
                    {data.week[dayObj.key as keyof typeof data.week].intervals.map((interval, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="time"
                          value={interval.start}
                          onChange={(e) => updateInterval(dayObj.key, idx, 'start', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="time"
                          value={interval.end}
                          onChange={(e) => updateInterval(dayObj.key, idx, 'end', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() => deleteInterval(dayObj.key, idx)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addInterval(dayObj.key)}
                      className="w-full flex items-center justify-center gap-1 text-blue-600 hover:text-blue-700 text-sm py-2"
                    >
                      <Plus className="w-4 h-4" />
                      Zeitfenster
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Reservations Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">� Reservierungen</h2>
              <p className="text-gray-600 text-sm">Aktivieren oder deaktivieren Sie Tischreservierungen für Ihre Kunden</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm font-medium text-gray-700">
                {data.reservationsEnabled ? '🟢 Aktiviert' : '🔴 Deaktiviert'}
              </span>
              <div className={`relative w-14 h-8 transition-colors rounded-full ${data.reservationsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                <button
                  onClick={() => {
                    setData(prev => {
                      if (!prev) return prev;
                      const copy = JSON.parse(JSON.stringify(prev));
                      copy.reservationsEnabled = !copy.reservationsEnabled;
                      setHasChanges(true);
                      return copy;
                    });
                  }}
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${data.reservationsEnabled ? 'translate-x-6' : ''}`}
                />
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
