'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Loader } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';
import { getAllCategoryConfigs, type CategoryConfig } from '@/lib/firebase/category-config-service';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CategoryPickerProps {
  value: string;
  onChange: (category: string) => void;
  label?: string;
  required?: boolean;
}

export default function CategoryPicker({
  value,
  onChange,
  label = 'Category',
  required = true,
}: CategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [firebaseCategories, setFirebaseCategories] = useState<CategoryConfig[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);

  // Load categories from Firebase on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const configs = await getAllCategoryConfigs();
        
        if (configs && configs.length > 0) {
          // Use Firebase categories
          setFirebaseCategories(configs);
          const categoryNames = configs.map(c => c.name).sort();
          setFilteredCategories(categoryNames);
        } else {
          // Fall back to CATEGORIES constant
          setFilteredCategories([...CATEGORIES] as string[]);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        // Fall back to CATEGORIES constant on error
        setFilteredCategories([...CATEGORIES] as string[]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Filter categories based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      if (firebaseCategories.length > 0) {
        setFilteredCategories(firebaseCategories.map(c => c.name).sort());
      } else {
        setFilteredCategories([...CATEGORIES] as string[]);
      }
      return;
    }

    const term = searchTerm.toLowerCase();
    const allCategories = firebaseCategories.length > 0 
      ? firebaseCategories.map(c => c.name)
      : Array.from(CATEGORIES) as string[];
      
    const filtered = allCategories.filter(cat =>
      cat.toLowerCase().includes(term) ||
      cat.split(' ')[0].toLowerCase().includes(term) // Search emoji
    );
    setFilteredCategories(filtered);
  }, [searchTerm, firebaseCategories]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-category-picker]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCategory = value || (filteredCategories[0] || CATEGORIES[0]);
  const selectedEmoji = selectedCategory.split(' ')[0];
  const selectedName = selectedCategory.replace(/^.+?\s+/, '').trim();

  return (
    <div data-category-picker className="relative w-full">
      <Label className="text-sm font-semibold text-slate-900 mb-2 block">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {/* Trigger Button */}
      <motion.button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-full flex items-center justify-between gap-3 border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 font-medium bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
        whileHover={{ borderColor: '#cbd5e1' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl">{selectedEmoji}</span>
          <span className="truncate text-slate-900 font-medium">{selectedName}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden"
          >
            {/* Search Input */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-3 z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-2 border-slate-200 focus:border-blue-500 focus:ring-0 text-sm rounded-lg"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Categories List */}
            <div className="max-h-64 overflow-y-auto">
              {isLoadingCategories ? (
                <div className="px-4 py-8 flex items-center justify-center">
                  <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              ) : filteredCategories && filteredCategories.length > 0 ? (
                <div className="space-y-1 p-2">
                  {filteredCategories.map((category, index) => {
                    const emoji = category.split(' ')[0];
                    const name = category.replace(/^.+?\s+/, '').trim();
                    const isSelected = category === selectedCategory;

                    return (
                      <motion.button
                        key={category}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onChange(category);
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                        whileHover={{ backgroundColor: '#f1f5f9' }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-l-4 border-blue-500'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xl flex-shrink-0">{emoji}</span>
                        <span className={`truncate text-left font-medium ${
                          isSelected ? 'text-blue-900' : 'text-slate-900'
                        }`}>
                          {name}
                        </span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
                          >
                            <span className="text-white text-xs font-bold">✓</span>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-slate-500">No categories found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
