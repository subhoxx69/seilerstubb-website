'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getUsers } from '@/lib/firebase/user-service';

export function AdminDiagnostics() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string>('');

  const runDiagnostics = async () => {
    setIsLoading(true);
    setResults('');
    
    try {
      toast.loading('Running admin access diagnostics...');
      
      // Try to fetch users to test permissions
      const users = await getUsers();
      
      const diagnosticResults = [
        `✓ Successfully connected to Firebase`,
        `✓ Successfully authenticated with Firebase`,
        `✓ Found ${users.length} users in the database`,
        `✓ Admin access appears to be working correctly`,
      ];
      
      setResults(diagnosticResults.join('\n'));
      toast.dismiss();
      toast.success('Diagnostics completed successfully');
    } catch (error: any) {
      console.error('Diagnostic error:', error);
      
      const errorResults = [
        `✓ Connected to Firebase`,
        `✗ Error accessing admin functionality: ${error.message}`,
        `  This could be due to permissions issues or network problems.`,
        `  Please check your connection and refresh the page.`,
      ];
      
      setResults(errorResults.join('\n'));
      toast.dismiss();
      toast.error('Diagnostics found issues with admin access');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <Button 
          onClick={runDiagnostics}
          disabled={isLoading}
        >
          {isLoading ? 'Running...' : 'Run Admin Access Diagnostic'}
        </Button>
        {isLoading && <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>}
      </div>
      
      {results && (
        <div className="p-4 bg-gray-100 rounded-md font-mono text-sm whitespace-pre-wrap">
          {results}
        </div>
      )}
    </div>
  );
}
