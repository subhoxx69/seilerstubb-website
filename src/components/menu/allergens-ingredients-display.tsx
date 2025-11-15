import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { getAllergenDisplayText, getIngredientDisplayText } from '@/lib/allergens-ingredients';

interface AllergensIngredientsDisplayProps {
  allergens?: string[];
  ingredients?: number[];
  maxVisible?: number;
  size?: 'sm' | 'md';
}

export function AllergensIngredientsDisplay({
  allergens = [],
  ingredients = [],
  maxVisible = 3,
  size = 'sm',
}: AllergensIngredientsDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const allCodes = [
    ...allergens.map(a => ({ type: 'allergen', code: a })),
    ...ingredients.map(i => ({ type: 'ingredient', code: String(i) })),
  ];

  if (allCodes.length === 0) {
    return null;
  }

  const visibleCodes = isExpanded ? allCodes : allCodes.slice(0, maxVisible);
  const hasMore = allCodes.length > maxVisible && !isExpanded;

  return (
    <div className="flex flex-wrap gap-2">
      {visibleCodes.map(({ type, code }) => (
        <motion.div
          key={`${type}-${code}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-full font-semibold flex items-center justify-center ${
            type === 'allergen'
              ? 'bg-red-100 text-red-700 border border-red-200'
              : 'bg-blue-100 text-blue-700 border border-blue-200'
          } ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`}
          title={
            type === 'allergen'
              ? getAllergenDisplayText(code as any)
              : getIngredientDisplayText(Number(code) as any)
          }
        >
          {code}
        </motion.div>
      ))}

      {hasMore && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className={`rounded-full font-semibold bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300 transition-colors ${
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
          }`}
          title="Mehr anzeigen"
        >
          +{allCodes.length - maxVisible}
        </motion.button>
      )}

      {isExpanded && allCodes.length > maxVisible && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(false)}
          className={`rounded-full font-semibold bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300 transition-colors ${
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
          } flex items-center gap-1`}
          title="Weniger anzeigen"
        >
          Weniger
          <ChevronDown className="w-3 h-3" />
        </motion.button>
      )}
    </div>
  );
}
