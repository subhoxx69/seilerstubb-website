'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader, Search, Heart, Eye, Flame, Star, X, Info } from 'lucide-react';
import { subscribeToMenuItems, MenuItem } from '@/lib/firebase/menu-service-new';
import { motion, AnimatePresence } from 'framer-motion';
import { getOrderedCategories } from '@/lib/categories';
import {
  ALLERGEN_CODES,
  INGREDIENT_CODES,
  ALLERGEN_INGREDIENT_LAST_UPDATED,
  getAllergenCodesArray,
  getIngredientCodesArray,
  getAllergenDisplayText,
  getIngredientDisplayText,
} from '@/lib/allergens-ingredients';
import { AllergensIngredientsDisplay } from '@/components/menu/allergens-ingredients-display';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'popular'>('name');
  const [showAllergensModal, setShowAllergensModal] = useState(false);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [showExampleImageModal, setShowExampleImageModal] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Firebase real-time listener
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToMenuItems(
      (items) => {
        setMenuItems(items);
        // Set "All" (null) as default category on first load
        if (!selectedCategory) {
          setSelectedCategory(null);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading menu items:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle modal close with ESC key and focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAllergensModal(false);
        setShowIngredientsModal(false);
        setShowExampleImageModal(false);
        setSelectedItem(null);
      }
    };

    if (showAllergensModal || showIngredientsModal || showExampleImageModal || !!selectedItem) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [showAllergensModal, showIngredientsModal, showExampleImageModal, !!selectedItem]);

  // Get categories in the correct order
  const categories = getOrderedCategories(menuItems);
  
  // Filter and sort items
  let filteredItems = selectedCategory 
    ? menuItems.filter(item => item.category === selectedCategory)
    : menuItems;

  filteredItems = filteredItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort items: Primary sort by itemNumber, secondary sort by name or popularity
  if (sortBy === 'popular') {
    filteredItems = [...filteredItems].sort((a, b) => {
      // First sort by itemNumber
      if (a.itemNumber !== b.itemNumber) {
        return (a.itemNumber || 999) - (b.itemNumber || 999);
      }
      // Then by likes
      return (b.likes || 0) - (a.likes || 0);
    });
  } else {
    filteredItems = [...filteredItems].sort((a, b) => {
      // First sort by itemNumber
      if (a.itemNumber !== b.itemNumber) {
        return (a.itemNumber || 999) - (b.itemNumber || 999);
      }
      // Then by name
      return a.name.localeCompare(b.name);
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Premium Decorative Background Elements */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-20 left-0 w-80 h-80 bg-amber-50 rounded-full blur-3xl opacity-15" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-10" />
      </div>

      {/* Header Section */}
      <div className="relative bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-10"
          >
            <Link href="/">
              <Button 
                variant="ghost" 
                className="text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors duration-300 group px-0"
              >
                <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Zurück
              </Button>
            </Link>
          </motion.div>

          {/* Page Title with Enhanced Design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6">
              <div className="flex items-end gap-4 mb-4">
                <div className="h-2 w-16 bg-gradient-to-r from-orange-500 via-orange-400 to-transparent rounded-full"></div>
                <h1 
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900" 
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.02em' }}
                >
                  Unsere Speisekarte
                </h1>
              </div>
              <p className="text-lg text-slate-600 ml-20 font-light" style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
                Handwerklich zubereitet • Saisonale Zutaten • Authentische Küche
              </p>
            </div>
          </motion.div>

          {/* Allergen/Ingredient Info Buttons - Premium Style */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-12 flex flex-wrap gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAllergensModal(true)}
              className="px-6 py-3 bg-gradient-to-br from-red-50 to-red-100 text-red-700 border border-red-200 rounded-lg font-semibold text-sm hover:from-red-100 hover:to-red-200 transition-all duration-300 flex items-center gap-2 shadow-sm"
            >
              <span className="text-lg">⚠️</span>
              Allergene ansehen
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowIngredientsModal(true)}
              className="px-6 py-3 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border border-blue-200 rounded-lg font-semibold text-sm hover:from-blue-100 hover:to-blue-200 transition-all duration-300 flex items-center gap-2 shadow-sm"
            >
              <span className="text-lg">🧪</span>
              Inhaltsstoffe ansehen
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Search & Controls Section */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-5"
          >
            {/* Search Bar with Premium Style */}
            <div className="relative group">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors duration-300"
              >
                <Search className="w-5 h-5" />
              </motion.div>
              <input
                type="text"
                placeholder="Gericht oder Zutaten suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all duration-300 font-medium shadow-sm hover:border-slate-300 bg-white"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-1 border border-slate-200 rounded-xl p-1.5 bg-slate-50 shadow-sm w-fit">
              <motion.button
                onClick={() => setViewMode('grid')}
                className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  viewMode === 'grid'
                    ? 'bg-white text-orange-600 shadow-md border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                ⊞ Grid
              </motion.button>
              <motion.button
                onClick={() => setViewMode('list')}
                className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  viewMode === 'list'
                    ? 'bg-white text-orange-600 shadow-md border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                ≡ Liste
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-32"
            >
              <div className="text-center">
                <Loader className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
                <p className="text-slate-600 font-semibold">Menü wird geladen...</p>
              </div>
            </motion.div>
          ) : menuItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32"
            >
              <Flame className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg font-semibold">Speisekarte wird gerade aktualisiert...</p>
            </motion.div>
          ) : (
            <>
              {/* Category Filter - Premium Pill Style */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-12"
              >
                <div className="flex flex-wrap gap-2.5">
                  {/* All Categories Button */}
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 4px 16px rgba(249, 115, 22, 0.15)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(null)}
                    className={`px-5 py-2.5 rounded-full font-semibold transition-all duration-300 border-2 text-sm ${
                      selectedCategory === null
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-600 shadow-lg'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 shadow-sm'
                    }`}
                  >
                    Alle
                    <span className={`ml-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                      selectedCategory === null
                        ? 'bg-white/25'
                        : 'bg-slate-100'
                    }`}>
                      {menuItems.length}
                    </span>
                  </motion.button>

                  {/* Category Buttons */}
                  {categories.map((cat, idx) => {
                    const count = menuItems.filter(i => i.category === cat).length;
                    return (
                      <motion.button
                        key={cat}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15 }}
                        whileHover={{ scale: 1.05, boxShadow: '0 4px 16px rgba(249, 115, 22, 0.15)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-5 py-2.5 rounded-full font-semibold transition-all duration-300 border-2 text-sm ${
                          selectedCategory === cat
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-600 shadow-lg'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 shadow-sm'
                        }`}
                      >
                        {cat}
                        <span className={`ml-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                          selectedCategory === cat
                            ? 'bg-white/25'
                            : 'bg-slate-100'
                        }`}>
                          {count}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Items Display */}
              {filteredItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-32"
                >
                  <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg font-semibold">Keine Gerichte gefunden</p>
                  <p className="text-slate-500 mt-2">Versuchen Sie einen anderen Suchbegriff</p>
                </motion.div>
              ) : viewMode === 'grid' ? (
                // Grid View
                <motion.div
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7"
                >
                  <AnimatePresence mode="wait">
                    {filteredItems.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setSelectedItem(item)}
                        className="group cursor-pointer"
                      >
                        <motion.div
                          whileHover={{ y: -8 }}
                          className="rounded-2xl overflow-hidden bg-white border-2 border-slate-200 hover:border-orange-300 transition-all duration-500 hover:shadow-xl h-full flex flex-col"
                        >
                          {/* Image Container with Premium Overlay */}
                          <div className="relative h-56 bg-slate-100 overflow-hidden">
                            {item.imageUrl ? (
                              <>
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-slate-50 to-orange-100">
                                <div className="text-center">
                                  <div className="relative inline-block">
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                      className="mb-3"
                                    >
                                      <Flame className="w-14 h-14 text-orange-300" />
                                    </motion.div>
                                    <div className="absolute inset-0 bg-orange-200 blur-xl opacity-30 rounded-full" />
                                  </div>
                                  <p className="text-slate-500 text-xs font-semibold mt-2">Bild folgt</p>
                                </div>
                              </div>
                            )}

                            {/* Badge: Item Number */}
                            {item.itemNumber && (
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="absolute top-3 right-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-lg group-hover:from-orange-600 group-hover:to-orange-700 transition-all duration-300"
                              >
                                #{item.itemNumber}
                              </motion.div>
                            )}

                            {/* Badge: Status */}
                            {!item.available && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                                <span className="text-white font-bold text-lg">Nicht verfügbar</span>
                              </div>
                            )}

                            {/* Likes indicator with Animation */}
                            <AnimatePresence>
                              {(item.likes || 0) > 0 && (
                                <motion.div
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  className="absolute bottom-3 left-3 bg-white shadow-lg px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold text-sm backdrop-blur-md border border-white/50"
                                >
                                  <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                  >
                                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                                  </motion.div>
                                  <span className="text-slate-900">{item.likes}</span>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Example Image Info Button */}
                            {item.isExampleImage && (
                              <motion.button
                                onClick={() => setShowExampleImageModal(true)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="absolute bottom-3 right-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition-colors"
                                title="This is an example image"
                              >
                                <Info className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-6 flex-1 flex flex-col">
                            <div className="mb-4">
                              <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2.5">
                                {item.category}
                              </p>
                              <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors duration-300 line-clamp-2 leading-tight">
                                {item.name}
                              </h3>
                            </div>

                            {item.description && (
                              <p className="text-sm text-slate-600 mb-4 line-clamp-2 flex-1 leading-relaxed">
                                {item.description}
                              </p>
                            )}

                            {/* Allergens and Ingredients Badges */}
                            {(item.allergens?.length || item.ingredients?.length) ? (
                              <div className="mb-5 pb-4 border-b border-slate-100 group-hover:border-orange-200 transition-colors duration-300">
                                <AllergensIngredientsDisplay
                                  allergens={item.allergens}
                                  ingredients={item.ingredients}
                                  maxVisible={2}
                                  size="sm"
                                />
                              </div>
                            ) : null}

                            {/* Footer - Price and Status */}
                            <div className="flex items-center justify-between pt-auto">
                              <motion.div
                                className="text-2xl font-bold text-slate-900"
                                whileHover={{ scale: 1.05 }}
                              >
                                €{item.price.toFixed(2)}
                              </motion.div>
                              <motion.span
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.95 }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border-2 ${
                                  item.available
                                    ? 'bg-green-50 text-green-700 border-green-200 group-hover:bg-green-100 group-hover:border-green-300'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                {item.available ? '✓ Verfügbar' : '✕ Nicht verf.'}
                              </motion.span>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                // List View
                <motion.div
                  layout
                  className="space-y-3"
                >
                  <AnimatePresence mode="wait">
                    {filteredItems.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setSelectedItem(item)}
                        className="group cursor-pointer"
                      >
                        <motion.div
                          whileHover={{ x: 6, boxShadow: '0 8px 24px rgba(249, 115, 22, 0.1)' }}
                          className="flex gap-6 rounded-xl overflow-hidden bg-white border-2 border-slate-200 hover:border-orange-300 transition-all duration-500 hover:shadow-lg p-6 items-start"
                        >
                          {/* Image */}
                          {item.imageUrl ? (
                            <motion.div
                              whileHover={{ scale: 1.08 }}
                              className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-slate-100 shadow-sm"
                            >
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </motion.div>
                          ) : (
                            <div className="flex-shrink-0 w-32 h-32 rounded-lg bg-gradient-to-br from-orange-50 via-slate-50 to-orange-100 flex items-center justify-center shadow-sm">
                              <div className="text-center">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                >
                                  <Flame className="w-8 h-8 text-orange-300 mx-auto" />
                                </motion.div>
                              </div>
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1.5">
                                  {item.category}
                                </p>
                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors duration-300 leading-tight">
                                  {item.name}
                                </h3>
                              </div>
                              {item.itemNumber && (
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  className="flex-shrink-0 bg-gradient-to-r from-slate-900 to-slate-800 text-white px-3 py-1 rounded-lg font-bold text-sm group-hover:from-orange-600 group-hover:to-orange-700 transition-all duration-300 shadow-md"
                                >
                                  #{item.itemNumber}
                                </motion.div>
                              )}
                            </div>

                            {item.description && (
                              <p className="text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}

                            {/* Allergens and Ingredients Badges */}
                            {(item.allergens?.length || item.ingredients?.length) ? (
                              <div className="mb-5 pb-4 border-b-2 border-slate-100 group-hover:border-orange-200 transition-colors duration-300">
                                <AllergensIngredientsDisplay
                                  allergens={item.allergens}
                                  ingredients={item.ingredients}
                                  maxVisible={3}
                                  size="sm"
                                />
                              </div>
                            ) : null}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-2">
                              <motion.div
                                className="text-3xl font-bold text-slate-900"
                                whileHover={{ scale: 1.05 }}
                              >
                                €{item.price.toFixed(2)}
                              </motion.div>
                              <div className="flex items-center gap-3">
                                <AnimatePresence>
                                  {(item.likes || 0) > 0 && (
                                    <motion.div
                                      initial={{ scale: 0.8, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      exit={{ scale: 0.8, opacity: 0 }}
                                      className="flex items-center gap-2 text-slate-600 font-semibold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"
                                    >
                                      <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                      >
                                        <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                                      </motion.div>
                                      {item.likes}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                                {item.isExampleImage && (
                                  <motion.button
                                    onClick={() => setShowExampleImageModal(true)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2.5 transition-colors shadow-md"
                                    title="This is an example image"
                                  >
                                    <Info className="w-5 h-5" />
                                  </motion.button>
                                )}
                                <motion.span
                                  whileHover={{ scale: 1.08 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 border-2 ${
                                    item.available
                                      ? 'bg-green-50 text-green-700 border-green-200 group-hover:bg-green-100 group-hover:border-green-300'
                                      : 'bg-red-50 text-red-700 border-red-200'
                                  }`}
                                >
                                  {item.available ? '✓ Verfügbar' : '✕ Nicht verfügbar'}
                                </motion.span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info Section - Can be removed or simplified since modals handle it */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center"
          >
            <p className="text-slate-700 font-semibold">
              💬 Bei Fragen zu Allergenen oder Inhaltsstoffen sprechen Sie bitte unser Personal an. 
              <br />
              Unsere Mitarbeiter können Ihnen gerne weitere Informationen geben.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Allergens Modal */}
      <AnimatePresence>
        {showAllergensModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAllergensModal(false)}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              ref={dialogRef}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <span className="text-3xl">⚠️</span> Allergene
                </h2>
                <button
                  onClick={() => setShowAllergensModal(false)}
                  className="text-slate-500 hover:text-slate-700 transition-colors p-2 rounded-lg hover:bg-white"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1 px-6 py-6">
                <dl className="space-y-4">
                  {getAllergenCodesArray().map((code) => (
                    <div key={code} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                      <dt className="flex-shrink-0 font-bold text-slate-900 bg-red-100 text-red-700 w-10 h-10 rounded-lg flex items-center justify-center">
                        {code}
                      </dt>
                      <dd className="text-slate-700 flex-1 pt-1">
                        {getAllergenDisplayText(code as any)}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    ℹ️ Info zuletzt aktualisiert: {ALLERGEN_INGREDIENT_LAST_UPDATED}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex-shrink-0">
                <button
                  onClick={() => setShowAllergensModal(false)}
                  className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors duration-300"
                >
                  Schließen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ingredients Modal */}
      <AnimatePresence>
        {showIngredientsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowIngredientsModal(false)}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              ref={dialogRef}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <span className="text-3xl">🧪</span> Inhaltsstoffe
                </h2>
                <button
                  onClick={() => setShowIngredientsModal(false)}
                  className="text-slate-500 hover:text-slate-700 transition-colors p-2 rounded-lg hover:bg-white"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1 px-6 py-6">
                <dl className="space-y-4">
                  {getIngredientCodesArray().map((code) => (
                    <div key={code} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                      <dt className="flex-shrink-0 font-bold text-slate-900 bg-blue-100 text-blue-700 w-10 h-10 rounded-lg flex items-center justify-center">
                        {code}
                      </dt>
                      <dd className="text-slate-700 flex-1 pt-1">
                        {getIngredientDisplayText(code as any)}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    ℹ️ Info zuletzt aktualisiert: {ALLERGEN_INGREDIENT_LAST_UPDATED}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex-shrink-0">
                <button
                  onClick={() => setShowIngredientsModal(false)}
                  className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors duration-300"
                >
                  Schließen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Example Image Info Modal */}
      <AnimatePresence>
        {showExampleImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExampleImageModal(false)}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              ref={dialogRef}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <span className="text-3xl">ℹ️</span> Beispielbild
                </h2>
                <button
                  onClick={() => setShowExampleImageModal(false)}
                  className="text-slate-500 hover:text-slate-700 transition-colors p-2 rounded-lg hover:bg-white"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6 flex-1">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
                  <p className="text-slate-900 font-semibold">
                    🖼️ Dies ist ein Beispielbild
                  </p>
                  <p className="text-slate-700 leading-relaxed text-sm">
                    Dieses Bild wurde aus dem Internet verwendet, um Ihnen eine Vorstellung davon zu geben, wie dieses Gericht aussieht. 
                    Es ist kein echtes Foto des Gerichts aus unserem Restaurant.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex-shrink-0">
                <button
                  onClick={() => setShowExampleImageModal(false)}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
                >
                  Verstanden
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
