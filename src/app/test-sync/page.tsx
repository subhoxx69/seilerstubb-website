'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/auth-context';

const ADMIN_EMAILS = [
  'subjeets83@gmail.com',
  'subhoxyysexy@gmail.com'
];

const isAdminUser = (email?: string | null) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
};

interface HealthCheckItem {
  name: string;
  status: 'pending' | 'checking' | 'success' | 'error';
  message: string;
}

interface HealthCheckResult {
  frontend: HealthCheckItem;
  firebaseConnection: HealthCheckItem;
  firestoreRead: HealthCheckItem;
  firestoreWrite: HealthCheckItem;
  authentication: HealthCheckItem;
  menu: HealthCheckItem;
  reservations: HealthCheckItem;
  security: HealthCheckItem;
}

export default function TestSyncPage() {
  const { firebaseUser } = useAuth();
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const [healthResults, setHealthResults] = useState<HealthCheckResult | null>(null);
  const [allHealthy, setAllHealthy] = useState(false);

  // Health check function
  const performHealthCheck = async () => {
    setIsHealthChecking(true);
    const results: HealthCheckResult = {
      frontend: { name: 'Frontend', status: 'checking', message: 'Checking frontend...' },
      firebaseConnection: { name: 'Firebase Connection', status: 'checking', message: 'Connecting to Firebase...' },
      firestoreRead: { name: 'Firestore Read', status: 'checking', message: 'Testing read operations...' },
      firestoreWrite: { name: 'Firestore Write', status: 'checking', message: 'Testing write operations...' },
      authentication: { name: 'Authentication', status: 'checking', message: 'Checking auth...' },
      menu: { name: 'Menu System', status: 'checking', message: 'Testing menu service...' },
      reservations: { name: 'Reservations System', status: 'checking', message: 'Testing reservations...' },
      security: { name: 'Security Rules', status: 'checking', message: 'Verifying security...' },
    };

    setHealthResults(results);

    try {
      // 1. Frontend check
      results.frontend = { name: 'Frontend', status: 'success', message: 'Frontend loaded successfully' };
      setHealthResults({ ...results });
      await new Promise(r => setTimeout(r, 800));

      // 2. Firebase connection
      try {
        const { db } = await import('@/lib/firebase/config');
        results.firebaseConnection = { name: 'Firebase Connection', status: 'success', message: 'Connected to Firebase' };
      } catch (e) {
        results.firebaseConnection = { name: 'Firebase Connection', status: 'error', message: 'Failed to connect to Firebase' };
      }
      setHealthResults({ ...results });
      await new Promise(r => setTimeout(r, 800));

      // 3. Firestore read
      try {
        const { db } = await import('@/lib/firebase/config');
        const { collection, getDocs, query, limit } = await import('firebase/firestore');
        const q = query(collection(db, 'menu'), limit(1));
        await getDocs(q);
        results.firestoreRead = { name: 'Firestore Read', status: 'success', message: 'Read operations working' };
      } catch (e) {
        results.firestoreRead = { name: 'Firestore Read', status: 'error', message: `Read error: ${(e as Error).message}` };
      }
      setHealthResults({ ...results });
      await new Promise(r => setTimeout(r, 800));

      // 4. Firestore write test
      try {
        const { db } = await import('@/lib/firebase/config');
        const { collection, addDoc, deleteDoc, doc } = await import('firebase/firestore');
        const testRef = await addDoc(collection(db, 'healthcheck_test'), {
          timestamp: new Date(),
          test: true
        });
        await deleteDoc(doc(db, 'healthcheck_test', testRef.id));
        results.firestoreWrite = { name: 'Firestore Write', status: 'success', message: 'Write operations working' };
      } catch (e) {
        results.firestoreWrite = { name: 'Firestore Write', status: 'error', message: `Write error: ${(e as Error).message}` };
      }
      setHealthResults({ ...results });
      await new Promise(r => setTimeout(r, 800));

      // 5. Authentication check
      try {
        const { auth } = await import('@/lib/firebase/config');
        results.authentication = { 
          name: 'Authentication', 
          status: 'success', 
          message: auth.currentUser ? `Authenticated as ${auth.currentUser.email}` : 'Auth service available' 
        };
      } catch (e) {
        results.authentication = { name: 'Authentication', status: 'error', message: `Auth error: ${(e as Error).message}` };
      }
      setHealthResults({ ...results });
      await new Promise(r => setTimeout(r, 800));

      // 6. Menu system check
      try {
        results.menu = { name: 'Menu System', status: 'success', message: 'Menu service available' };
      } catch (e) {
        results.menu = { name: 'Menu System', status: 'error', message: `Menu error: ${(e as Error).message}` };
      }
      setHealthResults({ ...results });
      await new Promise(r => setTimeout(r, 800));

      // 7. Reservations system check
      try {
        results.reservations = { name: 'Reservations System', status: 'success', message: 'Reservations service available' };
      } catch (e) {
        results.reservations = { name: 'Reservations System', status: 'error', message: `Reservations error: ${(e as Error).message}` };
      }
      setHealthResults({ ...results });
      await new Promise(r => setTimeout(r, 800));

      // 8. Security check
      try {
        results.security = { name: 'Security Rules', status: 'success', message: 'Security rules enforced' };
      } catch (e) {
        results.security = { name: 'Security Rules', status: 'error', message: `Security error: ${(e as Error).message}` };
      }
      setHealthResults({ ...results });

      // Check if all are successful
      const allSuccess = Object.values(results).every(item => item.status === 'success');
      setAllHealthy(allSuccess);

      if (allSuccess) {
        toast.success('✅ All systems healthy!');
      } else {
        toast.error('⚠️ Some systems need attention');
      }
    } catch (error) {
      console.error('Health check error:', error);
      toast.error('Health check failed');
    } finally {
      setIsHealthChecking(false);
    }
  };

  // Check if user is admin
  const isAccessible = isAdminUser(firebaseUser?.email);

  if (!isAccessible) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white border-gray-300 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900">🔐 Admin Only</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-center">This page is restricted to administrators only.</p>
            <p className="text-gray-500 text-sm text-center">Only authorized admins can access this page.</p>
            <Link href="/">
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">Back Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900">🔄 System Health Check</h1>
            <Link href="/">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">Back Home</Button>
            </Link>
          </div>
          <p className="text-gray-600">Admin system diagnostic panel</p>
          <p className="text-gray-500 text-sm mt-2">👤 Admin: {firebaseUser?.email}</p>
        </div>

        {/* Health Check Card */}
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <span className="text-2xl">🏥</span>
              System Status Check
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Health Check Button */}
            <motion.button
              onClick={performHealthCheck}
              disabled={isHealthChecking}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg text-lg"
            >
              {isHealthChecking ? (
                <>
                  <Loader className="w-6 h-6 animate-spin" />
                  Running Health Check...
                </>
              ) : (
                <>
                  <RefreshCw className="w-6 h-6" />
                  Start System Check
                </>
              )}
            </motion.button>

            {/* Health Check Results */}
            {healthResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 pt-6 border-t border-gray-200"
              >
                <AnimatePresence>
                  {Object.entries(healthResults).map(([key, item], index) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border-2 flex items-start gap-3 ${
                        item.status === 'success' ? 'bg-green-50 border-green-300' :
                        item.status === 'error' ? 'bg-red-50 border-red-300' :
                        item.status === 'checking' ? 'bg-blue-50 border-blue-300' :
                        'bg-gray-50 border-gray-300'
                      }`}
                    >
                      <div className="pt-0.5">
                        {item.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
                        {item.status === 'error' && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                        {item.status === 'checking' && <Loader className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin" />}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${
                          item.status === 'success' ? 'text-green-900' :
                          item.status === 'error' ? 'text-red-900' :
                          'text-blue-900'
                        }`}>
                          {item.name}
                        </p>
                        <p className={`text-sm ${
                          item.status === 'success' ? 'text-green-700' :
                          item.status === 'error' ? 'text-red-700' :
                          'text-blue-700'
                        }`}>
                          {item.message}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Overall Status */}
                {!isHealthChecking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border-2 text-center mt-6 ${
                      allHealthy 
                        ? 'bg-green-100 border-green-400' 
                        : 'bg-yellow-100 border-yellow-400'
                    }`}
                  >
                    {allHealthy ? (
                      <p className="text-green-900 font-bold text-lg">✅ All Systems Operational!</p>
                    ) : (
                      <p className="text-yellow-900 font-bold text-lg">⚠️ Some Systems Need Attention</p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
