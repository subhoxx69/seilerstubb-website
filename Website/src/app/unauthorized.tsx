'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function Unauthorized() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="bg-white p-8 sm:p-12 rounded-xl shadow-xl max-w-md mx-auto border border-gray-100">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6">
            <Lock className="h-10 w-10 text-red-600" />
          </div>
          
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-3">Access Denied</h1>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 text-sm text-left">
              You don't have permission to access this area. 
              Admin access is restricted to authorized personnel only.
            </p>
          </div>
          
          <p className="text-gray-600 mb-8">
            {user ? (
              <>
                You're signed in as <span className="font-medium">{user.email}</span>, but this account doesn't have administrative privileges.
              </>
            ) : (
              <>
                You need to sign in with an administrator account to access this area.
              </>
            )}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button className="group flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Return Home
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-8 text-gray-500 text-sm">
          Deutsche & Indische Küche • Seilerstubb Restaurant
        </div>
      </div>
    </div>
  );
}
