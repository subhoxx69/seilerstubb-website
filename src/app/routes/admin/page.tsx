'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Calendar, TrendingUp, Clock, MapPin, Phone, Mail, Settings, LogOut, Star, Heart, Eye, ShoppingCart, Flame, Shield, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase/config';
import { signOutUser } from '@/lib/firebase/auth-context-service';
import { toast } from 'sonner';
import Link from 'next/link';
import { collection, getDocs, query, where, orderBy, limit, Timestamp, getDoc, doc } from 'firebase/firestore';

const StatCard = ({ icon: Icon, label, value, trend }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="p-6 rounded-2xl border-0 bg-gradient-to-br from-white to-slate-50 hover:shadow-lg transition-all duration-300 h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 mb-2">{label}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {trend && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {trend}% vs last week
            </p>
          )}
        </div>
        <div className="p-3 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl">
          <Icon className="w-6 h-6 text-orange-600" />
        </div>
      </div>
    </Card>
  </motion.div>
);

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGmailAuthorized, setIsGmailAuthorized] = useState(false);
  const [isAuthorizingGmail, setIsAuthorizingGmail] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalReservations, setTotalReservations] = useState(0);
  const [avgRating, setAvgRating] = useState<number | string>(0);
  const [weeklyVisitors, setWeeklyVisitors] = useState<any[]>([]);
  const [recentReservations, setRecentReservations] = useState<any[]>([]);
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [trendingItems, setTrendingItems] = useState<any[]>([]);

  // Load all real data from Firebase
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Check Gmail authorization status
        try {
          const tokensDoc = await getDoc(doc(db, 'settings', 'gmail_tokens'));
          if (tokensDoc.exists()) {
            setIsGmailAuthorized(true);
          } else {
            setIsGmailAuthorized(false);
          }
        } catch (error) {
          console.error('Error checking Gmail status:', error);
          setIsGmailAuthorized(false);
        }

        // Get total users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        setTotalUsers(usersSnapshot.size);

        // Get total reservations
        const reservationsSnapshot = await getDocs(collection(db, 'reservations'));
        setTotalReservations(reservationsSnapshot.size);

        // Calculate average rating from menu items
        const menuSnapshot = await getDocs(collection(db, 'menu'));
        let totalRating = 0;
        let ratedItems = 0;
        const allMenuItems: any[] = [];
        
        menuSnapshot.forEach((doc) => {
          const data = doc.data();
          const rating = data.rating;
          if (rating) {
            totalRating += rating;
            ratedItems++;
          }
          
          // Collect all items for popularity analysis
          allMenuItems.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            price: data.price,
            image: data.image || data.imageUrl || data.imagePath,
            // Get likes from userLikes array (authoritative source), fallback to likes field, then popularity
            likes: (data.userLikes?.length || 0) || data.likes || data.popularity || 0,
            views: data.views || 0,
            orders: data.orders || 0,
            rating: data.rating || 0,
            ratingsCount: data.ratingsCount || 0,
            category: data.category,
            createdAt: data.createdAt,
          });
        });
        
        setAvgRating(ratedItems > 0 ? (totalRating / ratedItems).toFixed(1) : 0);

        // Calculate popularity score for each item
        const itemsWithScores = allMenuItems.map((item: any) => {
          // Algorithm: (Likes × 3) + (Views × 0.1) + (Orders × 2) + (Rating × 5)
          const likeScore = (item.likes || 0) * 3;
          const viewScore = Math.min((item.views || 0) * 0.1, 10);
          const orderScore = (item.orders || 0) * 2;
          const ratingScore = item.ratingsCount > 0 ? (item.rating || 0) * 5 : 0;
          
          const baseScore = likeScore + viewScore + orderScore + ratingScore;
          const popularityScore = Math.min(100, Math.log10(baseScore + 1) * 30);
          
          return {
            ...item,
            popularityScore: Math.round(popularityScore),
            likeScore,
            viewScore,
            orderScore,
            ratingScore,
          };
        });

        // Sort by popularity score and get top items
        const topPopular = itemsWithScores
          .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
          .slice(0, 10);

        // Get trending items (sorted by likes only for trending view)
        const trendingByLikes = itemsWithScores
          .sort((a, b) => (b.likes || 0) - (a.likes || 0))
          .slice(0, 5);

        setPopularItems(topPopular);
        setTrendingItems(trendingByLikes);

        // Get weekly visitors data from reservations (group by date)
        const reservationsData: any = {};
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        days.forEach((day) => {
          reservationsData[day] = { day, visitors: 0, reservations: 0 };
        });

        reservationsSnapshot.forEach((doc) => {
          const data = doc.data();
          const dateStr = data.date;
          if (dateStr) {
            const date = new Date(dateStr);
            const dayIndex = date.getDay();
            const dayName = days[(dayIndex + 6) % 7]; // Adjust for Monday start
            
            if (reservationsData[dayName]) {
              reservationsData[dayName].reservations += 1;
              reservationsData[dayName].visitors += data.partySize || 1;
            }
          }
        });

        setWeeklyVisitors(days.map((day) => reservationsData[day]));

        // Get recent reservations (last 10)
        const recentReservationsSnapshot = await getDocs(
          query(collection(db, 'reservations'), orderBy('date', 'desc'), limit(10))
        );
        const reservations: any[] = [];
        recentReservationsSnapshot.forEach((doc) => {
          const data = doc.data();
          reservations.push({
            id: doc.id,
            name: data.name,
            date: data.date,
            time: data.time,
            guests: data.partySize || 1,
            status: data.status || 'pending',
          });
        });
        setRecentReservations(reservations);

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Failed to load dashboard data');
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUser(user);
    }
    
    // Check URL params for Gmail authorization status
    const searchParams = new URLSearchParams(window.location.search);
    const gmailStatus = searchParams.get('gmail');
    
    if (gmailStatus === 'success') {
      toast.success('Gmail erfolgreich autorisiert!');
      // Reload to check Gmail status
      setTimeout(() => {
        window.location.replace('/routes/admin');
      }, 2000);
    } else if (gmailStatus === 'error') {
      const message = searchParams.get('message');
      toast.error(message || 'Gmail-Autorisierung fehlgeschlagen');
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOutUser();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleAuthorizeGmail = async () => {
    try {
      setIsAuthorizingGmail(true);
      
      // Get authorization URL from backend
      const response = await fetch('/api/auth/gmail?action=authorize');
      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        toast.error('Failed to get authorization URL');
      }
    } catch (error) {
      console.error('Gmail authorization failed:', error);
      toast.error('Failed to authorize Gmail');
    } finally {
      setIsAuthorizingGmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-b-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-between items-start"
        >
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
            <p className="text-slate-600">Willkommen, {currentUser?.email?.split('@')[0]}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-all duration-300 font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </motion.div>

        {/* Gmail Authorization Alert */}
        {!isGmailAuthorized && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Card className="p-6 rounded-2xl border-0 bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">Gmail Authorization erforderlich</h3>
                    <p className="text-blue-800 text-sm">Autorisieren Sie Gmail, um automatische Bestätigungs- und Ablehnungs-E-Mails für Reservierungen zu versenden.</p>
                  </div>
                </div>
                <button
                  onClick={handleAuthorizeGmail}
                  disabled={isAuthorizingGmail}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium flex-shrink-0 whitespace-nowrap"
                >
                  {isAuthorizingGmail ? 'Wird autorisiert...' : 'Gmail autorisieren'}
                </button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Gmail Status Indicator */}
        {isGmailAuthorized && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Card className="p-6 rounded-2xl border-0 bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">Gmail verbunden</h3>
                    <p className="text-green-800 text-sm">E-Mail-Versand ist aktiviert. Reservierungsbestätigungen werden automatisch versendet.</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          <StatCard icon={Users} label="Gesamtbenutzer" value={totalUsers.toLocaleString()} trend={12} />
          <StatCard icon={Calendar} label="Reservierungen" value={totalReservations} />
          <StatCard icon={Star} label="Bewertung" value={avgRating} />
        </motion.div>

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 gap-6 mb-8"
        >
          {/* Weekly Visitors Chart */}
          <Card className="p-6 rounded-2xl border-0 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Wöchentliche Besucher & Reservierungen</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyVisitors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="visitors" stroke="#da671f" strokeWidth={2} name="Besucher" />
                <Line type="monotone" dataKey="reservations" stroke="#f97316" strokeWidth={2} name="Reservierungen" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Popular Items Analytics Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-1 gap-6"
          >
            {/* Trending by Likes */}
            <Card className="p-6 rounded-2xl border-0 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-bold text-slate-900">Trending nach Likes</h2>
              </div>

              <div className="space-y-3">
                {trendingItems.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Keine Daten verfügbar</p>
                ) : (
                  trendingItems.map((item: any, idx: number) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 bg-gradient-to-br from-slate-50 to-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {/* Item Image */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                          )}
                        </div>

                        {/* Item Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 truncate">{item.name}</h3>
                            <Heart className="w-4 h-4 text-red-600 flex-shrink-0" fill="currentColor" />
                          </div>
                          <p className="text-sm text-slate-600 mb-2 line-clamp-1">{item.category}</p>
                          
                          {/* Like Count - Prominent */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((item.likes / 100) * 100, 100)}%` }}
                                transition={{ delay: idx * 0.05 + 0.2, duration: 0.5 }}
                                className="h-full bg-gradient-to-r from-red-500 to-pink-500"
                              />
                            </div>
                            <span className="font-bold text-red-600 text-lg min-w-fit">{item.likes}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>


        </motion.div>

        {/* Recent Reservations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full"
        >
          <Card className="p-6 rounded-2xl border-0 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Aktuelle Reservierungen</h2>
              <Link href="/routes/admin/reservations" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                Alle anzeigen →
              </Link>
            </div>
            <div className="space-y-3">
              {recentReservations.map((reservation: any) => (
                <div key={reservation.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-900">{reservation.name}</p>
                    <p className="text-xs text-slate-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {reservation.date} • {reservation.time} • {reservation.guests} Gäste
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    reservation.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {reservation.status === 'confirmed' ? 'Bestätigt' : 'Ausstehend'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
