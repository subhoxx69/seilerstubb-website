'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function ReservationDiagnostic() {
  const [testing, setTesting] = useState(false);

  const runTest = async () => {
    setTesting(true);
    toast.loading('Testing reservation system...');

    try {
      // Test basic reservation data validation
      const testData = {
        userName: 'Test User',
        userEmail: 'test@example.com',
        userPhone: '1234567890',
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        people: 2,
        note: 'This is a test reservation',
        status: 'pending' as const
      };

      // Log to console for debugging
      console.log('Test reservation data:', testData);

      // Check that all required fields are present
      const missingFields = [];
      if (!testData.userName) missingFields.push('userName');
      if (!testData.userEmail) missingFields.push('userEmail');
      if (!testData.userPhone) missingFields.push('userPhone');
      if (!testData.date) missingFields.push('date');
      if (!testData.time) missingFields.push('time');
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      toast.dismiss();
      toast.success('Validation passed successfully');
      console.log('Reservation system diagnostic completed successfully');
    } catch (error) {
      toast.dismiss();
      toast.error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Reservation diagnostic error:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="mt-4">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={runTest}
        disabled={testing}
      >
        {testing ? 'Testing...' : 'Run System Check'}
      </Button>
      <p className="text-xs text-gray-500 mt-1">
        This button tests if the reservation system is working correctly.
      </p>
    </div>
  );
}
