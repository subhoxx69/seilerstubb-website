'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Flame, Loader } from 'lucide-react';
import { getGalleryImages, GalleryImage } from '@/lib/firebase/imagekit-gallery-service';

export default function GalleryPage() {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [imageZoom, setImageZoom] = useState(1);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Load gallery images from Firebase
  useEffect(() => {
    const loadGallery = async () => {
      try {
        setIsLoading(true);
        const images = await getGalleryImages();
        setGalleryImages(images);
      } catch (error) {
        console.error('Error loading gallery:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGallery();
  }, []);

  const categories = ['all', ...Array.from(new Set(galleryImages.map(img => img.category)))];

  const filteredImages = activeCategory === 'all' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === activeCategory);

  const handlePrevious = () => {
    setSelectedImage(prev => 
      prev === null ? null : prev === 0 ? filteredImages.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setSelectedImage(prev => 
      prev === null ? null : prev === filteredImages.length - 1 ? 0 : prev + 1
    );
  };

  // Handle zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (selectedImage === null) return;
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.1 : -0.1;
    setImageZoom(prev => Math.max(1, Math.min(3, prev - delta)));
  };

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
    
    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrevious();
    }
  };

  // Reset zoom when image changes
  useEffect(() => {
    setImageZoom(1);
  }, [selectedImage]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage === null) return;
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') setSelectedImage(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 border-4 border-slate-200 border-t-orange-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-20 overflow-hidden"
      >
        {/* Background Decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-50 rounded-full blur-3xl opacity-20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-transparent rounded-full" />
            <span className="text-orange-600 font-bold uppercase tracking-widest text-sm">Galerie</span>
            <div className="h-1 w-12 bg-gradient-to-l from-orange-500 to-transparent rounded-full" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-6xl lg:text-7xl font-bold text-slate-900 mb-6"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Unsere Galerie
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-600 max-w-3xl mx-auto"
          >
            Entdecken Sie die Vielfalt und Schönheit unseres Restaurants. Von unserer gemütlichen Atmosphäre bis zu köstlichen Speisen – hier finden Sie einen Einblick in alles, was uns ausmacht.
          </motion.p>
        </div>
      </motion.section>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12"
      >
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((category, idx) => (
            <motion.button
              key={category}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + idx * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setActiveCategory(category);
                setSelectedImage(null);
              }}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeCategory === category
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {category === 'all' ? 'Alle' : category.charAt(0).toUpperCase() + category.slice(1)}
              <span className="ml-2 text-sm opacity-75">
                ({category === 'all' ? galleryImages.length : galleryImages.filter((img: GalleryImage) => img.category === category).length})
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Gallery Grid */}
      <motion.div
        layout
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20"
      >
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredImages.map((image, idx) => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedImage(filteredImages.indexOf(image))}
                className="group cursor-pointer rounded-xl overflow-hidden bg-slate-100 h-64"
              >
                <div className="relative w-full h-full">
                  {/* Image */}
                  <img
                    src={image.imageKitUrl}
                    alt={image.alt}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 flex items-end justify-start p-6 z-10">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-white"
                    >
                      <p className="font-bold text-lg">{image.title}</p>
                      <p className="text-sm text-white/80 mt-1">{image.category}</p>
                    </motion.div>
                  </div>

                  {/* Icon Badge */}
                  <div className="absolute top-4 right-4 z-20">
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      className="bg-white/90 backdrop-blur-sm p-3 rounded-lg text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </motion.div>
                  </div>

                  {/* Corner Accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-500/20 to-transparent group-hover:from-orange-500/40 transition-all duration-500" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredImages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Flame className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">Keine Bilder in dieser Kategorie gefunden</p>
          </motion.div>
        )}
      </motion.div>

      {/* Lightbox Modal - Premium Full Screen Version */}
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
                  {filteredImages[selectedImage]?.imageKitUrl ? (
                    <motion.img
                      key={`lightbox-img-${selectedImage}`}
                      src={filteredImages[selectedImage].imageKitUrl}
                      alt={filteredImages[selectedImage].alt}
                      className="w-full h-full object-contain select-none cursor-zoom-in"
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
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
                      {filteredImages[selectedImage]?.category || filteredImages[selectedImage]?.title}
                    </motion.h3>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25, duration: 0.3 }}
                      className="flex items-center gap-3 text-orange-400 font-semibold"
                    >
                      <div className="w-8 h-1 bg-gradient-to-r from-orange-500 to-transparent rounded-full" />
                      <span>Bild {selectedImage + 1} von {filteredImages.length}</span>
                    </motion.div>
                  </motion.div>

                  {/* Classic Navigation Buttons - Left */}
                  <motion.button
                    whileHover={{ scale: 1.1, x: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrevious}
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
                    onClick={handleNext}
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

      {/* Info Section */}
      <section className="bg-gradient-to-r from-orange-50 to-amber-50 py-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Möchten Sie uns besuchen?</h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
              Buchen Sie noch heute einen Tisch und erleben Sie die Atmosphäre selbst. Wir freuen uns auf Ihren Besuch!
            </p>
            <motion.a
              href="/reservation"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Tisch reservieren
              <ChevronRight className="w-5 h-5" />
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
