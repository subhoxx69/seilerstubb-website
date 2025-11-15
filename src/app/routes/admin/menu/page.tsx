'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Loader, Search, Image as ImageIcon, X, Check, AlertCircle, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { CATEGORIES } from '@/lib/categories';
import { 
  subscribeToAllMenuItems,
  addMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  MenuItem
} from '@/lib/firebase/menu-service-new';
import { deleteImageFromImageKit } from '@/lib/imagekit-client';
import { 
  getAllergenCodesArray,
  getIngredientCodesArray,
  getAllergenDisplayText,
  getIngredientDisplayText,
  validateAllergens,
  validateIngredients,
} from '@/lib/allergens-ingredients';

interface FormData {
  name: string;
  description: string;
  category: string;
  price: string;
  itemNumber: string;
  available: boolean;
  imageUrl: string;
  imageKitFileId?: string;
  imagePath?: string;
  allergens: string[];
  ingredients: number[];
  isExampleImage: boolean;
}

const initialFormData: FormData = {
  name: '',
  description: '',
  category: CATEGORIES[0],
  price: '',
  itemNumber: '',
  available: true,
  imageUrl: '',
  imageKitFileId: '',
  imagePath: '',
  allergens: [],
  ingredients: [],
  isExampleImage: true,
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const [isImportingJSON, setIsImportingJSON] = useState(false);
  const [isTextConverterOpen, setIsTextConverterOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isConvertingText, setIsConvertingText] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Set up real-time listener for menu items
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToAllMenuItems(
      (items) => {
        setItems(items.map(item => ({
          ...item,
          id: item.id || ''
        })));
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading menu items:', error);
        toast.error('Failed to load menu items');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle image upload to backend
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('fileName', `menu-${Date.now()}-${file.name}`);

      console.log('🚀 Starting image upload...');
      console.log('File name:', file.name);
      console.log('File size:', file.size);
      console.log('File type:', file.type);

      const uploadResponse = await fetch('/api/imagekit/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      console.log('Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload error response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Upload failed');
        } catch (e) {
          throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorText}`);
        }
      }

      const uploadedFile = await uploadResponse.json();
      console.log('✅ Upload successful:', uploadedFile);

      // Update form with image data
      setFormData(prev => ({
        ...prev,
        imageUrl: uploadedFile.url,
        imageKitFileId: uploadedFile.fileId,
        imagePath: uploadedFile.filePath,
      }));

      setImagePreview(uploadedFile.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      toast.error(message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      toast.error('Please fill in Name and Price');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get next item number if adding new and no manual number provided
      let itemNumber: number;
      
      if (editingId) {
        // If editing, use provided itemNumber or keep existing
        itemNumber = formData.itemNumber ? parseInt(formData.itemNumber) : 
          (items.find(i => i.id === editingId)?.itemNumber || 1);
      } else {
        // If adding new item
        if (formData.itemNumber) {
          // Use manually provided number
          itemNumber = parseInt(formData.itemNumber);
        } else {
          // Auto-generate next sequential number
          const maxItemNumber = Math.max(
            0,
            ...items.map(i => i.itemNumber || 0)
          );
          itemNumber = maxItemNumber + 1;
        }
      }

      const menuItem = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        itemNumber: itemNumber,
        available: formData.available,
        allergens: validateAllergens(formData.allergens),
        ingredients: validateIngredients(formData.ingredients),
        isExampleImage: formData.isExampleImage,
        ...(formData.imageUrl && {
          imageUrl: formData.imageUrl,
          imageKitFileId: formData.imageKitFileId,
          imagePath: formData.imagePath,
        }),
      };

      if (editingId) {
        await updateMenuItem(editingId, menuItem);
        toast.success('Menu item updated');
      } else {
        await addMenuItem(menuItem as MenuItem);
        toast.success(`Menu item added with number ${itemNumber}`);
      }

      // Reset form and close dialog
      setFormData(initialFormData);
      setImagePreview('');
      setEditingId(null);
      setIsDialogOpen(false);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      toast.error(error.message || 'Failed to save menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string | undefined, item?: MenuItem) => {
    if (!id) return;
    if (!confirm(`Are you sure you want to delete "${item?.name}"?`)) return;

    try {
      // Delete image from ImageKit if exists
      if (item?.imageKitFileId) {
        await deleteImageFromImageKit(item.imageKitFileId);
      }

      await deleteMenuItem(id);
      toast.success('Menu item deleted');
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      toast.error(error.message || 'Failed to delete menu item');
    }
  };

  // Handle delete all items
  const handleDeleteAll = async () => {
    try {
      setIsDeletingAll(true);
      
      // Delete images from ImageKit for all items that have them
      for (const item of items) {
        try {
          if (item.imageKitFileId) {
            await deleteImageFromImageKit(item.imageKitFileId);
          }
          if (item.id) {
            await deleteMenuItem(item.id);
          }
        } catch (err) {
          console.error('Error deleting item:', item.id, err);
          // Continue deleting other items even if one fails
        }
      }

      toast.success(`Deleted all ${items.length} menu items`);
      setIsDeleteAllConfirmOpen(false);
    } catch (error: any) {
      console.error('Error deleting all items:', error);
      toast.error(error.message || 'Failed to delete all items');
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Handle edit
  const handleEdit = (item: MenuItem) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      price: item.price.toString(),
      itemNumber: item.itemNumber ? item.itemNumber.toString() : '',
      available: item.available,
      imageUrl: item.imageUrl || '',
      imageKitFileId: item.imageKitFileId || '',
      imagePath: item.imagePath || '',
      allergens: item.allergens || [],
      ingredients: item.ingredients || [],
      isExampleImage: item.isExampleImage ?? true,
    });
    setImagePreview(item.imageUrl || '');
    setEditingId(item.id || null);
    setIsDialogOpen(true);
  };

  // Handle new item dialog
  const handleOpenNewDialog = () => {
    setFormData(initialFormData);
    setImagePreview('');
    setEditingId(null);
    setIsDialogOpen(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle JSON Export
  const handleDownloadJSON = () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        totalItems: items.length,
        items: items.map(item => ({
          number: item.itemNumber || null,
          name: item.name,
          description: item.description || '',
          category: item.category,
          price: item.price,
          allergens: item.allergens || [],
          ingredients: item.ingredients || [],
        })),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `menu-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Menu exported successfully');
    } catch (error) {
      console.error('Error exporting menu:', error);
      toast.error('Failed to export menu');
    }
  };

  // Handle JSON Import with detailed error reporting
  const handleImportJSON = async (file: File) => {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      toast.error('Please select a valid JSON file');
      return;
    }

    setIsImportingJSON(true);
    const errors: string[] = [];
    let successCount = 0;
    let errorCount = 0;
    let itemIndex = 0;

    try {
      const fileContent = await file.text();
      
      // Try to parse JSON
      let jsonData;
      try {
        jsonData = JSON.parse(fileContent);
      } catch (parseError: any) {
        setUploadErrors([
          `❌ JSON Parse Error: Invalid JSON format`,
          `Line: ${parseError.message || 'Unknown'}`,
          `Please check that your JSON file is valid.`,
          `Use a JSON validator to check: https://jsonlint.com/`,
        ]);
        setIsErrorDialogOpen(true);
        return;
      }

      // Validate JSON structure
      if (!jsonData.items || !Array.isArray(jsonData.items)) {
        setUploadErrors([
          `❌ Invalid JSON Structure`,
          `Expected field: "items" (array)`,
          `Current structure: ${Object.keys(jsonData).join(', ')}`,
          `Please ensure your JSON has an "items" array at the root level.`,
        ]);
        setIsErrorDialogOpen(true);
        return;
      }

      if (jsonData.items.length === 0) {
        setUploadErrors([
          `❌ Empty Items Array`,
          `Your JSON contains 0 items to import.`,
          `Please add menu items to the "items" array and try again.`,
        ]);
        setIsErrorDialogOpen(true);
        return;
      }

      // Process each item
      for (itemIndex = 0; itemIndex < jsonData.items.length; itemIndex++) {
        const item = jsonData.items[itemIndex];
        const itemNum = itemIndex + 1;

        try {
          // Validate required fields
          if (!item.name) {
            errorCount++;
            errors.push(`Item #${itemNum}: Missing required field "name"`);
            continue;
          }

          if (item.price === undefined || item.price === null || item.price === '') {
            errorCount++;
            errors.push(`Item #${itemNum} "${item.name}": Missing required field "price"`);
            continue;
          }

          if (!item.category) {
            errorCount++;
            errors.push(`Item #${itemNum} "${item.name}": Missing required field "category"`);
            continue;
          }

          // Validate price is a number
          const parsedPrice = parseFloat(item.price);
          if (isNaN(parsedPrice) || parsedPrice < 0) {
            errorCount++;
            errors.push(`Item #${itemNum} "${item.name}": Invalid price "${item.price}" (must be a positive number)`);
            continue;
          }

          // Validate item number if provided
          let itemNumber: number | null = null;
          if (item.number !== null && item.number !== undefined && item.number !== '') {
            if (item.number === "00" || item.number === 0) {
              itemNumber = 0;
            } else {
              const parsed = parseInt(String(item.number));
              if (isNaN(parsed)) {
                errorCount++;
                errors.push(`Item #${itemNum} "${item.name}": Invalid item number "${item.number}" (must be a number or "00")`);
                continue;
              }
              if (parsed < 1 || parsed > 999) {
                errorCount++;
                errors.push(`Item #${itemNum} "${item.name}": Item number out of range (must be 1-999 or "00")`);
                continue;
              }
              itemNumber = parsed;
            }
          }

          // Validate allergens if provided
          let validatedAllergens: string[] = [];
          if (item.allergens && Array.isArray(item.allergens)) {
            try {
              validatedAllergens = validateAllergens(item.allergens);
            } catch (allergenError: any) {
              errorCount++;
              errors.push(`Item #${itemNum} "${item.name}": Invalid allergen codes: ${allergenError.message}`);
              continue;
            }
          }

          // Validate ingredients if provided
          let validatedIngredients: number[] = [];
          if (item.ingredients && Array.isArray(item.ingredients)) {
            try {
              validatedIngredients = validateIngredients(item.ingredients);
            } catch (ingredientError: any) {
              errorCount++;
              errors.push(`Item #${itemNum} "${item.name}": Invalid ingredient codes: ${ingredientError.message}`);
              continue;
            }
          }

          // Validate description
          const description = item.description?.trim() || '';
          if (description.length > 1000) {
            errorCount++;
            errors.push(`Item #${itemNum} "${item.name}": Description too long (max 1000 characters, got ${description.length})`);
            continue;
          }

          // Prepare menu item
          const menuItem: MenuItem = {
            name: item.name.trim().substring(0, 100),
            description: description,
            category: item.category,
            price: parsedPrice,
            itemNumber: itemNumber || 0,
            available: true,
            allergens: validatedAllergens,
            ingredients: validatedIngredients,
          };

          // Add to Firebase
          try {
            const result = await addMenuItem(menuItem);
            if (result) {
              successCount++;
            } else {
              errorCount++;
              errors.push(`Item #${itemNum} "${item.name}": Failed to save to database (unknown error)`);
            }
          } catch (dbError: any) {
            errorCount++;
            errors.push(`Item #${itemNum} "${item.name}": Database error: ${dbError.message || 'Unknown error'}`);
          }
        } catch (err: any) {
          errorCount++;
          errors.push(`Item #${itemNum}: Unexpected error: ${err.message || String(err)}`);
        }
      }

      // Show results
      const resultMessages: string[] = [];
      
      if (successCount > 0) {
        resultMessages.push(`✅ Successfully imported ${successCount} item${successCount !== 1 ? 's' : ''}`);
        toast.success(`Imported ${successCount} menu items successfully`);
      }
      
      if (errorCount > 0) {
        resultMessages.push(`❌ Failed to import ${errorCount} item${errorCount !== 1 ? 's' : ''}`);
        resultMessages.push('');
        resultMessages.push('Errors:');
        resultMessages.push(...errors);
        
        setUploadErrors(resultMessages);
        setIsErrorDialogOpen(true);
        
        if (successCount === 0) {
          toast.error(`Failed to import all items. Click "Upload Menu" to see errors.`);
        } else {
          toast.warning(`${errorCount} items failed. Click "Upload Menu" to see errors.`);
        }
      }

      if (successCount === 0 && errorCount > 0) {
        // No items were imported - show error dialog
        return;
      }

    } catch (error: any) {
      console.error('Error importing JSON:', error);
      setUploadErrors([
        `❌ Error Reading File`,
        `${error.message || 'Unknown error occurred'}`,
        `Please ensure:`,
        `• File is a valid JSON file`,
        `• File is not corrupted`,
        `• File has proper formatting`,
      ]);
      setIsErrorDialogOpen(true);
      toast.error('Failed to read JSON file');
    } finally {
      setIsImportingJSON(false);
      if (jsonFileInputRef.current) {
        jsonFileInputRef.current.value = '';
      }
    }
  };

  // Find matching category from CATEGORIES list
  const findMatchingCategory = (parsedCategory: string): string => {
    if (!parsedCategory || parsedCategory.trim() === '') {
      return CATEGORIES[0]; // Default to first category if none provided
    }

    const normalizedParsed = parsedCategory
      .toLowerCase()
      .replace(/[^a-zA-Z0-9äöüß]/g, ''); // Remove special chars, keep umlauts

    // Try exact match first (with emoji and case-insensitive)
    const exactMatch = CATEGORIES.find(
      cat => cat.toLowerCase().includes(normalizedParsed) || 
             normalizedParsed.includes(cat.toLowerCase().replace(/[^a-zA-Z0-9äöüß]/g, ''))
    );

    if (exactMatch) {
      return exactMatch;
    }

    // Try partial keyword matching
    const keywords = normalizedParsed.split(/\s+/);
    for (const category of CATEGORIES) {
      const categoryLower = category.toLowerCase().replace(/[^a-zA-Z0-9äöüß]/g, '');
      for (const keyword of keywords) {
        if (keyword.length > 2 && categoryLower.includes(keyword)) {
          return category;
        }
      }
    }

    // If no match found, return default
    return CATEGORIES[0];
  };

  // Parse text menu to JSON
  const parseTextMenuToJSON = (text: string) => {
    const items: any[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    let currentItemNumber = '';
    let currentName = '';
    let currentDescription = '';
    let currentPrice = '';
    let currentAllergens = '';
    let currentCategory = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip section headers and dividers
      if (line.startsWith('##') || line === '---') {
        // Extract category from headers like "## SUPPEN (Soups)"
        if (line.startsWith('##')) {
          currentCategory = line.replace(/##\s+/, '').trim();
        }
        currentItemNumber = '';
        currentName = '';
        currentDescription = '';
        currentPrice = '';
        currentAllergens = '';
        continue;
      }

      // Match item lines: **01. Name** - €5.90
      const itemMatch = line.match(/\*\*(\d{2,3})\.\s+([^*]+)\*\*\s*-\s*€([\d.]+)/);
      if (itemMatch) {
        // Save previous item if exists
        if (currentItemNumber && currentName) {
          // Find matching category from CATEGORIES list
          const matchedCategory = findMatchingCategory(currentCategory);
          items.push({
            number: parseInt(currentItemNumber),
            name: currentName.trim(),
            description: currentDescription.trim(),
            category: matchedCategory,
            price: parseFloat(currentPrice),
            allergens: parseAllergenCodes(currentAllergens),
            ingredients: parseIngredientCodes(currentAllergens),
          });
        }

        // Parse new item
        currentItemNumber = itemMatch[1];
        currentName = itemMatch[2].trim();
        currentPrice = itemMatch[3];
        currentDescription = '';
        currentAllergens = '';
        continue;
      }

      // Match description lines (plain text between item and allergens)
      if (currentItemNumber && !line.startsWith('*Allergene')) {
        if (currentDescription) {
          currentDescription += ' ' + line;
        } else {
          currentDescription = line;
        }
      }

      // Match allergen/ingredient lines: *Allergene/Zusatzstoffe: 3,i,j*
      if (line.startsWith('*Allergene') || line.startsWith('*allergen')) {
        const allergenMatch = line.match(/[:\s]([a-zA-Z0-9,]+)\*/);
        if (allergenMatch) {
          currentAllergens = allergenMatch[1];
        }
      }
    }

    // Save last item
    if (currentItemNumber && currentName) {
      // Find matching category from CATEGORIES list
      const matchedCategory = findMatchingCategory(currentCategory);
      items.push({
        number: parseInt(currentItemNumber),
        name: currentName.trim(),
        description: currentDescription.trim(),
        category: matchedCategory,
        price: parseFloat(currentPrice),
        allergens: parseAllergenCodes(currentAllergens),
        ingredients: parseIngredientCodes(currentAllergens),
      });
    }

    return {
      exportDate: new Date().toISOString(),
      totalItems: items.length,
      items,
    };
  };

  // Parse allergen codes from string (A-S format)
  const parseAllergenCodes = (codesString: string): string[] => {
    if (!codesString) return [];
    return codesString
      .split(',')
      .map(c => c.trim().toUpperCase())
      .filter(c => /^[A-S]$/.test(c));
  };

  // Parse ingredient codes from string (1-15 format)
  const parseIngredientCodes = (codesString: string): number[] => {
    if (!codesString) return [];
    const codes: number[] = [];
    const parts = codesString.split(',');
    for (const part of parts) {
      const num = parseInt(part.trim());
      if (!isNaN(num) && num >= 1 && num <= 15) {
        codes.push(num);
      }
    }
    return codes;
  };

  // Handle text to JSON conversion
  const handleConvertTextToJSON = () => {
    try {
      if (!textInput.trim()) {
        toast.error('Please paste the menu text first');
        return;
      }

      setIsConvertingText(true);
      const jsonData = parseTextMenuToJSON(textInput);

      if (jsonData.items.length === 0) {
        toast.error('No menu items found in the text. Check the format.');
        return;
      }

      // Download JSON
      const dataStr = JSON.stringify(jsonData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `menu-converted-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Converted ${jsonData.items.length} items to JSON and downloaded`);
      setTextInput('');
      setIsTextConverterOpen(false);
    } catch (error: any) {
      console.error('Error converting text to JSON:', error);
      toast.error(error.message || 'Failed to convert text to JSON');
    } finally {
      setIsConvertingText(false);
    }
  };

  const filteredItems = items
    .filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by itemNumber first, then by name
      if (a.itemNumber !== b.itemNumber) {
        return (a.itemNumber || 999) - (b.itemNumber || 999);
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-between items-start gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Menu Management
          </h1>
          <p className="text-slate-600">Manage restaurant menu items ({filteredItems.length} items)</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Download JSON Button */}
          <Button 
            onClick={handleDownloadJSON}
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-2 flex items-center gap-2 font-semibold"
          >
            <Download className="w-5 h-5" />
            Download Menu (.json)
          </Button>

          {/* Upload JSON Button */}
          <Button 
            onClick={() => jsonFileInputRef.current?.click()}
            disabled={isImportingJSON}
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-6 py-2 flex items-center gap-2 font-semibold"
          >
            {isImportingJSON ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Menu (.json)
              </>
            )}
          </Button>

          {/* Text to JSON Converter Button */}
          <Button 
            onClick={() => setIsTextConverterOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-2 flex items-center gap-2 font-semibold"
          >
            📝 Convert Text to JSON
          </Button>

          {/* Delete All Button */}
          <Button 
            onClick={() => setIsDeleteAllConfirmOpen(true)}
            disabled={items.length === 0 || isDeletingAll}
            className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-6 py-2 flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeletingAll ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Delete All Items
              </>
            )}
          </Button>

          {/* Add Menu Item Button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleOpenNewDialog}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 flex items-center gap-2 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Add Menu Item
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl rounded-xl border-0 shadow-xl p-0 overflow-hidden bg-white">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
              <DialogTitle className="text-2xl font-bold text-slate-900">
                {editingId ? '✏️ Edit Menu Item' : '➕ Add New Menu Item'}
              </DialogTitle>
              <p className="text-sm text-slate-600 mt-1">Fill in the details below</p>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Image Upload Section */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                <Label className="text-sm font-semibold text-slate-900 mb-3 block">
                  📸 Food Image
                </Label>
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-48 h-48 object-cover rounded-lg border-2 border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setFormData(prev => ({
                          ...prev,
                          imageUrl: '',
                          imageKitFileId: '',
                          imagePath: '',
                        }));
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer py-8 px-4 border border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-center"
                  >
                    <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-700 font-medium">Click to upload image</p>
                    <p className="text-xs text-slate-500 mt-1">Max 5MB • PNG, JPG, WebP</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                    }
                  }}
                  disabled={isUploadingImage}
                  className="hidden"
                />
                {isUploadingImage && (
                  <div className="mt-3 flex items-center gap-2 text-blue-600">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Uploading image...</span>
                  </div>
                )}

                {/* Divider with "OR" text */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-slate-300" />
                  <span className="text-sm font-semibold text-slate-600">OR</span>
                  <div className="flex-1 h-px bg-slate-300" />
                </div>

                {/* Image URL Input */}
                <div>
                  <Label htmlFor="imageUrl" className="text-sm font-semibold text-slate-900 mb-2 block flex items-center gap-2">
                    <span>🔗 Image URL / Link</span>
                    <span className="text-xs text-slate-500">(alternative option)</span>
                  </Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => {
                      const url = e.target.value;
                      setFormData({ ...formData, imageUrl: url });
                      // If URL is valid, update preview
                      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                        setImagePreview(url);
                      }
                    }}
                    placeholder="e.g., https://example.com/image.jpg"
                    className="rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-0 text-slate-900"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Paste a direct image URL/link. Must start with http:// or https://
                  </p>
                </div>
              </div>

              {/* Name and Price Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-900 mb-2 block">
                    Dish Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Pasta Carbonara"
                    className="rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-0 text-slate-900"
                  />
                </div>
                <div>
                  <Label htmlFor="price" className="text-sm font-semibold text-slate-900 mb-2 block">
                    Price (€) *
                  </Label>
                  <div className="relative">
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      className="rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-0 text-slate-900 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 font-semibold">€</span>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category" className="text-sm font-semibold text-slate-900 mb-2 block">
                  Category *
                </Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 font-medium bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-0 cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Number */}
              <div>
                <Label htmlFor="itemNumber" className="text-sm font-semibold text-slate-900 mb-2 block flex items-center gap-2">
                  <span>📍 Item Number</span>
                  <span className="text-xs text-slate-500">(optional - auto-generated if empty)</span>
                </Label>
                <Input
                  id="itemNumber"
                  type="number"
                  min="1"
                  value={formData.itemNumber}
                  onChange={(e) => setFormData({ ...formData, itemNumber: e.target.value })}
                  placeholder={editingId ? 'Keep current number' : `Next: ${Math.max(0, ...items.map(i => i.itemNumber || 0)) + 1}`}
                  className="rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-0 text-slate-900"
                />
                <p className="text-xs text-slate-500 mt-2">
                  {editingId 
                    ? `Current number: ${items.find(i => i.id === editingId)?.itemNumber || 'Unknown'}`
                    : `Leave empty to use next sequential number: ${Math.max(0, ...items.map(i => i.itemNumber || 0)) + 1}`
                  }
                </p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-semibold text-slate-900 mb-2 block">
                  Description
                </Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the dish, ingredients, etc."
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 font-medium focus:border-blue-500 focus:ring-0 resize-none"
                  rows={4}
                />
              </div>

              {/* Allergens Multi-Select */}
              <div>
                <Label className="text-sm font-semibold text-slate-900 mb-3 block flex items-center gap-2">
                  <span>⚠️ Allergene</span>
                  <span className="text-xs text-slate-500">(optional)</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {getAllergenCodesArray().map((code) => (
                    <label
                      key={code}
                      className="flex items-center gap-2 p-3 border-2 border-slate-200 rounded-lg hover:border-red-300 hover:bg-red-50 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={formData.allergens.includes(code)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              allergens: [...formData.allergens, code],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              allergens: formData.allergens.filter(a => a !== code),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-2 border-slate-300 text-red-600 cursor-pointer accent-red-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900">{code}</div>
                        <div className="text-xs text-slate-600 line-clamp-1">
                          {getAllergenDisplayText(code as any)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {formData.allergens.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.allergens.map((code) => (
                      <span key={code} className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-semibold">
                        {code}
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              allergens: formData.allergens.filter(a => a !== code),
                            })
                          }
                          className="ml-1 hover:text-red-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Ingredients Multi-Select */}
              <div>
                <Label className="text-sm font-semibold text-slate-900 mb-3 block flex items-center gap-2">
                  <span>🧪 Inhaltsstoffe</span>
                  <span className="text-xs text-slate-500">(optional)</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {getIngredientCodesArray().map((code) => (
                    <label
                      key={code}
                      className="flex items-center gap-2 p-3 border-2 border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={formData.ingredients.includes(code)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              ingredients: [...formData.ingredients, code].sort((a, b) => a - b),
                            });
                          } else {
                            setFormData({
                              ...formData,
                              ingredients: formData.ingredients.filter(i => i !== code),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-2 border-slate-300 text-blue-600 cursor-pointer accent-blue-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900">{code}</div>
                        <div className="text-xs text-slate-600 line-clamp-1">
                          {getIngredientDisplayText(code as any)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {formData.ingredients.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.ingredients.map((code) => (
                      <span key={code} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-sm font-semibold">
                        {code}
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              ingredients: formData.ingredients.filter(i => i !== code),
                            })
                          }
                          className="ml-1 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Example Image Info */}
              <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <input
                  type="checkbox"
                  id="isExampleImage"
                  checked={formData.isExampleImage}
                  onChange={(e) => setFormData({ ...formData, isExampleImage: e.target.checked })}
                  className="w-5 h-5 rounded border-2 border-blue-300 text-blue-600 cursor-pointer accent-blue-600"
                />
                <Label htmlFor="isExampleImage" className="text-sm font-semibold text-slate-900 cursor-pointer flex items-center gap-2">
                  <span>ℹ️ This is an example image</span>
                  <span className="text-xs text-slate-600 font-normal">(from internet, not actual dish)</span>
                </Label>
              </div>

              {/* Availability */}
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg border-2 border-slate-200">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="w-5 h-5 rounded border-2 border-slate-300 text-blue-600 cursor-pointer accent-blue-600"
                />
                <Label htmlFor="available" className="text-sm font-semibold text-slate-900 cursor-pointer">
                  ✅ Available for order
                </Label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg px-6 font-semibold text-slate-700 border-2 border-slate-300 hover:bg-slate-100"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingId ? '✏️ Update Item' : '➕ Add Item'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
            </Dialog>
          </div>
        </motion.div>

      {/* Search and Stats */}
      <Card className="border-2 border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Menu Items</CardTitle>
            <div className="text-sm text-slate-600">
              Total: <span className="font-bold text-slate-900">{items.length}</span> • 
              Available: <span className="font-bold text-green-600">{items.filter(i => i.available).length}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by name, category, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-slate-200 focus:border-blue-500 focus:ring-0 rounded-lg"
              />
            </div>

            {/* Items Grid/List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No menu items found</p>
                <p className="text-sm text-slate-500 mt-1">Add your first menu item to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white border-2 border-slate-200 hover:border-blue-300 rounded-lg p-4 transition-all hover:shadow-md"
                    >
                      <div className="flex gap-4">
                        {/* Image Thumbnail */}
                        {item.imageUrl ? (
                          <div className="flex-shrink-0">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-24 h-24 object-cover rounded-lg border-2 border-slate-200"
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-24 h-24 bg-slate-100 rounded-lg border-2 border-slate-200 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-slate-400" />
                          </div>
                        )}

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                                {item.itemNumber && (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                                    {item.itemNumber}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-600">{item.category}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-2xl font-bold text-slate-900">€{item.price.toFixed(2)}</div>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                                item.available 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.available ? '✅ Available' : '❌ Unavailable'}
                              </span>
                            </div>
                          </div>
                          {item.description && (
                            <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
                          )}
                          {(item.allergens?.length || item.ingredients?.length) && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {item.allergens?.map((code) => (
                                <span key={`a-${code}`} className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 border border-red-200 rounded text-xs font-semibold">
                                  ⚠️ {code}
                                </span>
                              ))}
                              {item.ingredients?.map((code) => (
                                <span key={`i-${code}`} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-semibold">
                                  🧪 {code}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                            className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(item.id, item)}
                            className="border-2 border-red-300 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Text to JSON Converter Modal */}
      <Dialog open={isTextConverterOpen} onOpenChange={setIsTextConverterOpen}>
        <DialogContent className="max-w-3xl rounded-xl border-0 shadow-xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-4">
            <DialogTitle className="text-2xl font-bold text-slate-900">
              📝 Convert Text Menu to JSON
            </DialogTitle>
            <p className="text-sm text-slate-600 mt-1">Paste your restaurant menu text and we'll convert it to JSON format</p>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold text-slate-900">Paste Menu Text</Label>
              <p className="text-xs text-slate-500 mb-2">Supported format: Menu items with item numbers, names, prices, and allergen codes</p>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your menu text here. Format should be:&#10;**01. Item Name** - €5.90&#10;Description text&#10;*Allergene/Zusatzstoffe: a,b,c*&#10;&#10;**02. Another Item** - €6.50&#10;..."
                className="w-full h-64 p-4 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-0 font-mono text-sm resize-none"
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-semibold mb-2">ℹ️ Format Guide:</p>
              <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                <li>Item lines: <code className="bg-white px-2 py-1 rounded border border-blue-300">**01. Item Name** - €5.90</code></li>
                <li>Description: Regular text on the next line</li>
                <li>Allergens/Ingredients: <code className="bg-white px-2 py-1 rounded border border-blue-300">*Allergene/Zusatzstoffe: A,3,i*</code></li>
                <li>Use category headers with <code className="bg-white px-2 py-1 rounded border border-blue-300">## CATEGORY NAME</code></li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 justify-end">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="border-2 border-slate-300 text-slate-900 hover:bg-slate-100 rounded-lg px-6 py-2 font-semibold"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleConvertTextToJSON}
              disabled={isConvertingText || !textInput.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-2 font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConvertingText ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Convert & Download JSON
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Errors Dialog */}
      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent className="max-w-2xl rounded-xl border-0 shadow-xl p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-red-50 border-b-2 border-red-200 px-6 py-4">
            <DialogTitle className="text-2xl font-bold text-red-900">
              ⚠️ Upload Errors
            </DialogTitle>
            <p className="text-sm text-red-700 mt-1">Some items could not be imported. See details below.</p>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-3">
              {uploadErrors.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600">No errors to display</p>
                </div>
              ) : (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 font-mono text-sm space-y-1">
                  {uploadErrors.map((error, index) => (
                    <div key={index} className="text-red-800 break-words">
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Copy Instructions */}
            <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-semibold mb-2">💡 How to share errors:</p>
              <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
                <li>Select all error text (Ctrl+A)</li>
                <li>Copy to clipboard (Ctrl+C)</li>
                <li>Send to support or developer</li>
                <li>They can help fix your JSON file</li>
              </ol>
            </div>

            {/* Tips */}
            <div className="mt-4 bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900 font-semibold mb-2">🔧 Quick Fixes:</p>
              <ul className="text-xs text-amber-800 space-y-1 ml-4 list-disc">
                <li>Check all required fields: name, price, category</li>
                <li>Verify prices are numbers (e.g., 5.90, not €5.90)</li>
                <li>Ensure allergen codes are A-S only</li>
                <li>Ensure ingredient codes are 1-15 only</li>
                <li>Validate JSON format at: https://jsonlint.com/</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 justify-between">
            <Button
              onClick={() => {
                // Copy errors to clipboard
                const errorText = uploadErrors.join('\n');
                navigator.clipboard.writeText(errorText).then(() => {
                  toast.success('Errors copied to clipboard');
                }).catch(() => {
                  toast.error('Failed to copy to clipboard');
                });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 font-semibold flex items-center gap-2"
            >
              📋 Copy Errors
            </Button>
            <DialogClose asChild>
              <Button
                variant="outline"
                className="border-2 border-slate-300 text-slate-900 hover:bg-slate-100 rounded-lg px-6 py-2 font-semibold"
              >
                Close
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={isDeleteAllConfirmOpen} onOpenChange={setIsDeleteAllConfirmOpen}>
        <DialogContent className="max-w-md rounded-xl border-0 shadow-xl p-0 overflow-hidden bg-white">
          {/* Header */}
          <div className="bg-red-50 border-b-2 border-red-200 px-6 py-4">
            <DialogTitle className="text-2xl font-bold text-red-900">
              🗑️ Delete All Items?
            </DialogTitle>
            <p className="text-sm text-red-700 mt-1">This action cannot be undone</p>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-900 font-semibold">
                ⚠️ Warning: You are about to delete <span className="font-bold text-lg">{items.length}</span> menu items permanently.
              </p>
            </div>
            <p className="text-slate-600 text-sm mb-2">
              All items, including:
            </p>
            <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc mb-4">
              <li>Item names and descriptions</li>
              <li>Prices and categories</li>
              <li>Allergen and ingredient information</li>
              <li>Associated images</li>
            </ul>
            <p className="text-red-700 font-semibold text-sm">
              This will permanently delete all menu data. Are you sure?
            </p>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 justify-end">
            <DialogClose asChild>
              <Button
                variant="outline"
                disabled={isDeletingAll}
                className="border-2 border-slate-300 text-slate-900 hover:bg-slate-100 rounded-lg px-6 py-2 font-semibold"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-6 py-2 font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeletingAll ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete All Items
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden JSON File Input */}
      <input
        ref={jsonFileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleImportJSON(file);
          }
        }}
        disabled={isImportingJSON}
        className="hidden"
      />
    </div>
  );
}
