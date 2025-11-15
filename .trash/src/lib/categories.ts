// Shared categories for menu items - in display order
export const CATEGORIES = [
  '🍲 Suppen',
  '🥗 Salate',
  '🍤 Vorspeisen',
  '🌱 Vegetarische Gerichte',
  '🍗 Gerichte mit Huhn',
  '🍖 Lamm Spezialitäten',
  '🐟 Fisch Spezialitäten',
  '🍚 Biryani Spezialitäten',
  '🔥 Tandoori Spezialitäten',
  '🍞 Naan',
  '🥩 Rumpsteak',
  '🍖 Schnitzel',
  '🍗 Putenschnitzel',
  '🌿 Frischgerichte',
  '🍠 Beilagen',
  '🍝 Nudeln',
  '🍰 Dessert',
  '🥤 Alkoholfreie Getränke',
  '☕ Warme Getränke',
  '🍺 Biere',
  '🍎 Apfelwein',
  '🍾 Sekt & Spritz',
  '🥃 Spirituosen',
  '🍷 Offene Weine',
] as const;

/**
 * Get categories that have menu items, in the correct order
 * @param menuItems Array of menu items
 * @returns Ordered array of categories that have items
 */
export function getOrderedCategories(menuItems: Array<{ category: string }>): string[] {
  const categoriesWithItems = new Set(menuItems.map(item => item.category));
  
  // Return categories in the order they're defined in CATEGORIES array
  return CATEGORIES.filter(cat => categoriesWithItems.has(cat));
}
