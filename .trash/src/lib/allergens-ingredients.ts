// Allergen and Ingredient definitions for menu items

export const ALLERGEN_CODES = {
  A: 'Enthält glutenhaltige Getreide',
  B: 'Enthält Krebstiere oder daraus gewonnene Erzeugnisse',
  C: 'Enthält Eier oder daraus gewonnene Erzeugnisse',
  D: 'Enthält Fisch oder daraus gewonnene Erzeugnisse',
  E: 'Enthält Erdnüsse oder daraus gewonnene Erzeugnisse',
  F: 'Enthält Sojabohnen oder daraus gewonnene Erzeugnisse',
  G: 'Enthält Milch oder daraus gewonnene Erzeugnisse',
  H: 'Enthält Schalenfrüchte oder daraus gewonnene Erzeugnisse',
  I: 'Enthält Sellerie oder daraus gewonnene Erzeugnisse',
  J: 'Enthält Senf oder daraus gewonnene Erzeugnisse',
  K: 'Enthält Sesamsamen oder daraus gewonnene Erzeugnisse',
  L: 'Enthält Schwefeldioxid oder Sulfite',
  M: 'Enthält Lupinen oder daraus gewonnene Erzeugnisse',
  N: 'Enthält Weichtiere oder daraus gewonnene Erzeugnisse',
  O: 'Enthält grünen Farbstoff (E102, E133)',
  P: 'Enthält orangenen Farbstoff (E102, E129)',
  Q: 'Enthält roten Farbstoff (E122, E102, E129)',
  R: 'Enthält gelben Farbstoff (E102, E129)',
  S: 'mit Konservierungsstoff',
} as const;

export const INGREDIENT_CODES = {
  1: 'mit Geschmacksverstärker',
  2: 'mit Antioxidationsmittel',
  3: 'mit Nitritpökelsalz',
  4: 'mit Süßungsmittel',
  5: 'mit Süßungsmittel, enthält eine Phenylalaninquelle',
  6: 'mit Phosphat',
  7: 'mit Farbstoff',
  8: 'geschwefelt',
  9: 'geschwärzt',
  11: 'gewachst',
  12: 'Koffein',
  13: 'Chinin',
  14: 'Taurin',
  15: 'Schweinefleisch',
} as const;

export type AllergenCode = keyof typeof ALLERGEN_CODES;
export type IngredientCode = keyof typeof INGREDIENT_CODES;

// Validation functions
export function isValidAllergenCode(code: any): code is AllergenCode {
  return Object.keys(ALLERGEN_CODES).includes(String(code).toUpperCase());
}

export function isValidIngredientCode(code: any): code is IngredientCode {
  return Object.keys(INGREDIENT_CODES).includes(String(code));
}

// Normalize and validate arrays
export function validateAllergens(allergens: any): string[] {
  if (!Array.isArray(allergens)) return [];
  return allergens
    .map(a => String(a).toUpperCase())
    .filter(isValidAllergenCode);
}

export function validateIngredients(ingredients: any): number[] {
  if (!Array.isArray(ingredients)) return [];
  return ingredients
    .map(i => Number(i))
    .filter(num => !isNaN(num) && isValidIngredientCode(num));
}

// Get display text
export function getAllergenDisplayText(code: AllergenCode): string {
  return ALLERGEN_CODES[code] || code;
}

export function getIngredientDisplayText(code: IngredientCode): string {
  return INGREDIENT_CODES[code] || String(code);
}

// Get all codes as arrays
export const getAllergenCodesArray = (): AllergenCode[] => 
  Object.keys(ALLERGEN_CODES) as AllergenCode[];

export const getIngredientCodesArray = (): number[] => 
  Object.keys(INGREDIENT_CODES).map(Number);

// Last updated date (you can update this manually or pull from config)
export const ALLERGEN_INGREDIENT_LAST_UPDATED = '2025-11-09';
