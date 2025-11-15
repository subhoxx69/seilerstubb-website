'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function EmailTestButton() {
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTestEmail = async () => {
    setLoading(true);
    setStatus(null);

    // Simulate email logging without making an actual API call
    setTimeout(() => {
      console.log('Email test simulated - email notification would be sent here if service was active');
      
      setStatus({
        success: true,
        message: 'Email service is disabled. Notifications will be logged to console only.',
      });
      
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="my-4">
      {status && (
        <Alert className={`mb-4 ${status.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <AlertDescription className={status.success ? 'text-green-700' : 'text-red-700'}>
            {status.message}
          </AlertDescription>
        </Alert>
      )}
      <Button
        onClick={handleTestEmail}
        disabled={loading}
        className="bg-amber-600 hover:bg-amber-700"
      >
        {loading ? 'Testing...' : 'Test Email Logging'}
      </Button>
    </div>
  );
}
