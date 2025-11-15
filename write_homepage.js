const fs = require('fs');

const code = `'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, MapPin, Phone, Clock, Users, Instagram, Facebook, Youtube, ChevronRight, Star, Flame, Copy, Check, AlertCircle, Leaf, X } from 'lucide-react';

const mockMenuItems = [
  { id: '1', name: 'Butter Chicken', description: 'Tender chicken in creamy tomato sauce', price: 14.99, vegetarian: false, spicy: false },
  { id: '2', name: 'Palak Paneer', description: 'Cottage cheese in spinach sauce', price: 12.99, vegetarian: true, spicy: false },
  { id: '3', name: 'Tandoori Chicken', description: 'Marinated and char-grilled chicken', price: 13.99, vegetarian: false, spicy: true },
  { id: '4', name: 'Chana Masala', description: 'Spiced chickpeas in tomato gravy', price: 10.99, vegetarian: true, spicy: true },
  { id: '5', name: 'Biryani', description: 'Fragrant rice with meat and spices', price: 13.99, vegetarian: false, spicy: true },
  { id: '6', name: 'Samosa', description: 'Crispy pastry with potato filling', price: 4.99, vegetarian: true, spicy: false },
];

const mockGalleryImages = [
  { id: '1', title: 'Restaurant Interior' },
  { id: '2', title: 'Signature Dishes' },
  { id: '3', title: 'Open Kitchen' },
  { id: '4', title: 'Family Dining' },
  { id: '5', title: 'Evening Ambiance' },
  { id: '6', title: 'Bar Area' },
];

const mockTestimonials = [
  { id: '1', name: 'Maria Schmidt', text: 'Authentische indische Küche mit freundlichem Service. Absolut empfehlenswert!', rating: 5 },
  { id: '2', name: 'Hans Weber', text: 'Das beste indische Restaurant in Wiesbaden. Wir kommen gerne wieder!', rating: 5 },
  { id: '3', name: 'Anjali Patel', text: 'Fantastische Spices und großartige Atmosphäre. Family-friendly und lecker!', rating: 5 },
];

const mockRestaurantInfo = {
  name: 'Seilerstubb Restaurant',
  address: 'Seilerpfad 4, 65205 Wiesbaden',
  phone: '+49 611 123456',
  email: 'info@seilerstubb.de',
};

function StickyNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'Menu', href: '/menu' },
    { label: 'Reservation', href: '/reservation' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Contact', href: '/contact' },
    { label: 'Account', href: '/auth/signin' },
  ];

  const navClass = isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white/80 backdrop-blur-md';

  return (
    <motion.nav className={\`fixed top-0 left-0 right-0 z-50 transition-all duration-300 \${navClass}\`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent hidden sm:inline">Seilerstubb</span>
        </Link>
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-300">
              {link.label}
            </Link>
          ))}
        </div>
        <Link href="/reservation" className="hidden lg:block">
          <Button className="rounded-full bg-orange-600 hover:bg-orange-700 text-white px-6 shadow-lg hover:shadow-xl transition-all">
            Tisch reservieren
          </Button>
        </Link>
        <div className="lg:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-0 px-0">
              <div className="flex flex-col h-full">
                <div className="px-6 py-4 border-b">
                  <span className="font-bold">Menü</span>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="block px-4 py-3 text-slate-700 hover:bg-orange-50 rounded-lg">
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="p-6 border-t">
                  <Link href="/reservation" onClick={() => setIsOpen(false)} className="w-full block">
                    <Button className="w-full rounded-full bg-orange-600 hover:bg-orange-700">Tisch reservieren</Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
}

function HeroSection() {
  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden pt-20">
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-slate-900/50" />
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-4">
            Authentische <span className="text-transparent bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text">Indische</span> Küche
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-lg sm:text-xl text-slate-200 mb-8 max-w-2xl mx-auto">
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
    { icon: Flame, title: 'Frisch zubereitet', description: 'Jeden Tag mit den besten Zutaten' },
    { icon: Leaf, title: 'Vegetarische Optionen', description: 'Vielfältige fleischlose Gerichte' },
    { icon: Users, title: 'Familienfreundlich', description: 'Willkommen für alle Altersgruppen' },
    { icon: MapPin, title: 'Zentrale Lage', description: 'Leicht erreichbar in Wiesbaden' },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-slate-50 to-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {highlights.map((highlight, idx) => {
          const Icon = highlight.icon;
          return (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: idx * 0.1 }} viewport={{ once: true }}>
              <Card className="p-6 border-0 bg-white hover:shadow-lg rounded-2xl cursor-pointer group">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl group-hover:from-orange-200 group-hover:to-amber-200">
                    <Icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{highlight.title}</h3>
                  <p className="text-sm text-slate-600">{highlight.description}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function PopularDishesSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-4xl lg:text-5xl font-bold text-slate-900 mb-12 text-center">
          Beliebte Gerichte
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockMenuItems.map((dish, idx) => (
            <motion.div key={dish.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} viewport={{ once: true }}>
              <Card className="overflow-hidden border-0 hover:shadow-xl rounded-2xl group">
                <div className="aspect-video bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Flame className="w-12 h-12 text-orange-300 opacity-50" />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 text-lg">{dish.name}</h3>
                    <div className="flex gap-1">
                      {dish.vegetarian && <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">🌱</span>}
                      {dish.spicy && <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">🌶️</span>}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{dish.description}</p>
                  <span className="text-lg font-bold text-orange-600">€{dish.price.toFixed(2)}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-12">
          <Link href="/menu">
            <Button className="rounded-full bg-orange-600 hover:bg-orange-700 px-8 py-3">
              Zur Speisekarte
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
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

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-orange-50 to-amber-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 border-0 shadow-lg rounded-2xl">
          <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-orange-600" />
            Öffnungszeiten
          </h3>
          <div className="space-y-3">
            {dayNames.map((day, idx) => {
              const isToday = idx === today;
              const bgClass = isToday ? 'bg-orange-100' : 'bg-slate-50';
              return (
                <div key={day} className={\`flex justify-between text-sm py-2 px-3 rounded-lg \${bgClass}\`}>
                  <span className={isToday ? 'font-semibold' : ''}>{day}</span>
                  <span className={isToday ? 'font-semibold text-orange-600' : ''}>11:30 - 23:00</span>
                </div>
              );
            })}
          </div>
        </Card>
        <div className="flex flex-col justify-center space-y-4">
          <h3 className="text-2xl font-bold text-slate-900">Reservierung</h3>
          <p className="text-slate-600">Wir freuen uns auf Ihren Besuch. Reservieren Sie Ihren Platz jetzt!</p>
          <Link href="/reservation">
            <Button className="rounded-full bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">
              Tisch reservieren
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function LocationSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900">Finden Sie uns</h2>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 group">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-orange-600 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900">Telefon</p>
                    <p className="text-slate-600">{mockRestaurantInfo.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <a href={\`tel:\${mockRestaurantInfo.phone}\`} className="flex-1">
              <Button className="w-full rounded-full bg-orange-600 hover:bg-orange-700">Anrufen</Button>
            </a>
            <a href={\`https://maps.google.com/?q=\${mockRestaurantInfo.address}\`} target="_blank" className="flex-1">
              <Button variant="outline" className="w-full rounded-full">Route</Button>
            </a>
          </div>
        </div>
        <div className="aspect-video rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
          <p className="text-white/70 text-sm">Google Maps Integration</p>
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
              <motion.div key={image.id} whileHover={{ scale: 1.05 }} className={\`group relative rounded-2xl overflow-hidden shadow-lg \${colSpan}\`}>
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
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-orange-50 to-amber-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-12 text-center">Was unsere Gäste sagen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTestimonials.map((testimonial) => (
            <motion.div key={testimonial.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <Card className="p-6 border-0 bg-white hover:shadow-lg rounded-2xl h-full">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4 italic">"{testimonial.text}"</p>
                <p className="font-semibold text-slate-900">– {testimonial.name}</p>
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
                <a href={\`tel:\${mockRestaurantInfo.phone}\`} className="hover:text-orange-400">
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
      <StickyNav />
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
`;

fs.writeFileSync('src/app/(home)/page.tsx', code, 'utf8');
console.log('File written successfully!');
