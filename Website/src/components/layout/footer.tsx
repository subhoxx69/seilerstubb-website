'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Facebook, Instagram, Youtube, Flame, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const PRIMARY_COLOR = '#E76F51';
const ACCENT_COLOR = '#F4A261';
const DARK_BG = '#1A1A1A';
const LIGHT_TEXT = '#F5F5F5';

interface OpeningHours {
  [key: string]: string;
}

interface SocialLink {
  name: string;
  url: string;
  visible: boolean;
  icon: React.ReactNode;
}

export default function Footer() {
  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    Montag: '11:30 - 23:00',
    Dienstag: '11:30 - 23:00',
    Mittwoch: '11:30 - 23:00',
    Donnerstag: '11:30 - 23:00',
    Freitag: '11:30 - 23:00',
    Samstag: '11:30 - 00:00',
    Sonntag: '12:00 - 23:00',
  });
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    { name: 'Instagram', url: 'https://www.instagram.com/seilerstubb_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==', visible: true, icon: <Instagram className="w-5 h-5" /> },
    { name: 'Google', url: 'https://google.com/maps/place/seilerstubb', visible: true, icon: <Flame className="w-5 h-5" /> },
  ]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <footer className="relative bg-slate-950 pt-20 pb-8">
      {/* Subtle background accents */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4-Column Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-12 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {/* Column 1: Restaurant Info & Social */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Seilerstubb
              </h3>
              <div className="h-0.5 w-12 bg-gradient-to-r from-orange-500 to-amber-500 mb-4"></div>
              <p className="text-slate-400 text-sm leading-relaxed" style={{ fontFamily: "'Crimson Text', Georgia, serif", fontSize: '16px' }}>
                Authentische deutsche und indische Küche in gemütlichem Ambiente. Ein Ort, an dem Tradition und Geschmack aufeinandertreffen.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 pt-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="text-slate-400 hover:text-orange-500 transition-colors"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Column 2: Quick Links */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Schnellzugriff</h4>
            <nav className="space-y-3">
              {[
                { href: '/menu', label: 'Speisekarte' },
                { href: '/reservation', label: 'Reservierung' },
                { href: '/gallery', label: 'Galerie' },
                { href: '/contact', label: 'Kontakt' },
              ].map((link) => (
                <motion.div key={link.href} whileHover={{ x: 4 }}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-orange-400 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <span className="w-1 h-1 bg-orange-500 rounded-full"></span>
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>

          {/* Column 3: Legal */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Rechtliches</h4>
            <nav className="space-y-3">
              {[
                { href: '/impressum', label: 'Impressum' },
                { href: '/privacy', label: 'Datenschutz' },
                { href: '/agb', label: 'AGB' },
                { href: '/cookie-richtlinie', label: 'Cookie-Richtlinie' },
              ].map((link, idx) => (
                <motion.div key={idx} whileHover={{ x: 4 }}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-orange-400 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <span className="w-1 h-1 bg-orange-500 rounded-full"></span>
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>

          {/* Column 4: Contact Info */}
          <motion.div variants={itemVariants} className="space-y-5">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Kontakt</h4>
            
            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <Phone className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-500 text-xs mb-1">Telefon</p>
                  <a href="tel:+4961136004940" className="text-slate-300 hover:text-orange-400 transition-colors font-medium">
                    +49 611 3600 4940
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-500 text-xs mb-1">Adresse</p>
                  <p className="text-slate-300 leading-relaxed">
                    Seilerpfad 4<br/>65205 Wiesbaden
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-500 text-xs mb-1">E-Mail</p>
                  <a href="mailto:seilerstubbwiesbaden@gmail.com" className="text-slate-300 hover:text-orange-400 transition-colors font-medium break-all text-sm">
                    seilerstubbwiesbaden@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <motion.a
              href="tel:+4961136004940"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="block mt-4"
            >
              <Button className="w-full rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold py-2 text-sm shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2">
                Anrufen <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Divider */}
        <motion.div
          className="h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent mb-8"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        />

        {/* Copyright Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs text-slate-500 font-medium"
        >
          <p>© 2025 Seilerstubb Restaurant. Alle Rechte vorbehalten.</p>
        </motion.div>
      </div>
    </footer>
  );
}
