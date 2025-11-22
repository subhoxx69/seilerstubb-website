'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, ShoppingCart, Calendar } from 'lucide-react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';

interface AnalyticsData {
  totalReservations: number;
  totalContacts: number;
  totalMenuItems: number;
  monthlyReservations: number;
  pendingReservations: number;
  confirmedReservations: number;
  lastUpdated: string;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);

        // Get total reservations
        const reservationsRef = collection(db, 'reservations');
        const reservationsSnapshot = await getDocs(reservationsRef);
        const totalReservations = reservationsSnapshot.size;

        // Get pending & confirmed reservations
        let pendingCount = 0;
        let confirmedCount = 0;
        reservationsSnapshot.forEach((doc) => {
          const status = doc.data().status;
          if (status === 'pending') pendingCount++;
          if (status === 'confirmed') confirmedCount++;
        });

        // Get monthly reservations (current month)
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyQuery = query(
          reservationsRef,
          where('date', '>=', firstDay.toISOString().split('T')[0])
        );
        const monthlySnapshot = await getDocs(monthlyQuery);
        const monthlyReservations = monthlySnapshot.size;

        // Get total contacts
        const contactsRef = collection(db, 'contacts');
        const contactsSnapshot = await getDocs(contactsRef);
        const totalContacts = contactsSnapshot.size;

        // Get total menu items
        const menuRef = collection(db, 'menu');
        const menuSnapshot = await getDocs(menuRef);
        const totalMenuItems = menuSnapshot.size;

        const data: AnalyticsData = {
          totalReservations,
          totalContacts,
          totalMenuItems,
          monthlyReservations,
          pendingReservations: pendingCount,
          confirmedReservations: confirmedCount,
          lastUpdated: new Date().toLocaleTimeString(),
        };

        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const stats = [
    {
      title: 'Total Reservations',
      value: analytics?.totalReservations || '0',
      icon: ShoppingCart,
      trend: `${analytics?.monthlyReservations || 0} this month`,
    },
    {
      title: 'Pending',
      value: analytics?.pendingReservations || '0',
      icon: Calendar,
      trend: 'Awaiting confirmation',
    },
    {
      title: 'Confirmed',
      value: analytics?.confirmedReservations || '0',
      icon: TrendingUp,
      trend: 'Confirmed bookings',
    },
    {
      title: 'Contact Messages',
      value: analytics?.totalContacts || '0',
      icon: Users,
      trend: 'Total inquiries',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Overview of key business metrics</p>
        </div>
        {analytics && (
          <p className="text-xs text-gray-500">Last updated: {analytics.lastUpdated}</p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-b-orange-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="border-orange-100">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
                      </div>
                      <Icon className="w-10 h-10 text-orange-600 opacity-20" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle>Menu Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Menu Items</p>
                  <p className="text-2xl font-bold text-orange-600">{analytics?.totalMenuItems || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-lg font-semibold text-green-600">Active & Ready</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle>Reservation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Confirmed:</span>
                  <span className="font-semibold text-green-600">{analytics?.confirmedReservations || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-semibold text-yellow-600">{analytics?.pendingReservations || 0}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-bold text-gray-900">{analytics?.totalReservations || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
