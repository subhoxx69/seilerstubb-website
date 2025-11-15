'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Smartphone, TrendingUp, Users, Activity, Loader } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const mockPhoneAuthData = {
  totalAttempts: 2847,
  successfulLogins: 2456,
  failedAttempts: 391,
  uniqueDevices: 843,
  dailyAttempts: [
    { date: '2025-10-20', attempts: 185, successful: 168 },
    { date: '2025-10-21', attempts: 201, successful: 185 },
    { date: '2025-10-22', attempts: 218, successful: 205 },
    { date: '2025-10-23', attempts: 194, successful: 178 },
    { date: '2025-10-24', attempts: 267, successful: 241 },
    { date: '2025-10-25', statements: 289, successful: 261 },
    { date: '2025-10-26', attempts: 493, successful: 418 },
  ],
  authMethods: [
    { name: 'SMS OTP', value: 1850 },
    { name: 'Email OTP', value: 450 },
    { name: 'Biometric', value: 156 },
  ],
  COLORS: ['#da671f', '#f97316', '#fb923c'],
};

const StatCard = ({ icon: Icon, label, value, trend }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="p-6 rounded-2xl border-0 bg-gradient-to-br from-white to-slate-50 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 mb-2">{label}</p>
          <p className="text-3xl font-bold text-slate-900">{value.toLocaleString()}</p>
          {trend && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {trend}% vs letzte Woche
            </p>
          )}
        </div>
        <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl">
          <Icon className="w-6 h-6 text-purple-600" />
        </div>
      </div>
    </Card>
  </motion.div>
);

export default function PhoneAuthAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simulate loading Firebase data
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-slate-600">Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <Smartphone className="w-8 h-8 text-purple-600" />
          Telefon-Authentifizierung Analytik
        </h1>
        <p className="text-slate-600">Übersicht der Phone-Auth Aktivitäten und Statistiken</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard icon={Activity} label="Gesamtversuche" value={mockPhoneAuthData.totalAttempts} trend={18} />
        <StatCard icon={Users} label="Erfolgreiche Anmeldungen" value={mockPhoneAuthData.successfulLogins} />
        <StatCard icon={TrendingUp} label="Fehlgeschlagene Versuche" value={mockPhoneAuthData.failedAttempts} />
        <StatCard icon={Smartphone} label="Eindeutige Geräte" value={mockPhoneAuthData.uniqueDevices} />
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Daily Attempts Chart */}
        <Card className="lg:col-span-2 p-6 rounded-2xl border-0 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Tägliche Authentifizierungsversuche</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockPhoneAuthData.dailyAttempts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="attempts" stroke="#da671f" strokeWidth={2} name="Alle Versuche" />
              <Line type="monotone" dataKey="successful" stroke="#22c55e" strokeWidth={2} name="Erfolgreich" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Auth Methods Pie Chart */}
        <Card className="p-6 rounded-2xl border-0 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Authentifizierungsmethoden</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockPhoneAuthData.authMethods}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {mockPhoneAuthData.authMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={mockPhoneAuthData.COLORS[index % mockPhoneAuthData.COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Success Rate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="p-6 rounded-2xl border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Erfolgsquote</h2>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-5xl font-bold text-green-600">
                {((mockPhoneAuthData.successfulLogins / mockPhoneAuthData.totalAttempts) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-slate-600 mt-2">Authentifizierungserfolgsquote</p>
            </div>
            <div className="flex-1">
              <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                  style={{ width: `${(mockPhoneAuthData.successfulLogins / mockPhoneAuthData.totalAttempts) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-2">
                {mockPhoneAuthData.successfulLogins} / {mockPhoneAuthData.totalAttempts} erfolgreich
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
