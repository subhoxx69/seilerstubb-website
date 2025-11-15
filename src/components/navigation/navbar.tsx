'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, LogOut, LogIn, User, Shield, ChevronDown, Sparkles, MessageSquare, Calendar, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/lib/firebase/config';
import { signOutUser, isUserAdmin } from '@/lib/firebase/auth-context-service';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NavbarProps {
  hideOnRoutes?: string[];
}

const PRIMARY_COLOR = '#da671f';

export default function Navbar({ hideOnRoutes = [] }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  
  const shouldHideNavbar = hideOnRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const adminStatus = await isUserAdmin(currentUser.uid);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      setIsMenuOpen(false);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to sign out');
    }
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Menu', path: '/menu' },
    { label: 'Reservation', path: '/reservation' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Contact', path: '/contact' },
  ];

  if (shouldHideNavbar) {
    return null;
  }

  const navClass = isScrolled ? 'bg-white/98 backdrop-blur-xl shadow-lg border-b border-slate-100' : 'bg-gradient-to-b from-white/95 to-transparent';

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${navClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo - Premium Typography */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex items-center gap-2 group"
          >
            {/* Premium Icon - Restaurant Logo */}
            <motion.div
              whileHover={{ scale: 1.15, rotate: 5 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="relative bg-gradient-to-br from-slate-950 to-black rounded-lg p-2.5 shadow-xl group-hover:shadow-orange-500/50 transition-all duration-300 flex items-center justify-center border border-slate-800">
                <Image 
                  src="/images/Logo/Logo seilerstubb.png" 
                  alt="Seilerstubb Logo" 
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
              </div>
            </motion.div>

            <Link 
              href="/" 
              className="relative group/logo flex flex-col leading-none" 
            >
              {/* Premium Font Styling */}
              <motion.span 
                className="text-2xl lg:text-3xl font-black tracking-tight transition-all duration-300 group-hover/logo:opacity-75"
                style={{ 
                  color: PRIMARY_COLOR,
                  fontFamily: "'Bodoni Moda', 'Playfair Display', 'Georgia', serif",
                  letterSpacing: '-0.02em',
                  fontWeight: 700
                }}
              >
                Seilerstubb
              </motion.span>
              
              {/* Elegant Subtitle */}
              <motion.span 
                className="text-[10px] tracking-widest text-slate-500 font-light"
                style={{ 
                  fontFamily: "'Crimson Text', 'Georgia', serif",
                  letterSpacing: '0.12em'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                DEUTSCHE & INDISCHE KÜCHE
              </motion.span>

              {/* Premium Underline */}
              <motion.div 
                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400"
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.4 }}
              />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.div 
            className="hidden lg:flex items-center gap-0.5"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {navLinks.map((link, idx) => {
              const isActive = pathname === link.path;
              return (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 * idx }}
                >
                  <Link
                    href={link.path}
                    className={`relative px-5 py-2.5 text-sm font-semibold transition-all duration-300 group overflow-hidden rounded-xl ${
                      isActive
                        ? 'text-slate-900'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", letterSpacing: '0.3px' }}
                  >
                    {/* Premium Animated Background */}
                    <motion.div 
                      className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-r from-orange-100 to-amber-100' 
                          : 'bg-slate-50'
                      }`}
                      whileHover={{ backgroundColor: isActive ? undefined : 'rgba(15, 23, 42, 0.08)' }}
                      style={{ zIndex: -1 }}
                    />
                    
                    {/* Glow Effect on Hover */}
                    {!isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400/0 via-orange-400/0 to-orange-400/0 group-hover:from-orange-400/5 group-hover:via-orange-400/10 group-hover:to-orange-400/5 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-lg" />
                    )}
                    
                    <span className="relative font-medium">{link.label}</span>
                    
                    {/* Active Indicator with Enhanced Animation */}
                    {isActive && (
                      <motion.div 
                        layoutId="activeIndicator"
                        className="absolute bottom-1 left-2 right-2 h-1 rounded-full bg-gradient-to-r shadow-lg"
                        style={{ backgroundImage: `linear-gradient(90deg, ${PRIMARY_COLOR}, ${PRIMARY_COLOR}cc)` }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    
                    {/* Enhanced Underline on Hover */}
                    {!isActive && (
                      <motion.div 
                        className="absolute bottom-1 left-0 w-0 h-1 rounded-full shadow-md"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                        whileHover={{ width: 'calc(100% - 1rem)' }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Desktop Auth & CTA */}
          <motion.div 
            className="hidden lg:flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {!user ? (
              <Link href="/auth/signin">
                <motion.button 
                  className="group relative p-2.5 rounded-full transition-all duration-300 hover:bg-orange-50"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.85 }}
                >
                  {/* Premium Glow Background - Enhanced */}
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400/30 to-amber-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  
                  {/* Icon Background Ring */}
                  <motion.div 
                    className="absolute inset-0 rounded-full border-2 border-orange-200 opacity-0 group-hover:opacity-100"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                  />
                  
                  <LogIn className="w-6 h-6 text-orange-600 transition-all duration-300 group-hover:text-orange-700 relative z-10 stroke-current" strokeWidth={2} />
                  
                  {/* Premium Tooltip - Enhanced */}
                  <motion.span 
                    className="absolute -bottom-11 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none bg-gradient-to-br from-white to-slate-50 backdrop-blur-md px-4 py-2 rounded-lg shadow-xl border border-slate-200"
                    initial={{ opacity: 0, y: -5 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
                  >
                    Sign In
                  </motion.span>
                </motion.button>
              </Link>
            ) : (
              <div className="flex items-center gap-5">
                {isAdmin && (
                  <Link href="/routes/admin">
                    <motion.button 
                      className="group relative p-2.5 rounded-full transition-all duration-300 hover:bg-purple-50"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.85 }}
                      title="Admin Dashboard"
                    >
                      {/* Purple Glow for Admin - Enhanced */}
                      <motion.div 
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/30 to-pink-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                      />
                      
                      {/* Icon Background Ring */}
                      <motion.div 
                        className="absolute inset-0 rounded-full border-2 border-purple-200 opacity-0 group-hover:opacity-100"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                      />
                      
                      <Shield className="w-6 h-6 text-purple-600 transition-all duration-300 group-hover:text-purple-700 relative z-10 stroke-current" strokeWidth={2.2} />
                      
                      {/* Premium Tooltip */}
                      <motion.span 
                        className="absolute -bottom-11 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none bg-gradient-to-br from-white to-slate-50 backdrop-blur-md px-4 py-2 rounded-lg shadow-xl border border-slate-200"
                        initial={{ opacity: 0, y: -5 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
                      >
                        Admin Panel
                      </motion.span>
                    </motion.button>
                  </Link>
                )}
                
                {/* Premium User Profile Dropdown - Enhanced */}
                <motion.div 
                  ref={profileDropdownRef}
                  className="relative"
                >
                  {/* Profile Button */}
                  <motion.button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-br from-slate-50 via-slate-100 to-slate-100 border-2 border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden relative backdrop-blur-sm"
                    whileHover={{ y: -3 }}
                  >
                    {/* Premium Animated Background */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-400/8 to-orange-400/0 opacity-0 group-hover:opacity-100 rounded-full"
                      animate={{ x: [-100, 100] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    
                    {/* Avatar with Premium Styling - Enhanced */}
                    <motion.div 
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg relative z-10 font-bold text-white text-sm border-2 border-orange-400 overflow-hidden flex-shrink-0"
                      whileHover={{ scale: 1.15, rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.email?.charAt(0).toUpperCase()
                      )}
                    </motion.div>
                    
                    {/* User Info */}
                    <div className="flex flex-col relative z-10">
                      <motion.span 
                        className="text-xs font-bold text-slate-900"
                        initial={{ opacity: 0.8 }}
                        whileHover={{ opacity: 1 }}
                        style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", letterSpacing: '0.3px' }}
                      >
                        {user.email?.split('@')[0]}
                      </motion.span>
                      <span className="text-xs text-slate-500 font-semibold">{isAdmin ? '👑 Admin' : '✓ Member'}</span>
                    </div>

                    {/* Chevron Icon */}
                    <motion.div
                      animate={{ rotate: isProfileDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative z-10"
                    >
                      <ChevronDown className="w-4 h-4 text-slate-600 stroke-current" strokeWidth={2.5} />
                    </motion.div>
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isProfileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50"
                      >
                        {/* Menu Header */}
                        <div className="px-4 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-slate-200">
                          <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                          <p className="text-xs text-slate-600 mt-1">{isAdmin ? '👑 Administrator Account' : '✓ Member Account'}</p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          {/* Profile */}
                          <Link href="/routes/user/profile" onClick={() => setIsProfileDropdownOpen(false)}>
                            <motion.div
                              className="px-4 py-3 hover:bg-slate-50 transition-colors duration-200 cursor-pointer flex items-center gap-3 group"
                              whileHover={{ x: 4 }}
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-100 transition-colors">
                                <User className="w-4 h-4 text-blue-600 stroke-current" strokeWidth={2.5} />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900">Profile Settings</p>
                                <p className="text-xs text-slate-500">Edit profile & security</p>
                              </div>
                            </motion.div>
                          </Link>

                          {/* Reservations */}
                          <Link href="/routes/user/reservations" onClick={() => setIsProfileDropdownOpen(false)}>
                            <motion.div
                              className="px-4 py-3 hover:bg-slate-50 transition-colors duration-200 cursor-pointer flex items-center gap-3 group relative"
                              whileHover={{ x: 4 }}
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center group-hover:from-amber-200 group-hover:to-amber-100 transition-colors">
                                <Calendar className="w-4 h-4 text-amber-600 stroke-current" strokeWidth={2.5} />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900">My Reservations</p>
                                <p className="text-xs text-slate-500">View & edit bookings</p>
                              </div>
                            </motion.div>
                          </Link>

                          {/* Messages */}
                          <Link href="/contact/messages" onClick={() => setIsProfileDropdownOpen(false)}>
                            <motion.div
                              className="px-4 py-3 hover:bg-slate-50 transition-colors duration-200 cursor-pointer flex items-center gap-3 group relative"
                              whileHover={{ x: 4 }}
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center group-hover:from-green-200 group-hover:to-green-100 transition-colors">
                                <Mail className="w-4 h-4 text-green-600 stroke-current" strokeWidth={2.5} />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900">My Messages</p>
                                <p className="text-xs text-slate-500">Contact conversations</p>
                              </div>
                            </motion.div>
                          </Link>

                          {/* Divider */}
                          <div className="my-2 border-t border-slate-200" />

                          {/* Logout */}
                          <motion.button
                            onClick={() => {
                              handleLogout();
                              setIsProfileDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 hover:bg-red-50 transition-colors duration-200 flex items-center gap-3 group text-left"
                            whileHover={{ x: 4 }}
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center group-hover:from-red-200 group-hover:to-red-100 transition-colors">
                              <LogOut className="w-4 h-4 text-red-600 stroke-current" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-900">Sign Out</p>
                              <p className="text-xs text-slate-500">Logout from account</p>
                            </div>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}
          </motion.div>

          {/* Mobile menu button - Enhanced */}
          <motion.button 
            className="lg:hidden flex items-center justify-center p-2.5 hover:bg-orange-50 rounded-lg transition-all duration-300 relative group" 
            onClick={toggleMenu}
            aria-label="Toggle menu"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
          >
            {/* Premium Glow on Hover */}
            <motion.div 
              className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-400/15 to-orange-400/10 opacity-0 group-hover:opacity-100 blur-md"
              transition={{ duration: 0.3 }}
            />
            
            {/* Border on Hover */}
            <motion.div 
              className="absolute inset-0 rounded-lg border-2 border-orange-200 opacity-0 group-hover:opacity-100"
              transition={{ duration: 0.3 }}
            />
            
            {/* Animated Menu Icon */}
            <AnimatePresence mode="wait">
              {isMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10"
                >
                  <X className="h-6 w-6 text-slate-900 stroke-current" strokeWidth={2.5} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10"
                >
                  <Menu className="h-6 w-6 text-slate-900 stroke-current" strokeWidth={2.5} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="lg:hidden bg-gradient-to-b from-white via-white/95 to-slate-50/90 backdrop-blur-md border-t border-slate-200 shadow-2xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <motion.div 
              className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {navLinks.map((link, idx) => {
                const isActive = pathname === link.path;
                return (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: 0.05 + idx * 0.05, duration: 0.3 }}
                  >
                  <Link
                    href={link.path}
                    className={`group flex items-center px-5 py-3 rounded-xl transition-all duration-300 font-semibold relative overflow-hidden text-sm ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {/* Animated Background Gradient */}
                    {isActive ? (
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-500 shadow-lg rounded-xl"
                        layoutId="mobileActiveIndicator"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    ) : (
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-orange-400/0 to-orange-400/8 opacity-0 group-hover:opacity-100 rounded-xl"
                        whileHover={{ x: [0, 8, 0] }}
                        transition={{ duration: 0.4 }}
                      />
                    )}
                    
                    <span 
                      className="relative z-10 font-semibold"
                      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", letterSpacing: '0.3px' }}
                    >
                      {link.label}
                    </span>
                  </Link>
                  </motion.div>
                );
              })}
              
              {/* Mobile Auth Section */}
              <motion.div 
                className="my-3 pt-3 border-t border-slate-200 space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              >
                {!user ? (
                  <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)} className="block">
                    <motion.button 
                      className="w-full rounded-lg text-white py-3.5 font-bold transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-2xl shadow-lg overflow-hidden relative group bg-gradient-to-r from-orange-500 to-amber-600"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {/* Premium Glow */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-orange-400/50 to-amber-400/50 blur-lg opacity-0 group-hover:opacity-60"
                      />
                      <LogIn className="w-5 h-5 transition-transform duration-300 relative z-10 group-hover:translate-x-1 stroke-current" strokeWidth={2.5} />
                      <span className="relative z-10" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", letterSpacing: '0.3px', fontWeight: 700 }}>
                        Sign In
                      </span>
                    </motion.button>
                  </Link>
                ) : (
                  <>
                    {isAdmin && (
                      <Link href="/routes/admin" onClick={() => setIsMenuOpen(false)} className="block">
                        <motion.button 
                          className="w-full rounded-lg text-white py-3.5 font-bold transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-2xl shadow-lg overflow-hidden relative group bg-gradient-to-r from-purple-600 to-pink-600 mb-2"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {/* Premium Glow */}
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-purple-500/50 to-pink-500/50 blur-lg opacity-0 group-hover:opacity-60"
                          />
                          <Shield className="w-5 h-5 relative z-10 stroke-current" strokeWidth={2.2} />
                          <span className="relative z-10" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", letterSpacing: '0.3px', fontWeight: 700 }}>
                            Admin Panel
                          </span>
                        </motion.button>
                      </Link>
                    )}

                    {/* Mobile User Profile Menu - Enhanced */}
                    <motion.div 
                      className="px-5 py-3.5 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 space-y-2 shadow-lg hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
                      whileHover={{ y: -2 }}
                    >
                      {/* Animated Background */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-400/8 to-orange-400/0 opacity-0 group-hover:opacity-100 rounded-lg"
                        animate={{ x: [-100, 100] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />

                      {/* User Info Header */}
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-300 relative z-10">
                        <motion.div 
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-md font-bold text-white text-sm border-2 border-orange-400 overflow-hidden"
                          whileHover={{ scale: 1.15, rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            user.email?.charAt(0).toUpperCase()
                          )}
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", letterSpacing: '0.3px' }}>
                            {user.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-slate-500 font-semibold">{isAdmin ? '👑 Administrator' : '✓ Member'}</p>
                        </div>
                      </div>

                      {/* Profile Link */}
                      <Link href="/routes/user/profile" onClick={() => setIsMenuOpen(false)} className="block">
                        <motion.div
                          className="px-3 py-2.5 hover:bg-slate-100 rounded-lg transition-colors duration-200 flex items-center gap-3 relative z-10 group/item"
                          whileHover={{ x: 4 }}
                        >
                          <User className="w-5 h-5 text-blue-600 stroke-current flex-shrink-0" strokeWidth={2.5} />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">Profile Settings</p>
                            <p className="text-xs text-slate-500">Edit & manage account</p>
                          </div>
                        </motion.div>
                      </Link>

                      {/* Reservations Link */}
                      <Link href="/routes/user/reservations" onClick={() => setIsMenuOpen(false)} className="block">
                        <motion.div
                          className="px-3 py-2.5 hover:bg-slate-100 rounded-lg transition-colors duration-200 flex items-center gap-3 relative z-10 group/item"
                          whileHover={{ x: 4 }}
                        >
                          <Calendar className="w-5 h-5 text-amber-600 stroke-current flex-shrink-0" strokeWidth={2.5} />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">My Reservations</p>
                            <p className="text-xs text-slate-500">View & edit bookings</p>
                          </div>
                        </motion.div>
                      </Link>

                      {/* Messages Link */}
                      <Link href="/contact/messages" onClick={() => setIsMenuOpen(false)} className="block">
                        <motion.div
                          className="px-3 py-2.5 hover:bg-slate-100 rounded-lg transition-colors duration-200 flex items-center gap-3 relative z-10 group/item"
                          whileHover={{ x: 4 }}
                        >
                          <Mail className="w-5 h-5 text-green-600 stroke-current flex-shrink-0" strokeWidth={2.5} />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">My Messages</p>
                            <p className="text-xs text-slate-500">Contact conversations</p>
                          </div>
                        </motion.div>
                      </Link>

                      {/* Logout Button */}
                      <motion.button 
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-3 py-2.5 hover:bg-red-50 rounded-lg transition-colors duration-200 flex items-center gap-3 relative z-10 group/item text-left mt-2 pt-3 border-t border-slate-300"
                        whileHover={{ x: 4 }}
                      >
                        <LogOut className="w-5 h-5 text-red-600 stroke-current flex-shrink-0" strokeWidth={2.5} />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">Sign Out</p>
                          <p className="text-xs text-slate-500">Logout from account</p>
                        </div>
                      </motion.button>
                    </motion.div>
                  </>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
