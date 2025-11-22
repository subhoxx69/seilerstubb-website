'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import WelcomePopup from '@/components/welcome-popup';
import { MapPin, Phone, Clock, Users, Instagram, Facebook, Youtube, ChevronRight, Star, Flame, Copy, Check, AlertCircle, Leaf, X, Heart, Truck, Utensils, CreditCard, Lock, CheckCircle, Wallet, DollarSign, Smartphone, Banknote, Mail } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

// Type definitions
interface TestimonialDetails {
  pricePerPerson?: string;
  mealType?: string;
  groupSize?: string;
  seatingType?: string;
  waitTime?: string;
  noiseLevel?: string;
  vegetarianRecommendation?: string;
  vegetarianOfferings?: string;
  food?: number;
  service?: number;
  atmosphere?: number;
}

interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  avatar?: string;
  date?: string;
  images?: string[];
  details?: TestimonialDetails;
}

const mockGalleryImages = [
  { id: '1', title: 'Restaurant Interior' },
  { id: '2', title: 'Signature Dishes' },
  { id: '3', title: 'Open Kitchen' },
  { id: '4', title: 'Family Dining' },
  { id: '5', title: 'Evening Ambiance' },
  { id: '6', title: 'Bar Area' },
];

const mockTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Ina B',
    text: 'Die Bedienung war wie immer nett und hilfsbereit. Das Essen sehr lecker und die Wartezeit angemessen. Ich werde bald wieder hingehen!',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a-/ALV-UjX4XycHaMQq_pna_ZRju5RQDB6ewoGA8NF8bSt0Y5we83v1TkWy=w72-h72-p-rp-mo-ba2-br100',
    date: 'vor 3 Monaten',
    details: {
      pricePerPerson: '€20–30',
      food: 5,
      service: 5,
      atmosphere: 5,
      noiseLevel: 'Mäßig',
      waitTime: 'Keine Wartezeit',
      vegetarianRecommendation: 'Sehr empfehlenswert'
    }
  },
  {
    id: '2',
    name: 'Alina V',
    text: 'Wir waren heute nur für einen kleinen Snack hier, aber es hat uns sehr gut gefallen. Das Essen war geschmackvoll und lecker. Die Bedienung hat sich ebenfalls sehr bemüht. Wir kommen gerne wieder👍🏻',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJ9oD4-RAZ01J-U9MO2epTbOpj5eQZAHt32c6tz95_k_OiQaA=w72-h72-p-rp-mo-ba3-br100',
    date: 'vor 2 Monaten',
    details: {
      food: 5,
      service: 5,
      atmosphere: 5,
      groupSize: '2 Personen'
    }
  },
  {
    id: '3',
    name: 'J. Maurer',
    text: 'Mit 5 Personen waren wir dort essen. Alle hatten unterschiedliche indische Gerichte – vegetarisch, Huhn und Fisch Curry. Alles hat uns sehr gut geschmeckt. Nicht zu scharf, nicht zu lasch, genau richtig, ebenso die Portionen. Wir kommen gerne wieder!',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocKlps2lli6qFu-h6OL0uLCNYq6lON7WtcJBI2xUyKgELSa1Zg=w72-h72-p-rp-mo-ba4-br100',
    date: 'vor 1 Monat',
    details: {
      mealType: 'Abendessen',
      pricePerPerson: '€20–30',
      food: 5,
      service: 5,
      atmosphere: 5,
      seatingType: 'Innenbereich',
      vegetarianRecommendation: 'Sehr empfehlenswert',
      vegetarianOfferings: 'Große Auswahl'
    }
  }
];

const mockRestaurantInfo = {
  name: 'Seilerstubb Restaurant',
  address: 'Seilerpfad 4, 65205 Wiesbaden',
  phone: '+49 0611 36004940',
  phoneLink: 'tel:+49611360049400',
  email: 'seilerstubbwiesbaden@gmail.com',
};

function HeroSection() {
  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden pt-20">
      <div className="absolute inset-0">
        <Image
          src="/images/restaurant/20250618_212826_1750340326251.jpg"
          alt="Seilerstubb Restaurant"
          fill
          priority
          quality={85}
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-900/70" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Pre-Title */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-400/30 rounded-full backdrop-blur-sm">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
              <p className="text-xs sm:text-sm tracking-widest uppercase font-light text-amber-200">Willkommen zu</p>
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.1 }}
            className="space-y-3"
          >
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white" style={{ 
              fontFamily: "'Playfair Display', Georgia, serif",
              letterSpacing: '-0.02em'
            }}>
              Seilerstubb
            </h1>
            <div className="h-1.5 w-24 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 rounded-full mx-auto"></div>
          </motion.div>

          {/* Subtitle */}
          <motion.h2 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.2 }} 
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-slate-100"
            style={{ fontFamily: "'Crimson Text', Georgia, serif" }}
          >
            <span className="text-transparent bg-gradient-to-r from-orange-300 via-amber-300 to-yellow-300 bg-clip-text font-semibold">
              Deutsche & Indische Küche
            </span>
          </motion.h2>

          {/* Description */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.3 }} 
            className="text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed font-light"
            style={{ fontFamily: "'Crimson Text', Georgia, serif" }}
          >
            Authentische indische Aromen vereint mit deutscher Tradition. Frisch zubereitet mit Leidenschaft, Qualität in jedem Bissen.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, delay: 0.4 }} 
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Link href="/reservation">
              <Button className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-10 py-7 text-base font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <span>Tisch Reservieren</span>
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/menu">
              <Button variant="outline" className="rounded-full border-2 border-white text-white hover:bg-white/10 px-10 py-7 text-base font-semibold backdrop-blur-sm transition-all duration-300">
                Speisekarte Ansehen
              </Button>
            </Link>
          </motion.div>

          {/* Bottom Info */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-8 sm:gap-12 pt-12 border-t border-white/10 mt-12"
          >
            <div className="text-center">
              <p className="text-amber-300 font-semibold text-lg">6+</p>
              <p className="text-slate-300 text-sm">Jahre Erfahrung</p>
            </div>
            <div className="text-center">
              <p className="text-amber-300 font-semibold text-lg">500+</p>
              <p className="text-slate-300 text-sm">Zufriedene Gäste</p>
            </div>
            <div className="text-center">
              <p className="text-amber-300 font-semibold text-lg">4.8★</p>
              <p className="text-slate-300 text-sm">Bewertung</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }} 
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="flex flex-col items-center gap-2">
          <p className="text-slate-300 text-sm">Mehr Erkunden</p>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function HighlightsSection() {
  const highlights = [
    { 
      icon: Flame, 
      title: 'Authentische Küche', 
      description: 'Traditionelle Rezepte aus Deutschland und Indien',
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50'
    },
    { 
      icon: Heart, 
      title: 'Mit Liebe zubereitet', 
      description: 'Frische Zutaten und jahrelange Erfahrung',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'from-pink-50 to-rose-50'
    },
    { 
      icon: Users, 
      title: 'Gemütliche Atmosphäre', 
      description: 'Entspanntes Ambiente für jeden Anlass',
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'from-emerald-50 to-teal-50'
    },
  ];

  return (
    <section className="py-20 sm:py-28 lg:py-32 bg-gradient-to-br from-white via-slate-50 to-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20 space-y-6"
        >
          <h2 className="text-5xl lg:text-7xl font-black text-slate-900 mb-6" style={{ 
            fontFamily: "'Playfair Display', Georgia, serif",
            letterSpacing: '-0.02em'
          }}>
            Herzlich Willkommen
          </h2>
          <div className="h-1.5 w-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mx-auto"></div>
          <p className="text-lg sm:text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed font-light" style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
            Im Herzen von Wiesbaden vereinen wir seit Jahren die besten Traditionen deutscher und indischer Küche. Unser erfahrenes Küchenteam bereitet mit Leidenschaft und frischen Zutaten sowohl herzhafte deutsche Klassiker als auch authentische indische Spezialitäten zu.
          </p>
        </motion.div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {highlights.map((highlight, idx) => {
            const Icon = highlight.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
              >
                <Card className="p-8 border-0 rounded-3xl overflow-hidden group cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500 h-full bg-white">
                  {/* Background Gradient Decoration */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${highlight.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className="relative flex flex-col items-center text-center space-y-6 h-full">
                    {/* Icon Container with Animation */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      className={`p-4 bg-gradient-to-br ${highlight.color} rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </motion.div>

                    {/* Title */}
                    <h3 className="font-bold text-slate-900 text-xl lg:text-2xl group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-amber-600 group-hover:bg-clip-text transition-all duration-300" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      {highlight.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-600 text-sm lg:text-base leading-relaxed group-hover:text-slate-700 transition-colors duration-300">
                      {highlight.description}
                    </p>

                    {/* Accent Line */}
                    <div className={`h-1 w-12 bg-gradient-to-r ${highlight.color} rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300`} />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Google Rating Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-white text-white" />
              ))}
            </div>
            <span className="font-semibold text-lg">Ausgezeichnet von Google</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PaymentMethodsSection() {
  const paymentMethods = [
    { 
      name: 'Bargeld', 
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      renderLogo: () => <Banknote className="w-10 h-10 text-emerald-600" />
    },
    { 
      name: 'EC-Karte', 
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      renderLogo: () => <CreditCard className="w-10 h-10 text-blue-600" />
    },
    { 
      name: 'Visa', 
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      renderLogo: () => (
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-indigo-700">VISA</span>
          <span className="text-xs text-indigo-600 mt-1">Secured</span>
        </div>
      )
    },
    { 
      name: 'Mastercard', 
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      renderLogo: () => (
        <div className="flex items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-red-600 shadow-md"></div>
          <div className="w-8 h-8 rounded-full bg-orange-500 shadow-md"></div>
        </div>
      )
    },
    { 
      name: 'American Express', 
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      renderLogo: () => (
        <div className="flex flex-col items-center">
          <span className="text-xl font-bold text-cyan-700">AX</span>
          <span className="text-xs text-cyan-600 mt-1">Express</span>
        </div>
      )
    },
    { 
      name: 'Google Pay', 
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      renderLogo: () => (
        <div className="flex flex-col items-center">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-red-500 to-yellow-500 bg-clip-text text-transparent">G</span>
          <span className="text-xs text-blue-600 mt-1">Pay</span>
        </div>
      )
    },
  ];

  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-gradient-to-b from-white to-slate-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-6"
        >
          <h2 className="text-5xl lg:text-7xl font-black text-slate-900 mb-6" style={{ 
            fontFamily: "'Playfair Display', Georgia, serif",
            letterSpacing: '-0.02em'
          }}>
            Zahlungsmöglichkeiten
          </h2>
          <div className="h-1.5 w-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mx-auto"></div>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed font-light" style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
            Sichere Zahlung mit allen gängigen Zahlungsarten. Alle Zahlungen werden verschlüsselt verarbeitet.
          </p>
        </motion.div>

        {/* Payment Methods Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Side - Payment Methods Cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="p-8 border-0 rounded-3xl shadow-md hover:shadow-lg transition-all duration-300 bg-white overflow-hidden">
              <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-slate-700" />
                </div>
                Akzeptierte Zahlungsarten
              </h3>

              {/* Payment Methods Grid */}
              <div className="grid grid-cols-2 gap-4">
                {paymentMethods.map((method, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.03, y: -4 }}
                    className={`p-6 ${method.bgColor} hover:shadow-md rounded-2xl border ${method.borderColor} transition-all duration-300 cursor-default flex flex-col items-center justify-center min-h-[160px]`}
                  >
                    {/* Logo Display */}
                    <div className="mb-4 flex items-center justify-center h-12">
                      {method.renderLogo()}
                    </div>
                    
                    {/* Payment Method Name */}
                    <p className="text-sm font-semibold text-slate-800 text-center leading-tight">
                      {method.name}
                    </p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Right Side - Security & Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col gap-6"
          >
            {/* Security Card */}
            <Card className="p-8 border-0 rounded-3xl shadow-md hover:shadow-lg transition-all duration-300 bg-white flex-1">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-emerald-100 rounded-xl flex-shrink-0">
                  <Lock className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Sichere Zahlung</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Alle Zahlungsinformationen werden mit modernster SSL-Verschlüsselung geschützt. Ihre Daten sind vollständig sicher.
                  </p>
                </div>
              </div>
            </Card>

            {/* Payment Info Card */}
            <Card className="p-8 border-0 rounded-3xl shadow-md hover:shadow-lg transition-all duration-300 bg-white flex-1">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Flexible Zahlungsoptionen</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Zahlen Sie bequem bei der Abholung oder im Restaurant. Alle gängigen Zahlungsmethoden werden akzeptiert.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PopularDishesSection() {
  const [dishes, setDishes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allDishesCount, setAllDishesCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const loadPopularDishes = async () => {
      try {
        // Fetch all menu items
        const menuSnapshot = await getDocs(collection(db, 'menu'));
        const items: any[] = [];
        
        menuSnapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            price: data.price,
            image: data.image || data.imageUrl || data.imagePath,
            popularity: data.popularity || 0,
            itemNumber: data.itemNumber || 0, // Get actual itemNumber from Firebase backend
          });
        });

        setAllDishesCount(items.length);

        // Sort by popularity (descending) and get top 6
        const topDishes = items
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 6);

        setDishes(topDishes);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading popular dishes:', error);
        setIsLoading(false);
      }
    };

    loadPopularDishes();
  }, []);

  // Auto-rotate carousel every 4 seconds
  useEffect(() => {
    if (dishes.length === 0) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % dishes.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [dishes.length]);

  if (isLoading) {
    return (
      <section className="py-20 sm:py-28 lg:py-32 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-orange-600 mx-auto"
            />
            <p className="text-slate-600 font-medium">Beliebte Gerichte werden geladen...</p>
          </div>
        </div>
      </section>
    );
  }

  if (dishes.length === 0) {
    return (
      <section className="py-20 sm:py-28 lg:py-32 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Flame className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-8 text-lg">Noch keine Favoriten vorhanden. Besuchen Sie die Speisekarte!</p>
          <Link href="/menu">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Zur Speisekarte
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white relative overflow-hidden">
      {/* Subtle Decorative Background */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-orange-200 rounded-full blur-3xl opacity-5" />
        <div className="absolute bottom-32 right-1/4 w-64 h-64 bg-amber-200 rounded-full blur-3xl opacity-5" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <motion.div
              animate={{ scaleX: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="h-0.5 w-8 bg-orange-500 rounded-full"
            />
            <span className="text-orange-600 font-semibold uppercase tracking-widest text-xs">Top Favoriten</span>
            <motion.div
              animate={{ scaleX: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.3 }}
              className="h-0.5 w-8 bg-orange-500 rounded-full"
            />
          </div>
          <h2 
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Beliebte Gerichte
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-light leading-relaxed">
            Unsere Gäste liebsten Favoriten – durchdacht ausgewählt und frisch zubereitet
          </p>
        </motion.div>

        {/* Carousel Layout */}
        <div className="space-y-10">
          {/* Main Featured Dish */}
          <motion.div
            key={`featured-${activeIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-500 flex flex-col md:flex-row md:h-80">
              {/* Image Section */}
              <div className="relative w-full md:w-2/5 h-56 md:h-full bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
                {dishes[activeIndex]?.image ? (
                  <motion.img
                    key={`img-${activeIndex}`}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4 }}
                    src={dishes[activeIndex].image}
                    alt={dishes[activeIndex].name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Flame className="w-24 h-24 text-orange-200" />
                  </div>
                )}
                
                {/* Subtle Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />

                {/* Item Number Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="absolute top-4 right-4 bg-orange-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-md flex items-center gap-1.5"
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  #{dishes[activeIndex].itemNumber}
                </motion.div>
              </div>

              {/* Content Section */}
              <div className="flex-grow flex flex-col p-6 md:p-8 space-y-4 md:w-3/5 justify-between">
                {/* Top Content */}
                <div className="space-y-3">
                  {/* Title */}
                  <motion.h3
                    key={`title-${activeIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {dishes[activeIndex]?.name}
                  </motion.h3>

                  {/* Description */}
                  <motion.p
                    key={`desc-${activeIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-600 text-sm md:text-base leading-relaxed line-clamp-2"
                  >
                    {dishes[activeIndex]?.description}
                  </motion.p>
                </div>

                {/* Bottom Content */}
                <div className="flex items-center justify-between pt-2">
                  {/* Price */}
                  <motion.div
                    key={`price-${activeIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="flex items-baseline gap-1.5"
                  >
                    <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Ab</span>
                    <span className="text-3xl md:text-4xl font-bold text-orange-600">€{dishes[activeIndex]?.price?.toFixed(2)}</span>
                  </motion.div>

                  {/* Action Button */}
                  <Link href="/menu">
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      className="p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                    </motion.div>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Carousel Indicators */}
          <div>
            <p className="text-center text-slate-600 font-medium text-xs uppercase tracking-wide mb-5">
              Alle Favoriten
            </p>
            <div className="flex overflow-x-auto gap-3 pb-3 md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-3 scrollbar-hide">
              {dishes.map((dish, idx) => (
                <motion.div
                  key={`indicator-${dish.id}`}
                  onClick={() => setActiveIndex(idx)}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.93 }}
                  className="cursor-pointer group flex-shrink-0 w-28 md:w-auto"
                >
                  <motion.div
                    animate={{
                      scale: activeIndex === idx ? 1.03 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className={`relative rounded-xl overflow-hidden h-28 md:h-32 lg:h-36 bg-gradient-to-br from-orange-50 to-amber-50 border transition-all duration-300 ${
                      activeIndex === idx 
                        ? 'border-orange-500 shadow-md' 
                        : 'border-slate-200 shadow-sm hover:shadow-md hover:border-orange-300'
                    }`}
                  >
                    {/* Image */}
                    {dish.image ? (
                      <motion.img
                        key={`card-img-${idx}`}
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                        animate={{ 
                          scale: activeIndex === idx ? 1.05 : 1 
                        }}
                        transition={{ duration: 0.4 }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100">
                        <Flame className="w-8 h-8 text-orange-300/40" />
                      </div>
                    )}

                    {/* Subtle Highlight */}
                    {activeIndex === idx && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-orange-600/5 border-2 border-orange-500"
                      />
                    )}

                    {/* Label Overlay - Only on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex flex-col justify-end p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-xs font-semibold line-clamp-1">{dish.name}</p>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Progress Dots */}
            <motion.div className="flex justify-center gap-1.5 mt-6">
              {dishes.map((_, idx) => (
                <motion.button
                  key={`progress-${idx}`}
                  onClick={() => setActiveIndex(idx)}
                  animate={{
                    width: activeIndex === idx ? 24 : 6,
                    backgroundColor: activeIndex === idx ? '#ea580c' : '#cbd5e1'
                  }}
                  transition={{ duration: 0.3 }}
                  className="h-1.5 rounded-full cursor-pointer hover:bg-orange-500 transition-colors"
                />
              ))}
            </motion.div>
          </div>
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-14"
        >
          <Link href="/menu">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 px-8 md:px-10 py-3 md:py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm md:text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              Komplette Speisekarte
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </motion.div>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function OpeningHoursSection() {
  const [hoursData, setHoursData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  // Convert JavaScript getDay() (0=Sunday, 1=Monday) to our array index (0=Monday, 6=Sunday)
  // Formula: (getDay() + 6) % 7 converts 0->6 (Sunday), 1->0 (Monday), etc.
  const today = (new Date().getDay() + 6) % 7;

  // Fetch from API endpoint instead of Firestore directly
  React.useEffect(() => {
    const loadHours = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/opening-hours', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.error('❌ API responded with status:', response.status, response.statusText);
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📥 Loaded opening hours from API:', data);
        
        // Transform API data to component format, supporting multiple windows
        const transformed = {
          weekHours: [
            { day: 'Montag', dayNumber: 0, isClosed: data.week.mon.closed, shifts: data.week.mon.intervals },
            { day: 'Dienstag', dayNumber: 1, isClosed: data.week.tue.closed, shifts: data.week.tue.intervals },
            { day: 'Mittwoch', dayNumber: 2, isClosed: data.week.wed.closed, shifts: data.week.wed.intervals },
            { day: 'Donnerstag', dayNumber: 3, isClosed: data.week.thu.closed, shifts: data.week.thu.intervals },
            { day: 'Freitag', dayNumber: 4, isClosed: data.week.fri.closed, shifts: data.week.fri.intervals },
            { day: 'Samstag', dayNumber: 5, isClosed: data.week.sat.closed, shifts: data.week.sat.intervals },
            { day: 'Sonntag', dayNumber: 6, isClosed: data.week.sun.closed, shifts: data.week.sun.intervals },
          ],
          deliveryActive: !!data.lieferung,
          deliveryWindows: data.lieferung?.windows || (data.lieferung ? [{ start: data.lieferung.start || '17:00', end: data.lieferung.end || '22:30' }] : [{ start: '17:00', end: '22:30' }]),
          deliveryClosed: data.lieferung?.closed || false,
          pickupActive: !!data.abholung,
          pickupWindows: data.abholung?.windows || (data.abholung ? [{ start: data.abholung.start || '11:30', end: data.abholung.end || '23:00' }] : [{ start: '11:30', end: '23:00' }]),
          pickupClosed: data.abholung?.closed || false,
          deliveryMinOrder: data.lieferung?.minOrder !== undefined ? data.lieferung.minOrder : 15.00,
          deliveryFee: data.lieferung?.fee !== undefined ? data.lieferung.fee : 2.00,
          pickupMinOrder: data.abholung?.minOrder !== undefined ? data.abholung.minOrder : 0,
        };
        setHoursData(transformed);
      } catch (error) {
        console.error('❌ Error loading hours:', error);
        // Use fallback data - component will render defaults
      } finally {
        setIsLoading(false);
      }
    };

    loadHours();
  }, []);

  // Default fallback data
  const defaultData = {
    weekHours: dayNames.map((day, idx) => ({
      day,
      dayNumber: idx,
      isClosed: false,
      shifts: [{ start: idx === 6 ? '12:00' : '11:30', end: idx === 5 ? '00:00' : '23:00' }]
    })),
    deliveryWindows: [{ start: '17:00', end: '22:30' }],
    deliveryClosed: false,
    pickupWindows: [{ start: '11:30', end: '23:00' }],
    pickupClosed: false,
    deliveryMinOrder: 15.00,
    deliveryFee: 2.00,
    pickupMinOrder: 0,
  };

  const data = hoursData || defaultData;
  
  // Get today's hours
  const getTodayHours = () => {
    const dayData = data.weekHours[today];
    if (!dayData || dayData.isClosed || dayData.shifts.length === 0) {
      return null;
    }
    return dayData.shifts.map((shift: any) => `${shift.start} - ${shift.end}`).join(', ');
  };

  const formatTimeWindows = (windows: any[]) => {
    if (!windows || windows.length === 0) return '–';
    return windows
      .filter((w: any) => w.start && w.end)
      .map((w: any) => `${w.start}–${w.end}`)
      .join(', ');
  };

  return (
    <section className="py-20 sm:py-28 lg:py-32 bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
            Öffnungszeiten & Lieferung
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Besuchen Sie uns im Restaurant oder bestellen Sie online für Lieferung und Abholung
          </p>
        </motion.div>

        {/* Cards Grid */}
        {!isLoading && (
        <div className={`grid gap-8 mb-12 ${
          data.deliveryActive && data.pickupActive 
            ? 'grid-cols-1 md:grid-cols-3' 
            : 'grid-cols-1 md:grid-cols-2'
        }`}>
          {/* Opening Hours Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
          >
            <Card className="border-0 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 h-full bg-white overflow-hidden">
              {/* Top Gradient Header */}
              <div className="h-32 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                </div>
                <div className="relative h-full flex items-end p-8 pb-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg"
                  >
                    <Clock className="w-8 h-8 text-white" />
                  </motion.div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Title */}
                <h3 className="text-3xl font-bold text-slate-900 mb-8">Öffnungszeiten</h3>

                {/* Hours List */}
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="py-12 text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-8 h-8 border-3 border-blue-200 border-t-blue-500 rounded-full mx-auto"
                      />
                    </div>
                  ) : (
                    data.weekHours.map((day: any, idx: number) => {
                      const isToday = idx === today;
                      const hoursText = day.isClosed 
                        ? 'Geschlossen' 
                        : day.shifts.map((s: any) => `${s.start}–${s.end}`).join(' / ');
                      
                      return (
                        <motion.div
                          key={day.day}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          viewport={{ once: true }}
                          className={`flex flex-col py-4 px-5 rounded-2xl transition-all duration-300 border-2 ${
                            isToday 
                              ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-300 shadow-md' 
                              : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-blue-100'
                          }`}
                        >
                          <span className={`text-sm font-bold tracking-wide mb-2 ${isToday ? 'text-blue-900' : 'text-slate-700'}`}>
                            {day.day}
                          </span>
                          <span className={`text-sm font-bold break-words leading-relaxed ${isToday ? 'text-blue-600' : day.isClosed ? 'text-red-500' : 'text-slate-700'}`}>
                            {hoursText}
                          </span>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Today Info */}
                {!isLoading && (
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    {data.weekHours[today]?.isClosed ? (
                      <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                        <p className="text-sm font-bold text-red-700">Heute geschlossen</p>
                        <p className="text-xs text-red-600 mt-1">Nächster Öffnungstag: {data.weekHours[(today + 1) % 7]?.day}</p>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                        <p className="text-sm font-bold text-emerald-700">✓ Heute geöffnet</p>
                        <p className="text-xs text-emerald-600 mt-1">Genießen Sie unser Restaurant!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Delivery Card */}
          {data.deliveryActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
          >
            <Card className="border-0 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 h-full bg-white overflow-hidden">
              {/* Top Gradient Header */}
              <div className="h-32 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                </div>
                <div className="relative h-full flex items-end p-8 pb-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg"
                  >
                    <Truck className="w-8 h-8 text-white" />
                  </motion.div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Title */}
                <h3 className="text-3xl font-bold text-slate-900 mb-8">Lieferung</h3>

                {/* Loading State */}
                {isLoading ? (
                  <div className="py-12 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-8 h-8 border-3 border-orange-200 border-t-orange-500 rounded-full mx-auto"
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Times Box */}
                    <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-200 hover:border-orange-300 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-orange-700 uppercase tracking-widest">Lieferzeiten</p>
                        <Clock className="w-5 h-5 text-orange-500" />
                      </div>
                      {data.deliveryClosed ? (
                        <p className="text-3xl font-bold text-orange-600">Geschlossen</p>
                      ) : (
                        <p className="text-3xl font-bold text-orange-700 break-words leading-tight">
                          {formatTimeWindows(data.deliveryWindows)}
                        </p>
                      )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:border-orange-300 transition-all">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Mindestbestellung</p>
                        <p className="text-2xl font-bold text-slate-900">€{data.deliveryMinOrder.toFixed(2)}</p>
                        <p className="text-xs text-slate-500 mt-1">für kostenlose Lieferung</p>
                      </div>
                      <div className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200 hover:border-orange-300 transition-all">
                        <p className="text-xs font-bold text-orange-700 uppercase tracking-widest mb-2">Liefergebühr</p>
                        <p className="text-2xl font-bold text-orange-600">€{data.deliveryFee.toFixed(2)}</p>
                        <p className="text-xs text-orange-600 mt-1">unter Mindestbestellung</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
          )}

          {/* Pickup Card */}
          {data.pickupActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
          >
            <Card className="border-0 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 h-full bg-white overflow-hidden">
              {/* Top Gradient Header */}
              <div className="h-32 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 right-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                </div>
                <div className="relative h-full flex items-end p-8 pb-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg"
                  >
                    <Utensils className="w-8 h-8 text-white" />
                  </motion.div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Title */}
                <h3 className="text-3xl font-bold text-slate-900 mb-8">Abholung</h3>

                {/* Loading State */}
                {isLoading ? (
                  <div className="py-12 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-500 rounded-full mx-auto"
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Times Box */}
                    <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 hover:border-emerald-300 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-emerald-700 uppercase tracking-widest">Abholzeiten</p>
                        <Clock className="w-5 h-5 text-emerald-500" />
                      </div>
                      {data.pickupClosed ? (
                        <p className="text-3xl font-bold text-emerald-600">Geschlossen</p>
                      ) : (
                        <p className="text-3xl font-bold text-emerald-700 break-words leading-tight">
                          {formatTimeWindows(data.pickupWindows)}
                        </p>
                      )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Mindestbestellung</p>
                        {data.pickupMinOrder && data.pickupMinOrder > 0 ? (
                          <>
                            <p className="text-2xl font-bold text-slate-900">Ab €{data.pickupMinOrder.toFixed(2)}</p>
                            <p className="text-xs text-slate-500 mt-1">Empfohlen</p>
                          </>
                        ) : (
                          <>
                            <p className="text-2xl font-bold text-emerald-600">Keine</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
          )}
        </div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-slate-600 mb-6">Jetzt Ihren Lieblingsgericht bestellen oder einen Tisch reservieren</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/menu">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Speisekarte ansehen
              </motion.button>
            </Link>
            <Link href="/reservation">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white border-2 border-orange-600 text-orange-600 hover:bg-orange-50 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Tisch reservieren
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function LocationSection() {
  return (
    <section className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-white via-slate-50 to-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
            Finden Sie uns
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Besuchen Sie unser Restaurant im Herzen von Wiesbaden
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch mb-12">
          {/* Left Side - Contact & Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col justify-between"
          >
            {/* Contact Information Cards */}
            <div className="space-y-5 mb-10">
              {/* Address Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
              >
                <Card className="p-7 border-0 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 bg-white overflow-hidden group cursor-default">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-start gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      className="p-3 bg-blue-100 rounded-2xl flex-shrink-0"
                    >
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 mb-2 text-lg">Adresse</p>
                      <p className="text-slate-600 text-sm leading-relaxed font-medium">{mockRestaurantInfo.address}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Phone Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
              >
                <Card className="p-7 border-0 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 bg-white overflow-hidden group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <a href={`tel:${mockRestaurantInfo.phone}`} className="relative flex items-start gap-4 block">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="p-3 bg-orange-100 rounded-2xl flex-shrink-0"
                    >
                      <Phone className="w-6 h-6 text-orange-600" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 mb-2 text-lg">Telefon</p>
                      <p className="text-slate-600 hover:text-orange-600 text-sm font-semibold transition-colors group-hover:text-orange-600">
                        {mockRestaurantInfo.phone}
                      </p>
                    </div>
                  </a>
                </Card>
              </motion.div>

              {/* Email Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
              >
                <Card className="p-7 border-0 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 bg-white overflow-hidden group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <a href={`mailto:${mockRestaurantInfo.email}`} className="relative flex items-start gap-4 block">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      className="p-3 bg-emerald-100 rounded-2xl flex-shrink-0"
                    >
                      <Mail className="w-6 h-6 text-emerald-600" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 mb-2 text-lg">E-Mail</p>
                      <p className="text-slate-600 hover:text-emerald-600 text-sm font-semibold transition-colors group-hover:text-emerald-600 break-all">
                        {mockRestaurantInfo.email}
                      </p>
                    </div>
                  </a>
                </Card>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <motion.a
                href={`tel:061136004940`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="w-full rounded-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 py-6 text-base">
                  <Phone className="w-5 h-5 mr-2" />
                  Anrufen
                </Button>
              </motion.a>
              <motion.a
                href={`https://maps.google.com/?q=${mockRestaurantInfo.address}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="w-full rounded-full border-2 border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 font-bold shadow-md hover:shadow-xl transition-all duration-300 py-6 text-base">
                  <MapPin className="w-5 h-5 mr-2" />
                  Route
                </Button>
              </motion.a>
            </div>
          </motion.div>

          {/* Right Side - Map */}
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="group relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-100 to-slate-200 h-full min-h-[400px]"
          >
            {/* Google Maps Interactive Embed - 3D Satellite View */}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1278.4438!2d8.303961!3d50.054678!2m3!1f0!2f45!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47bdbd0a22d3eda5%3A0xd2d1fa1bfe06d381!2sSeilerstubb%20-%20Indisches%20und%20deutsches%20Restaurant!5e0!3m2!1sde!2sde!4v1730625000000&layer=c&cbll=50.054678,8.303961&cbp=12,45,,0,0"
              width="100%"
              height="100%"
              style={{ 
                border: 0, 
                minHeight: '400px',
                position: 'absolute',
                inset: 0
              }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
            
            {/* Overlay Effects */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
            
            {/* Info Badge */}
            <a 
              href="https://maps.app.goo.gl/yCW6Ba95wkXzUDp69"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-6 right-6 z-20"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-3 bg-white/95 backdrop-blur-sm rounded-full shadow-xl hover:shadow-2xl cursor-pointer transition-all duration-300 flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-900">Auf Karte öffnen</span>
              </motion.div>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function GallerySection() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [imageZoom, setImageZoom] = useState(1);

  // Fetch gallery images from Firebase
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setIsLoading(true);
        const galleryRef = collection(db, 'gallery');
        const q = query(galleryRef, orderBy('order', 'asc'), limit(6));
        const snapshot = await getDocs(q);
        
        const images = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setGalleryImages(images);
      } catch (error) {
        console.error('Error fetching gallery images:', error);
        // Fallback to mock images if there's an error
        setGalleryImages(mockGalleryImages);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGalleryImages();
  }, []);

  // Handle touch swipe for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (selectedImage !== null) {
      if (isLeftSwipe) {
        // Swipe left - next image
        setSelectedImage(prev => prev === displayImages.length - 1 ? 0 : prev! + 1);
      }
      if (isRightSwipe) {
        // Swipe right - previous image
        setSelectedImage(prev => prev === 0 ? displayImages.length - 1 : prev! - 1);
      }
    }
  };

  // Handle zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (selectedImage === null) return;
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.1 : -0.1;
    setImageZoom(prev => Math.max(1, Math.min(3, prev - delta)));
  };

  // Reset zoom when image changes
  useEffect(() => {
    setImageZoom(1);
  }, [selectedImage]);

  // Use galleryImages if available, otherwise use mockGalleryImages
  const displayImages = galleryImages.length > 0 ? galleryImages : mockGalleryImages;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage === null) return;
      
      if (e.key === 'ArrowRight') {
        setSelectedImage(prev => prev === displayImages.length - 1 ? 0 : prev! + 1);
      } else if (e.key === 'ArrowLeft') {
        setSelectedImage(prev => prev === 0 ? displayImages.length - 1 : prev! - 1);
      } else if (e.key === 'Escape') {
        setSelectedImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, displayImages.length]);

  // Hide header when lightbox is open
  useEffect(() => {
    const navbar = document.querySelector('nav');
    if (navbar) {
      if (selectedImage !== null) {
        navbar.style.display = 'none';
      } else {
        navbar.style.display = 'block';
      }
    }
  }, [selectedImage]);

  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-50 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-transparent rounded-full" />
            <span className="text-orange-600 font-bold uppercase tracking-widest text-sm">Galerie</span>
            <div className="h-1 w-12 bg-gradient-to-l from-orange-500 to-transparent rounded-full" />
          </div>
          <h2 
            className="text-5xl lg:text-6xl font-bold text-slate-900 mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Unsere Atmosphäre
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Entdecken Sie die gemütliche Atmosphäre und modernen Räumlichkeiten unseres Restaurants
          </p>
        </motion.div>

        {/* Gallery Grid with Masonry Layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {displayImages.map((image, idx) => {
            // Create a masonry-like layout
            let rowSpan = 'md:row-span-1';
            let colSpan = '';
            
            if (idx === 0) {
              rowSpan = 'md:row-span-2';
              colSpan = 'col-span-1 md:col-span-2';
            }
            if (idx === 3) rowSpan = 'md:row-span-2';
            
            return (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                onClick={() => setSelectedImage(idx)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`group cursor-pointer rounded-lg overflow-hidden bg-slate-100 ${colSpan} ${rowSpan} aspect-square md:aspect-auto active:ring-2 ring-orange-500 transition-all duration-300`}
              >
                <div className="relative w-full h-full">
                  {/* Image with Gradient Fallback */}
                  {image.imageKitUrl ? (
                    <img
                      src={image.imageKitUrl}
                      alt={image.alt || image.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 select-none"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50 group-hover:scale-110 transition-transform duration-700" />
                  )}
                  
                  {/* Overlay Text */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 flex items-end justify-start p-4 z-10">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-white"
                    >
                      <p className="font-bold text-lg">{image.title}</p>
                      <p className="text-sm text-white/80">Foto {idx + 1} von {displayImages.length}</p>
                    </motion.div>
                  </div>

                  {/* Icon Badge */}
                  <div className="absolute top-3 right-3 z-20">
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 1.1 }}
                      className="bg-white/90 backdrop-blur-sm p-2 rounded-lg text-orange-600 opacity-0 group-hover:opacity-100 md:group-active:opacity-100 transition-opacity duration-300 shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </motion.div>
                  </div>

                  {/* Corner Accent */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-500/20 to-transparent group-hover:from-orange-500/40 transition-all duration-500" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Image Lightbox Modal - Premium Enhanced Version */}
        <AnimatePresence>
          {selectedImage !== null && (
            <>
              {/* Premium Backdrop with Multiple Layers */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-40"
                onClick={() => setSelectedImage(null)}
              >
                {/* Base Dark Layer */}
                <div className="absolute inset-0 bg-black/95 backdrop-blur-lg" />
                
                {/* Animated Radial Gradient */}
                <motion.div
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.3) 0%, transparent 50%)',
                    backgroundPosition: '0% 0%',
                    backgroundSize: '200% 200%',
                  }}
                />
              </motion.div>

              {/* Main Gallery Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 pointer-events-none"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Image Container */}
                <div
                  className="relative w-full h-auto max-h-[90vh] max-w-6xl pointer-events-auto group"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Main Image with Zoom Support */}
                  <div className="relative w-full h-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl bg-black flex items-center justify-center" onWheel={handleWheel}>
                    {/* Image Layer with Zoom */}
                    {displayImages[selectedImage].imageKitUrl ? (
                      <motion.img
                        key={`lightbox-img-${selectedImage}`}
                        src={displayImages[selectedImage].imageKitUrl}
                        alt={displayImages[selectedImage].alt || displayImages[selectedImage].title}
                        className="w-full h-full object-contain select-none cursor-zoom-in"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1, zoom: imageZoom }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        draggable={false}
                        style={{ transform: `scale(${imageZoom})` }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-black flex items-center justify-center">
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="text-center"
                        >
                          <Flame className="w-20 h-20 text-orange-500/30 mx-auto mb-4" />
                          <p className="text-slate-400 font-semibold text-lg">Bild wird geladen...</p>
                        </motion.div>
                      </div>
                    )}

                    {/* Enhanced Text Overlay */}
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, duration: 0.4 }}
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-6 sm:p-10 text-white"
                    >
                      <motion.h3
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="text-2xl sm:text-4xl font-bold mb-2 font-serif"
                      >
                        {displayImages[selectedImage].category || displayImages[selectedImage].title}
                      </motion.h3>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25, duration: 0.3 }}
                        className="flex items-center gap-3 text-orange-400 font-semibold"
                      >
                        <div className="w-8 h-1 bg-gradient-to-r from-orange-500 to-transparent rounded-full" />
                        <span>Bild {selectedImage + 1} von {displayImages.length}</span>
                      </motion.div>
                    </motion.div>

                    {/* Classic Navigation Buttons - Left */}
                    <motion.button
                      whileHover={{ scale: 1.1, x: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedImage(prev => prev === 0 ? displayImages.length - 1 : prev! - 1)}
                      className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-40 group/btn"
                      aria-label="Previous image"
                    >
                      <motion.div
                        className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg hover:bg-white/25 hover:border-white/60 transition-all duration-300"
                      >
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white rotate-180" strokeWidth={2} />
                      </motion.div>
                    </motion.button>

                    {/* Classic Navigation Buttons - Right */}
                    <motion.button
                      whileHover={{ scale: 1.1, x: 4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedImage(prev => prev === displayImages.length - 1 ? 0 : prev! + 1)}
                      className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 group/btn"
                      aria-label="Next image"
                    >
                      <motion.div
                        className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg hover:bg-white/25 hover:border-white/60 transition-all duration-300"
                      >
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2} />
                      </motion.div>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center"
        >
          <Link href="/gallery">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold text-sm sm:text-base rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
            >
              Vollständige Galerie ansehen
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.div>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// Avatar Image Component with Error Handling
function AvatarImage({ src, name }: { src?: string; name: string }) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    'bg-orange-500',
    'bg-amber-500',
    'bg-red-500',
    'bg-pink-500',
    'bg-purple-500',
    'bg-blue-500',
  ];

  const colorIndex = name.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];

  if (!src || imageError) {
    return (
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-orange-200 ${bgColor}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className="relative w-14 h-14">
      {isLoading && (
        <div className={`absolute inset-0 rounded-full animate-pulse ${bgColor}/30`} />
      )}
      <img
        src={src}
        alt={name}
        onError={() => setImageError(true)}
        onLoad={() => setIsLoading(false)}
        className="w-14 h-14 rounded-full object-cover border-2 border-orange-200"
      />
    </div>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-slate-50 to-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-6"
        >
          <h2 className="text-5xl lg:text-7xl font-black text-slate-900 mb-4" style={{ 
            fontFamily: "'Playfair Display', Georgia, serif",
            letterSpacing: '-0.02em'
          }}>
            Was unsere Gäste sagen
          </h2>
          <div className="h-1.5 w-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mx-auto"></div>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto font-light" style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
            Echte Bewertungen von Google Maps unserer zufriedenen Gäste
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockTestimonials.map((testimonial, idx) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
            >
              <Card className="p-8 border-0 bg-white hover:shadow-xl rounded-3xl h-full flex flex-col shadow-lg transition-all duration-300 overflow-hidden">
                {/* Header: Avatar + Name + Date */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <AvatarImage 
                      src={testimonial.avatar}
                      name={testimonial.name}
                    />
                    <div>
                      <p className="font-bold text-slate-900 text-lg">{testimonial.name}</p>
                      <p className="text-sm text-slate-500">{testimonial.date}</p>
                    </div>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-slate-700 mb-6 leading-relaxed flex-grow">"{testimonial.text}"</p>

                {/* Details Section */}
                {testimonial.details && (
                  <div className="border-t border-slate-200 pt-6 mt-6">
                    <div className="space-y-3">
                      {/* Price Per Person */}
                      {testimonial.details.pricePerPerson && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">💰 Preis pro Person:</span>
                          <span className="font-semibold text-slate-900">{testimonial.details.pricePerPerson}</span>
                        </div>
                      )}

                      {/* Meal Type */}
                      {testimonial.details.mealType && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">🍽️ Mahlzeit:</span>
                          <span className="font-semibold text-slate-900">{testimonial.details.mealType}</span>
                        </div>
                      )}

                      {/* Group Size */}
                      {testimonial.details.groupSize && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">👥 Gruppengröße:</span>
                          <span className="font-semibold text-slate-900">{testimonial.details.groupSize}</span>
                        </div>
                      )}

                      {/* Seating Type */}
                      {testimonial.details.seatingType && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">🪑 Sitzbereich:</span>
                          <span className="font-semibold text-slate-900">{testimonial.details.seatingType}</span>
                        </div>
                      )}

                      {/* Wait Time */}
                      {testimonial.details.waitTime && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">⏱️ Wartezeit:</span>
                          <span className="font-semibold text-slate-900">{testimonial.details.waitTime}</span>
                        </div>
                      )}

                      {/* Noise Level */}
                      {testimonial.details.noiseLevel && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">🔊 Geräuschpegel:</span>
                          <span className="font-semibold text-slate-900">{testimonial.details.noiseLevel}</span>
                        </div>
                      )}

                      {/* Vegetarian Info */}
                      {testimonial.details.vegetarianRecommendation && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">🥗 Vegetarier:</span>
                          <span className="font-semibold text-emerald-600">{testimonial.details.vegetarianRecommendation}</span>
                        </div>
                      )}

                      {testimonial.details.vegetarianOfferings && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">🌱 Angebot:</span>
                          <span className="font-semibold text-emerald-600">{testimonial.details.vegetarianOfferings}</span>
                        </div>
                      )}

                      {/* Rating Section - Food, Service, Atmosphere */}
                      {(testimonial.details.food || testimonial.details.service || testimonial.details.atmosphere) && (
                        <div className="pt-3 border-t border-slate-100">
                          <div className="space-y-2">
                            {testimonial.details?.food && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">🍽️ Essen</span>
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < testimonial.details?.food!
                                          ? 'text-amber-400 fill-amber-400'
                                          : 'text-slate-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {testimonial.details?.service && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">🤝 Service</span>
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < testimonial.details?.service!
                                          ? 'text-amber-400 fill-amber-400'
                                          : 'text-slate-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {testimonial.details?.atmosphere && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">✨ Atmosphäre</span>
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < testimonial.details?.atmosphere!
                                          ? 'text-amber-400 fill-amber-400'
                                          : 'text-slate-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Google Badge */}
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Bewertung von Google
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="w-full bg-white overflow-x-hidden">
      <WelcomePopup />
      <HeroSection />
      <HighlightsSection />
      <PopularDishesSection />
      <OpeningHoursSection />
      <LocationSection />
      <GallerySection />
      <TestimonialsSection />
    </div>
  );
}
