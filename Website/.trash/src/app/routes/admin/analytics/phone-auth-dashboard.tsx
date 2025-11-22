'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Smartphone,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  BarChart3,
  Loader
} from 'lucide-react';
import { AdminProtection } from '@/components/admin/admin-protection';
import {
  getPhoneAuthStats,
  getRemainingPhoneQuota,
  isPhoneAuthEnabled
} from '@/lib/firebase/phone-auth-service';

interface DailyStat {
  date: string;
  signups: number;
  signins: number;
  total: number;
  percentageOfDaily: number;
}

export default function PhoneAuthDashboard() {
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneAuthEnabled, setPhoneAuthEnabled] = useState(true);
  const [remainingQuota, setRemainingQuota] = useState(10);
  const [todayDate, setTodayDate] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  const DAILY_LIMIT = 10;

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTodayDate(today);
    loadPhoneAuthData(today);
  }, [refreshKey]);

  const loadPhoneAuthData = async (date: string) => {
    try {
      setIsLoading(true);
      
      // Check current status
      const enabled = await isPhoneAuthEnabled();
      setPhoneAuthEnabled(enabled);
      
      // Get remaining quota
      const quota = await getRemainingPhoneQuota();
      setRemainingQuota(quota);
      
      // Get stats for the last 30 days
      const endDate = new Date().toISOString().split('T')[0];
      const startDateObj = new Date();
      startDateObj.setDate(startDateObj.getDate() - 30);
      const startDate = startDateObj.toISOString().split('T')[0];
      
      const statsData = await getPhoneAuthStats(startDate, endDate);
      
      // Transform stats data
      const transformedStats: DailyStat[] = statsData.map((stat: Record<string, unknown>) => ({
        date: stat.date as string,
        signups: (stat.signups as number) || 0,
        signins: (stat.signins as number) || 0,
        total: ((stat.signups as number) || 0) + ((stat.signins as number) || 0),
        percentageOfDaily: ((((stat.signups as number) || 0) + ((stat.signins as number) || 0)) / DAILY_LIMIT) * 100
      }));
      
      setStats(transformedStats.reverse());
      toast.success('Phone auth analytics loaded successfully');
    } catch (error) {
      console.error('Error loading phone auth data:', error);
      toast.error('Failed to load phone auth analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const getTodayStats = () => {
    return stats.find(s => s.date === todayDate);
  };

  const todayStats = getTodayStats();
  const usagePercentage = todayStats ? (todayStats.total / DAILY_LIMIT) * 100 : 0;

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <AdminProtection>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Phone Authentication Analytics</h1>
          <p className="text-zinc-500">Monitor phone number sign-up/sign-in usage and SMS quota</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quota Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Daily SMS Quota
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-zinc-900">
                    {remainingQuota}/{DAILY_LIMIT}
                  </p>
                  <p className="text-sm text-zinc-500">Remaining SMS today</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      usagePercentage >= 100
                        ? 'bg-red-500'
                        : usagePercentage >= 80
                        ? 'bg-orange-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-600">
                  {Math.round(usagePercentage)}% of daily limit used
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Auth Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {phoneAuthEnabled ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                Phone Auth Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className={`text-lg font-semibold ${
                    phoneAuthEnabled ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {phoneAuthEnabled ? '✓ ENABLED' : '✗ DISABLED'}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {phoneAuthEnabled
                      ? 'Users can sign up/sign in with phone'
                      : 'Phone auth is disabled due to quota limit'}
                  </p>
                </div>
                {!phoneAuthEnabled && (
                  <div className="bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-xs text-red-700">
                      Daily limit reached. Will reset tomorrow at 00:00 UTC.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Today's Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-zinc-600">Sign-ups</span>
                    <span className="font-semibold">{todayStats?.signups || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-600">Sign-ins</span>
                    <span className="font-semibold">{todayStats?.signins || 0}</span>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm text-zinc-600">Total requests</p>
                  <p className="text-2xl font-bold text-zinc-900">
                    {todayStats?.total || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 30-Day Stats Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Last 30 Days Usage
                </CardTitle>
                <CardDescription>Phone authentication requests per day</CardDescription>
              </div>
              <Button onClick={handleRefresh} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            ) : stats.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {stats.map((stat) => (
                  <div
                    key={stat.date}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{stat.date}</p>
                      <p className="text-xs text-zinc-500">
                        {stat.signups} signups • {stat.signins} signins
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-lg">{stat.total}</p>
                        <p className={`text-xs ${
                          stat.percentageOfDaily >= 100
                            ? 'text-red-600'
                            : stat.percentageOfDaily >= 80
                            ? 'text-orange-600'
                            : 'text-green-600'
                        }`}>
                          {stat.percentageOfDaily.toFixed(0)}%
                        </p>
                      </div>
                      <div className="w-24 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <div
                          className={`h-6 rounded ${
                            stat.percentageOfDaily >= 100
                              ? 'bg-red-500'
                              : stat.percentageOfDaily >= 80
                              ? 'bg-orange-500'
                              : 'bg-blue-500'
                          }`}
                          style={{
                            width: `${Math.min(stat.percentageOfDaily, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-zinc-500">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Box */}
        <Card className="mt-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900">Important Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-orange-800">
            <div>
              <p className="font-semibold mb-1">📊 Daily Quota Limit: {DAILY_LIMIT} SMS/day</p>
              <p className="text-xs">Firebase provides a free quota of {DAILY_LIMIT} SMS per day to prevent abuse.</p>
            </div>
            <div>
              <p className="font-semibold mb-1">🔄 Automatic Reset</p>
              <p className="text-xs">Quota resets daily at 00:00 UTC. Phone authentication is automatically re-enabled when the limit resets.</p>
            </div>
            <div>
              <p className="font-semibold mb-1">💡 How it works</p>
              <p className="text-xs">When daily limit is reached, phone auth is disabled from the frontend. Users will see a message that the service is temporarily unavailable.</p>
            </div>
            <div>
              <p className="font-semibold mb-1">💳 Upgrade Plan</p>
              <p className="text-xs">To increase SMS quota beyond {DAILY_LIMIT}/day, add a billing account to your Firebase project.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminProtection>
  );
}
