'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { sendTestEmail } from '@/lib/email-service';

export function EmailLogTester() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleTest = async () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    toast.loading('Testing email logging...');
    
    try {
      const result = await sendTestEmail(email);
      toast.dismiss();
      
      // With our mock email service, this should always succeed since it just logs
      toast.success('Email logging is working! (Note: No actual email was sent)');
      console.log(`Test email logged for ${email} (no actual email sent)`);
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-medium">Test Email Logging</h3>
      <div className="flex gap-2">
        <Input 
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="max-w-xs"
        />
        <Button 
          onClick={handleTest} 
          disabled={loading}
          variant="secondary"
        >
          {loading ? 'Testing...' : 'Test Logging'}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        This will test the email logging functionality (no actual emails will be sent).
      </p>
    </div>
  );
}
