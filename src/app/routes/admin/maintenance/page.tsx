'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Save, Loader2 } from 'lucide-react';
import { getMaintenanceStatus, enableMaintenanceMode, disableMaintenanceMode } from '@/lib/firebase/maintenance-service';
import { useAuth } from '@/contexts/auth-context';
import { MaintenanceStatus } from '@/lib/firebase/maintenance-service';

export default function MaintenancePage() {
  const { user } = useAuth();
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [reason, setReason] = useState('Scheduled maintenance');
  const [estimatedEndTime, setEstimatedEndTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Load current maintenance status
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const status = await getMaintenanceStatus();
        if (status) {
          setMaintenanceStatus(status);
          setIsEnabled(status.enabled);
          setReason(status.reason);
          setEstimatedEndTime(status.estimatedEndTime);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading maintenance status:', error);
        setLoading(false);
      }
    };

    loadStatus();
  }, []);

  const handleToggleMaintenance = async () => {
    if (!user) return;

    setSaving(true);
    setMessage('');

    try {
      if (!isEnabled) {
        // Enable maintenance mode
        if (!estimatedEndTime) {
          setMessage('❌ Please set estimated end time');
          setSaving(false);
          return;
        }

        const success = await enableMaintenanceMode(
          reason,
          estimatedEndTime,
          user.email || 'unknown'
        );

        if (success) {
          setIsEnabled(true);
          setMessage('✅ Maintenance mode ENABLED - Users will see maintenance page');
        } else {
          setMessage('❌ Failed to enable maintenance mode');
        }
      } else {
        // Disable maintenance mode
        const success = await disableMaintenanceMode(user.email || 'unknown');

        if (success) {
          setIsEnabled(false);
          setMessage('✅ Maintenance mode DISABLED - Website is now live');
        } else {
          setMessage('❌ Failed to disable maintenance mode');
        }
      }
    } catch (error) {
      console.error('Error toggling maintenance:', error);
      setMessage('❌ Error: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <h1 className="text-3xl font-bold text-white">Maintenance Mode</h1>
        </div>
        <p className="text-slate-400">
          Control website availability for users
        </p>
      </div>

      {/* Status Alert */}
      <div
        className={`mb-6 p-4 rounded-lg border ${
          isEnabled
            ? 'bg-red-500/10 border-red-500/30 text-red-200'
            : 'bg-green-500/10 border-green-500/30 text-green-200'
        }`}
      >
        <p className="font-semibold">
          {isEnabled ? '🔴 Website is IN MAINTENANCE' : '🟢 Website is LIVE'}
        </p>
        <p className="text-sm mt-1">
          {isEnabled
            ? 'Users cannot access any pages except the maintenance page.'
            : 'All features are accessible to users.'}
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
        <div className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
            <div>
              <p className="font-semibold text-white">Enable Maintenance Mode</p>
              <p className="text-sm text-slate-400 mt-1">
                {isEnabled
                  ? 'Maintenance mode is currently ON'
                  : 'Maintenance mode is currently OFF'}
              </p>
            </div>
            <button
              onClick={handleToggleMaintenance}
              disabled={saving}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                isEnabled
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>

          {/* Reason Field */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Maintenance Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={saving}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none disabled:opacity-50"
              rows={3}
              placeholder="e.g., Scheduled maintenance, System upgrade, Database migration..."
            />
            <p className="text-xs text-slate-400 mt-1">
              Internal note - for admin reference only
            </p>
          </div>

          {/* Estimated End Time */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Estimated End Time *
            </label>
            <input
              type="text"
              value={estimatedEndTime}
              onChange={(e) => setEstimatedEndTime(e.target.value)}
              disabled={saving}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-amber-500 focus:outline-none disabled:opacity-50"
              placeholder="e.g., Today by 6:00 PM, Within 24 hours, Tomorrow morning..."
            />
            <p className="text-xs text-slate-400 mt-1">
              This will be shown to users on the maintenance page
            </p>
          </div>

          {/* Current Status Display */}
          {maintenanceStatus && maintenanceStatus.enabled && (
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <p className="text-sm text-slate-300 mb-2">Current Maintenance Info:</p>
              <div className="space-y-1 text-sm text-slate-400">
                <p>
                  <span className="text-slate-300">Start Time:</span>{' '}
                  {new Date(maintenanceStatus.startTime).toLocaleString()}
                </p>
                <p>
                  <span className="text-slate-300">Estimated End:</span>{' '}
                  {maintenanceStatus.estimatedEndTime}
                </p>
                <p>
                  <span className="text-slate-300">Last Updated:</span>{' '}
                  {new Date(maintenanceStatus.updatedAt).toLocaleString()}
                </p>
                {maintenanceStatus.updatedBy && (
                  <p>
                    <span className="text-slate-300">Updated By:</span>{' '}
                    {maintenanceStatus.updatedBy}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            message.includes('✅')
              ? 'bg-green-500/20 text-green-200 border border-green-500/30'
              : 'bg-red-500/20 text-red-200 border border-red-500/30'
          }`}
        >
          {message}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-blue-200 text-sm">
        <p className="font-semibold mb-2">💡 How it works:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>When enabled, users cannot access any pages</li>
          <li>They will see a professional maintenance page instead</li>
          <li>Admin dashboard remains accessible for authorized users</li>
          <li>Disable when maintenance is complete</li>
        </ul>
      </div>
    </div>
  );
}
