'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJ9oD4-RAZ01J-U9MO2epTbOpj5eQZAHt32c6tz95_k_OiQaA=w36-h36-p-rp-mo-ba3-br100',
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
    name: 'Google Nutzer',
    text: 'Mit 5 Personen waren wir dort essen. Alle hatten unterschiedliche indische Gerichte – vegetarisch, Huhn und Fisch Curry. Alles hat uns sehr gut geschmeckt. Nicht zu scharf, nicht zu lasch, genau richtig, ebenso die Portionen. Wir kommen gerne wieder!',
    rating: 5,
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocKlps2lli6qFu-h6OL0uLCNYq6lON7WtcJBI2xUyKgELSa1Zg=w36-h36-p-rp-mo-ba4-br100',
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
  name: ' ',
  address: 'Seilerpfad 4, 65205 Wiesbaden',
  phone: '+49 611 123456',
  email: 'info@seilerstubb.de',
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
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/75 to-slate-900/60" />
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-6">
            <p className="text-sm sm:text-base tracking-widest uppercase font-light text-amber-300 mb-2">Willkommen bei</p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              Seilerstubb
            </h1>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-6">
            <span className="text-transparent bg-gradient-to-r from-orange-300 via-amber-300 to-yellow-300 bg-clip-text">Deutsche & Indische Küche</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-lg sm:text-xl text-slate-100 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
            Authentische indische Aromen in Wiesbaden. Frisch zubereitet, voller Leidenschaft.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/reservation">
              <Button className="rounded-full bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl">
                Tisch reservieren
              </Button>
            </Link>
            <Link href="/menu">
              <Button variant="outline" className="rounded-full border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                Speisekarte ansehen
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
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
          className="text-center mb-20"
        >
          <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            Herzlich Willkommen
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Im Herzen von Wiesbaden vereinen wir seit Jahren die besten Traditionen deutscher und indischer Küche. Unser erfahrenes Küchenteam bereitet mit Leidenschaft und frischen Zutaten sowohl herzhafte deutsche Klassiker als auch authentische indische Spezialitäten zu. Bei uns finden Sie eine einzigartige kulinarische Reise, die Ihre Sinne verzaubern wird.
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
                    <h3 className="font-bold text-slate-900 text-xl lg:text-2xl group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-amber-600 group-hover:bg-clip-text transition-all duration-300">
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
          className="text-center mb-16"
        >
          <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            Zahlungsmöglichkeiten
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Sichere Zahlung. Alle Zahlungen werden verschlüsselt verarbeitet. Sie können bei der Abholung oder im Restaurant bezahlen.
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
          });
        });

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

  if (isLoading) {
    return (
      <section className="py-16 sm:py-20 lg:py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-b-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Beliebte Gerichte werden geladen...</p>
        </div>
      </section>
    );
  }

  if (dishes.length === 0) {
    return (
      <section className="py-16 sm:py-20 lg:py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600 mb-6">Noch keine Favoriten vorhanden. Besuchen Sie die Speisekarte!</p>
          <Link href="/menu">
            <Button className="rounded-full bg-orange-600 hover:bg-orange-700 px-8 py-3">
              Zur Speisekarte
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-slate-50 to-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
            Beliebte Gerichte
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Entdecken Sie die Lieblingsgericht unserer Gäste
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dishes.map((dish, idx) => (
            <motion.div
              key={dish.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.12, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <Card className="overflow-hidden border-0 bg-white shadow-lg hover:shadow-2xl rounded-3xl h-full flex flex-col group transition-all duration-500">
                {/* Image Container - Enhanced */}
                <div className="relative w-full h-72 bg-gradient-to-br from-orange-100 via-amber-100 to-orange-50 overflow-hidden">
                  {dish.image ? (
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Flame className="w-20 h-20 text-orange-300 opacity-30" />
                    </div>
                  )}
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Ranking Badge - New */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: idx * 0.12 + 0.1, type: "spring", stiffness: 200 }}
                    className="absolute top-4 left-4 bg-gradient-to-br from-orange-500 to-amber-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg"
                  >
                    #{idx + 1}
                  </motion.div>
                </div>

                {/* Content Container - Premium */}
                <div className="p-7 flex-grow flex flex-col space-y-5">
                  {/* Title */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-2xl line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors duration-300">
                      {dish.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-slate-600 line-clamp-2 flex-grow leading-relaxed text-sm">
                    {dish.description}
                  </p>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                  {/* Price and Action Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-slate-500">Ab</span>
                      <span className="text-3xl font-bold text-orange-600">€{dish.price.toFixed(2)}</span>
                    </div>
                    <Link href="/menu">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Link href="/menu">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="rounded-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                Alle Gerichte ansehen
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem('announcement_dismissed');
    if (wasDismissed) setDismissed(true);
  }, []);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="fixed top-20 left-4 right-4 z-40 max-w-md mx-auto">
        <Card className="border-0 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg p-4 flex items-start gap-4 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-900 flex-1">🎉 Wir haben neue Tagesspezialisierungen!</p>
          <button onClick={() => { setDismissed(true); localStorage.setItem('announcement_dismissed', 'true'); }} className="text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

function OpeningHoursSection() {
  const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  const today = new Date().getDay();

  const hours = [
    { label: 'Restaurant Öffnungszeiten', time: '11:30 - 23:00' },
    { label: 'Lieferzeiten', time: '17:00 - 22:30' },
    { label: 'Abholung verfügbar', time: '11:30 - 23:00' },
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Opening Hours Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
          >
            <Card className="p-8 border-0 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 h-full bg-white overflow-hidden group">
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative">
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl w-fit mb-6 shadow-lg"
                >
                  <Clock className="w-8 h-8 text-white" />
                </motion.div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-slate-900 mb-6 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 group-hover:bg-clip-text transition-all duration-300">
                  Öffnungszeiten
                </h3>

                {/* Hours List */}
                <div className="space-y-4">
                  {dayNames.map((day, idx) => {
                    const isToday = idx === today;
                    return (
                      <motion.div
                        key={day}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        viewport={{ once: true }}
                        className={`flex justify-between items-center py-3 px-4 rounded-xl transition-all duration-300 ${
                          isToday 
                            ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-l-4 border-blue-500' 
                            : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`text-sm font-medium ${isToday ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>
                          {day}
                        </span>
                        <span className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-slate-600'}`}>
                          11:30 - 23:00
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Delivery Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
          >
            <Card className="p-8 border-0 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 h-full bg-white overflow-hidden group">
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative">
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl w-fit mb-6 shadow-lg"
                >
                  <Truck className="w-8 h-8 text-white" />
                </motion.div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-slate-900 mb-6 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-amber-600 group-hover:bg-clip-text transition-all duration-300">
                  Lieferung
                </h3>

                {/* Delivery Info */}
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl">
                    <p className="text-sm font-semibold text-orange-900">Lieferzeiten</p>
                    <p className="text-lg font-bold text-orange-600 mt-1">17:00 - 22:30</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <p className="text-sm font-semibold text-slate-700">Lieferkostenfrei</p>
                    <p className="text-sm text-slate-600 mt-1">Ab 15,00 € Bestellwert</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Pickup Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
          >
            <Card className="p-8 border-0 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 h-full bg-white overflow-hidden group">
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative">
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl w-fit mb-6 shadow-lg"
                >
                  <Utensils className="w-8 h-8 text-white" />
                </motion.div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-slate-900 mb-6 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-teal-600 group-hover:bg-clip-text transition-all duration-300">
                  Abholung
                </h3>

                {/* Pickup Info */}
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl">
                    <p className="text-sm font-semibold text-emerald-900">Abholzeiten</p>
                    <p className="text-lg font-bold text-emerald-600 mt-1">11:30 - 23:00</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <p className="text-sm font-semibold text-slate-700">Mindestbestellung</p>
                    <p className="text-sm text-slate-600 mt-1">Keine Mindestbestellung</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

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
                href={`tel:${mockRestaurantInfo.phone}`}
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
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-slate-50 to-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-12 text-center">Galerie</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[200px]">
          {mockGalleryImages.map((image, idx) => {
            const colSpan = idx === 0 ? 'md:col-span-2' : '';
            return (
              <motion.div key={image.id} whileHover={{ scale: 1.05 }} className={`group relative rounded-2xl overflow-hidden shadow-lg ${colSpan}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-amber-200 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 flex items-end p-4 z-10">
                  <p className="text-white font-semibold text-sm">{image.title}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-12">
          <Link href="/gallery">
            <Button className="rounded-full bg-orange-600 hover:bg-orange-700 px-8 py-3">
              Mehr ansehen
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
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
          className="text-center mb-16"
        >
          <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
            Was unsere Gäste sagen
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Lesen Sie echte Bewertungen von Google Maps unserer zufriedenen Gäste
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
                    <img
                      src={testimonial.avatar || ''}
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-orange-200"
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
                            {testimonial.details.food && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">🍽️ Essen</span>
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < (testimonial.details?.food || 0)
                                          ? 'text-amber-400 fill-amber-400'
                                          : 'text-slate-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {testimonial.details.service && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">🤝 Service</span>
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < (testimonial.details?.service || 0)
                                          ? 'text-amber-400 fill-amber-400'
                                          : 'text-slate-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {testimonial.details.atmosphere && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">✨ Atmosphäre</span>
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < (testimonial.details?.atmosphere || 0)
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

function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-slate-900 to-slate-800 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Aktuelle Angebote erhalten</h2>
        <p className="text-lg text-slate-300 mb-8">Abonnieren Sie unseren Newsletter für exklusive Angebote und Updates.</p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ihre E-Mail-Adresse" className="flex-1 px-6 py-3 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
          <Button type="submit" className="rounded-full bg-orange-600 hover:bg-orange-700 px-8 py-3 whitespace-nowrap">
            Abonnieren
          </Button>
        </form>
        {subscribed && <p className="text-green-400 mt-4 text-sm">✓ Vielen Dank!</p>}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Kontakt
            </h3>
            <div className="space-y-3 text-sm">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {mockRestaurantInfo.address}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href={`tel:${mockRestaurantInfo.phone}`} className="hover:text-orange-400">
                  {mockRestaurantInfo.phone}
                </a>
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4">Öffnungszeiten</h3>
            <p className="text-sm">Mo. - Fr.: 11:30 - 23:00</p>
            <p className="text-sm">Sa.: 11:30 - 00:00</p>
            <p className="text-sm">So.: 12:00 - 23:00</p>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4">Rechtliches</h3>
            <Link href="/privacy" className="text-sm hover:text-orange-400 block">
              Datenschutz
            </Link>
            <Link href="/terms" className="text-sm hover:text-orange-400 block">
              Impressum
            </Link>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-12 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-slate-400">© 2024 Seilerstubb. Alle Rechte vorbehalten.</p>
          <div className="flex gap-4 mt-6 sm:mt-0">
            <a href="https://instagram.com" target="_blank" className="text-slate-400 hover:text-orange-500">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://facebook.com" target="_blank" className="text-slate-400 hover:text-orange-500">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://youtube.com" target="_blank" className="text-slate-400 hover:text-orange-500">
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="w-full bg-white overflow-x-hidden">
      <AnnouncementBanner />
      <HeroSection />
      <HighlightsSection />
      <PopularDishesSection />
      <OpeningHoursSection />
      <LocationSection />
      <GallerySection />
      <TestimonialsSection />
      <NewsletterSection />
      <Footer />
    </div>
  );
}
