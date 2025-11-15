'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getCurrentAnnouncement, saveCurrentAnnouncement, type CurrentAnnouncement } from '@/lib/firebase/announcement-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2, Save } from 'lucide-react';

export default function AnnouncementsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  const [announcement, setAnnouncement] = useState<Omit<CurrentAnnouncement, 'updatedAt' | 'version'>>({
    active: false,
    title: '',
    message: '',
  });
  const [isLoading2, setIsLoading2] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Load current announcement
  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        setIsLoading2(true);
        const data = await getCurrentAnnouncement();
        if (data) {
          setAnnouncement({
            active: data.active,
            title: data.title,
            message: data.message,
          });
        }
      } catch (err) {
        console.error('Error loading announcement:', err);
        setError('Fehler beim Laden der Ankündigung');
      } finally {
        setIsLoading2(false);
      }
    };

    loadAnnouncement();
  }, []);

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(false);
      setIsSaving(true);

      if (!announcement.title.trim()) {
        setError('Titel ist erforderlich');
        return;
      }

      if (!announcement.message.trim()) {
        setError('Nachricht ist erforderlich');
        return;
      }

      await saveCurrentAnnouncement(announcement);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving announcement:', err);
      setError('Fehler beim Speichern der Ankündigung');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isLoading2) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ankündigungen</h1>
        <p className="text-gray-600">Bearbeiten Sie die Ankündigung, die allen Besuchern angezeigt wird.</p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Active Toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor="active" className="text-lg font-semibold text-gray-700">
            Ankündigung aktivieren
          </label>
          <button
            id="active"
            onClick={() => setAnnouncement({ ...announcement, active: !announcement.active })}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              announcement.active ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                announcement.active ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Title Input */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
            Titel
          </label>
          <Input
            id="title"
            type="text"
            value={announcement.title}
            onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
            placeholder="z.B. Wichtige Information"
            className="w-full"
          />
        </div>

        {/* Message Textarea */}
        <div className="space-y-2">
          <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
            Nachricht
          </label>
          <Textarea
            id="message"
            value={announcement.message}
            onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
            placeholder="Geben Sie Ihre Nachricht ein. Unterstützt Zeilenumbrüche."
            rows={6}
            className="w-full resize-none"
          />
          <p className="text-xs text-gray-500">Zeilenumbrüche werden unterstützt</p>
        </div>

        {/* Preview */}
        <div className="border-t pt-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Vorschau</p>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900">{announcement.title || '(kein Titel)'}</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {announcement.message || '(keine Nachricht)'}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <p className="text-sm text-green-600">Ankündigung erfolgreich gespeichert!</p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={isSaving || !announcement.active || !announcement.title.trim() || !announcement.message.trim()}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Speichern...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Speichern</span>
              </>
            )}
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-blue-900">Hinweis:</p>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Wenn Sie diese Ankündigung speichern, wird sie bei allen Besuchern erneut angezeigt</li>
            <li>Benutzer sehen sie auf der Startseite</li>
            <li>Die Version wird automatisch aktualisiert</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
