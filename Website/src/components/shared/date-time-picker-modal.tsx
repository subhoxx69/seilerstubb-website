'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronLeft, ChevronRight, X, Check, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Helper function to format date as YYYY-MM-DD in local timezone (no UTC conversion)
function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface DateTimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
  bereich: string;
}

export function DateTimePickerModal({
  isOpen,
  onClose,
  onConfirm,
  selectedDate,
  selectedTime,
  bereich,
}: DateTimePickerModalProps) {
  const [step, setStep] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<string>(selectedDate || '');
  const [tempTime, setTempTime] = useState<string>(selectedTime || '');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempDate(selectedDate || '');
      setTempTime(selectedTime || '');
      setStep('date');
    }
  }, [isOpen, selectedDate, selectedTime]);

  // Fetch available times when date changes
  useEffect(() => {
    if (!tempDate || !bereich) {
      setAvailableSlots(null);
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        // Map display names to normalized keys
        const areaKey = bereich === 'Innenbereich' ? 'innen' : 'aussen';
        const res = await fetch(`/api/availability?date=${tempDate}&area=${areaKey}`);
        if (!res.ok) throw new Error('Failed to fetch slots');
        const data = await res.json();
        setAvailableSlots(data);
      } catch (error) {
        console.error('Error fetching slots:', error);
        setAvailableSlots({ closed: true, slots: [] });
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [tempDate, bereich]);

  // Calendar grid for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    // Adjust start date to show previous month's days for the first week
    // Monday = 1, so we go back (getDay() - 1) days to get to Monday
    const dayOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    startDate.setDate(startDate.getDate() - dayOffset);

    const days = [];
    const date = new Date(startDate);

    while (date <= lastDay || days.length % 7 !== 0) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }

    return days;
  }, [currentMonth]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleDateSelect = useCallback((dateStr: string) => {
    setTempDate(dateStr);
    setTempTime('');
    setStep('time');
  }, []);

  const handleTimeSelect = useCallback((time: string) => {
    setTempTime(time);
  }, []);

  const handleConfirm = useCallback(() => {
    if (tempDate && tempTime) {
      onConfirm(tempDate, tempTime);
      onClose();
    }
  }, [tempDate, tempTime, onConfirm, onClose]);

  const handleCancel = useCallback(() => {
    setTempDate(selectedDate || '');
    setTempTime(selectedTime || '');
    setStep('date');
    onClose();
  }, [selectedDate, selectedTime, onClose]);

  const goBack = useCallback(() => {
    if (step === 'time') {
      setStep('date');
      setTempTime('');
    } else {
      handleCancel();
    }
  }, [step, handleCancel]);

  const isDesktop = !isMobile;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent
        className={cn(
          'border-slate-200 bg-white shadow-2xl',
          isDesktop ? 'max-w-md' : 'w-full max-h-screen m-0 rounded-t-3xl'
        )}
      >
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2">
            {step === 'date' ? (
              <>
                <Calendar className="w-5 h-5 text-amber-600" />
                Datum wählen
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-amber-600" />
                Uhrzeit wählen
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 'date' ? (
              <motion.div
                key="date-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <CalendarStep
                  currentMonth={currentMonth}
                  calendarDays={calendarDays}
                  tempDate={tempDate}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  onSelectDate={handleDateSelect}
                />
              </motion.div>
            ) : (
              <motion.div
                key="time-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <TimeStep
                  tempDate={tempDate}
                  tempTime={tempTime}
                  availableSlots={availableSlots}
                  loadingSlots={loadingSlots}
                  onSelectTime={handleTimeSelect}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-slate-100 pt-4 space-y-3"
        >
          <div className="space-y-1.5 text-sm">
            {tempDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">
                  {new Date(tempDate).toLocaleDateString('de-DE', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
            {tempTime && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">{tempTime} Uhr</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={goBack}
              className="flex-1"
            >
              {step === 'date' ? 'Abbrechen' : 'Zurück'}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!tempDate || !tempTime}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            >
              Bestätigen
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Calendar Step Component
// ============================================================================

interface CalendarStepProps {
  currentMonth: Date;
  calendarDays: Date[];
  tempDate: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: string) => void;
}

function CalendarStep({
  currentMonth,
  calendarDays,
  tempDate,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: CalendarStepProps) {
  const monthName = currentMonth.toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  });

  const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 60);

  return (
    <div className="space-y-4">
      {/* Month Switcher */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevMonth}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Vorheriger Monat"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <span className="text-sm font-semibold text-slate-900 capitalize">{monthName}</span>
        <button
          onClick={onNextMonth}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Nächster Monat"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 gap-1">
        {dayLabels.map(label => (
          <div key={label} className="text-center text-xs font-semibold text-slate-500 py-2">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, idx) => {
          const dateStr = formatDateToString(date);
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const isSelected = dateStr === tempDate;
          const isDisabled = date < today || date > maxDate;

          return (
            <motion.div
              key={idx}
              whileHover={!isDisabled ? { scale: 1.05 } : {}}
              whileTap={!isDisabled ? { scale: 0.95 } : {}}
            >
              <button
                onClick={() => !isDisabled && onSelectDate(dateStr)}
                disabled={isDisabled}
                className={cn(
                  'w-full aspect-square rounded-lg font-medium text-sm transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2',
                  isSelected && !isDisabled
                    ? 'bg-amber-600 text-white shadow-md'
                    : !isDisabled && isCurrentMonth
                    ? 'bg-slate-50 text-slate-900 hover:bg-amber-50'
                    : 'bg-transparent text-slate-300',
                  isDisabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {date.getDate()}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Time Step Component
// ============================================================================

interface TimeStepProps {
  tempDate: string;
  tempTime: string;
  availableSlots: any;
  loadingSlots: boolean;
  onSelectTime: (time: string) => void;
}

function TimeStep({
  tempDate,
  tempTime,
  availableSlots,
  loadingSlots,
  onSelectTime,
}: TimeStepProps) {
  const dateLabel = new Date(tempDate).toLocaleDateString('de-DE', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (loadingSlots) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!availableSlots || availableSlots.closed || availableSlots.slots?.length === 0) {
    return (
      <div className="space-y-4 py-6">
        <Card className="bg-orange-50 border-orange-200 p-4">
          <p className="text-sm text-orange-800">
            Für <strong>{dateLabel}</strong> sind keine Uhrzeiten verfügbar.
          </p>
        </Card>
      </div>
    );
  }

  const slots = availableSlots.slots || [];
  const timeRows = [];
  for (let i = 0; i < slots.length; i += 4) {
    timeRows.push(slots.slice(i, i + 4));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Verfügbare Uhrzeiten für {dateLabel}:</p>

      <div className="space-y-2">
        {timeRows.map((row: any[], rowIdx: number) => (
          <div key={rowIdx} className="grid grid-cols-4 gap-2">
            {row.map((slot: any) => (
              <TimeSlotButton
                key={slot.time}
                time={slot.time}
                remaining={slot.remaining}
                isSelected={slot.time === tempTime}
                onSelect={onSelectTime}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface TimeSlotButtonProps {
  time: string;
  remaining: number;
  isSelected: boolean;
  onSelect: (time: string) => void;
}

function TimeSlotButton({ time, remaining, isSelected, onSelect }: TimeSlotButtonProps) {
  const isFull = remaining === 0;

  return (
    <motion.button
      whileHover={!isFull ? { scale: 1.05 } : {}}
      whileTap={!isFull ? { scale: 0.95 } : {}}
      onClick={() => !isFull && onSelect(time)}
      disabled={isFull}
      className={cn(
        'w-full py-2.5 px-2 rounded-lg font-semibold text-sm transition-all flex flex-col items-center justify-center',
        'focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2',
        isSelected && !isFull
          ? 'bg-amber-600 text-white shadow-md'
          : !isFull
          ? 'bg-slate-100 text-slate-900 hover:bg-amber-100'
          : 'bg-red-100 text-red-500 cursor-not-allowed opacity-60'
      )}
      aria-pressed={isSelected}
      aria-disabled={isFull}
    >
      <div>{time}</div>
    </motion.button>
  );
}
