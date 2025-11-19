'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Loader, 
  X, 
  Check, 
  AlertCircle, 
  GripVertical,
  Sparkles,
  Copy,
  ChevronDown,
  Download,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllCategoryConfigs,
  setCategoryConfig,
  updateCategoryOrder,
  getUsedEmojis,
  isEmojiUsed,
  deleteCategoryConfig,
  type CategoryConfig,
} from '@/lib/firebase/category-config-service';
import {
  suggestEmojiForCategory,
  type EmojiSuggestion,
} from '@/lib/openrouter-service';
import { initializeCategoriesAction } from '@/app/actions/init-categories-action';

export default function CategoryManagementComponent() {
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    emoji: '',
    description: '',
    order: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [aiSuggestion, setAISuggestion] = useState<EmojiSuggestion | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<CategoryConfig | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initDialog, setInitDialog] = useState(false);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const configs = await getAllCategoryConfigs();
      setCategories(configs);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form reset
  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      emoji: '',
      description: '',
      order: categories.length,
    });
    setAISuggestion(null);
    setEditingId(null);
  };

  // Open edit dialog
  const handleEdit = (category: CategoryConfig) => {
    const nameWithoutEmoji = category.name.replace(new RegExp(`^${category.emoji}\\s*`), '').trim();
    setFormData({
      id: category.id,
      name: nameWithoutEmoji,
      emoji: category.emoji,
      description: category.description || '',
      order: category.order,
    });
    setEditingId(category.id);
    setIsDialogOpen(true);
  };

  // Get AI emoji suggestion
  const handleSuggestEmoji = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a category name first');
      return;
    }

    setIsAISuggesting(true);
    try {
      const usedEmojis = await getUsedEmojis(editingId || undefined);
      const suggestion = await suggestEmojiForCategory(formData.name, usedEmojis);
      setAISuggestion(suggestion);
      setFormData(prev => ({
        ...prev,
        emoji: suggestion.emoji,
      }));
      toast.success('AI suggested an emoji!');
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      toast.error('Failed to get emoji suggestion from AI');
    } finally {
      setIsAISuggesting(false);
    }
  };

  // Validate emoji uniqueness
  const validateEmoji = async (emoji: string): Promise<boolean> => {
    if (!emoji) {
      toast.error('Please select or enter an emoji');
      return false;
    }

    const used = await isEmojiUsed(emoji, editingId || undefined);
    if (used) {
      toast.error('This emoji is already used by another category');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.emoji) {
      toast.error('Please enter both category name and emoji');
      return;
    }

    // Validate emoji is unique
    const isValid = await validateEmoji(formData.emoji);
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const categoryId = formData.id || formData.name.toLowerCase().replace(/\s+/g, '-');
      const fullName = `${formData.emoji} ${formData.name}`;

      await setCategoryConfig(categoryId, {
        order: editingId ? formData.order : categories.length,
        emoji: formData.emoji,
        name: fullName,
        description: formData.description,
      });

      toast.success(editingId ? 'Category updated' : 'Category created');
      setIsDialogOpen(false);
      resetForm();
      await loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      // Move other categories down in order
      const categoryToDelete = categories.find(c => c.id === categoryId);
      if (!categoryToDelete) return;

      const updates = categories
        .filter(c => c.order > categoryToDelete.order)
        .map(c => ({
          id: c.id,
          order: c.order - 1,
        }));

      if (updates.length > 0) {
        await updateCategoryOrder(updates);
      }

      await loadCategories();
      toast.success('Category deleted');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  // Handle reorder via drag
  const handleReorder = async (newOrder: CategoryConfig[]) => {
    setCategories(newOrder);

    try {
      const updates = newOrder.map((cat, index) => ({
        id: cat.id,
        order: index,
      }));

      await updateCategoryOrder(updates);
      toast.success('Category order updated');
      await loadCategories();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update category order');
      await loadCategories();
    }
  };

  // Move category up/down
  const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.id === categoryId);
    if (index === -1) return;

    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newCategories = [...categories];
    [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];

    await handleReorder(newCategories);
  };

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      const result = await initializeCategoriesAction();
      
      if (result?.success) {
        // Reload categories from Firebase
        const updatedCategories = await getAllCategoryConfigs();
        setCategories(updatedCategories);
        toast.success(`✅ Successfully initialized ${result.summary?.success || 24} categories!`);
        setInitDialog(false);
      } else {
        toast.error(`❌ Initialization failed: ${result?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Initialize error:', error);
      toast.error('Failed to initialize categories');
    } finally {
      setIsInitializing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl rounded-2xl bg-gradient-to-br from-white to-slate-50">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-slate-600 font-semibold">Loading categories...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">📂 Category Management</h2>
          <p className="text-slate-600 mt-1">Manage category order, emojis, and organization</p>
        </div>
        <div className="flex gap-3">
          {categories.length === 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setInitDialog(true)}
              disabled={isInitializing}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg"
            >
              {isInitializing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Load 24 Categories
                </>
              )}
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </motion.button>
        </div>
      </div>

      {/* Categories List */}
      <Card className="border-0 shadow-xl rounded-2xl bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <CardTitle>Category Order</CardTitle>
          <p className="text-sm text-slate-600 mt-1">Drag to reorder categories. They will appear in this order on the menu.</p>
        </CardHeader>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <p>No categories yet. Add one to get started!</p>
            </div>
          ) : (
            <Reorder.Group
              values={categories}
              onReorder={handleReorder}
              className="space-y-2 p-6"
            >
              {categories.map((category, index) => (
                <Reorder.Item
                  key={category.id}
                  value={category}
                  drag
                  dragElastic={0.2}
                  onDragStart={() => setDraggedItem(category)}
                  onDragEnd={() => setDraggedItem(null)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    draggedItem?.id === category.id
                      ? 'border-orange-500 shadow-lg scale-102'
                      : expandedId === category.id
                      ? 'border-slate-300 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  } bg-white`}
                >
                  <div className="flex items-center gap-4">
                    {/* Drag Handle */}
                    <motion.div
                      whileHover={{ color: '#ea580c' }}
                      className="cursor-grab active:cursor-grabbing text-slate-400 flex-shrink-0"
                    >
                      <GripVertical className="w-5 h-5" />
                    </motion.div>

                    {/* Category Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900">
                            #{index + 1} - {category.name.replace(category.emoji, '').trim()}
                          </p>
                          {category.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(category)}
                        className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(category.id)}
                        className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl rounded-xl border-0 shadow-xl p-0 overflow-hidden bg-white">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-slate-200 px-6 py-4">
            <DialogTitle className="text-2xl font-bold text-slate-900">
              {editingId ? '✏️ Edit Category' : '➕ Add New Category'}
            </DialogTitle>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Category Name */}
            <div>
              <Label className="text-base font-semibold text-slate-900 block mb-2">
                Category Name
              </Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Vegetarische Gerichte"
                className="rounded-lg border-2 border-slate-200 focus:border-orange-500 p-3"
              />
              <p className="text-xs text-slate-500 mt-2">
                The category name without emoji (emoji will be added separately)
              </p>
            </div>

            {/* Emoji Selection */}
            <div>
              <Label className="text-base font-semibold text-slate-900 block mb-2">
                Emoji {formData.emoji && <span className="text-2xl ml-2">{formData.emoji}</span>}
              </Label>

              <div className="space-y-3">
                {/* AI Suggestion */}
                <motion.button
                  type="button"
                  onClick={handleSuggestEmoji}
                  disabled={isAISuggesting || !formData.name.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-3 border-2 border-purple-300 bg-purple-50 text-purple-700 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isAISuggesting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Getting AI suggestion...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Get AI Emoji Suggestion
                    </>
                  )}
                </motion.button>

                {/* AI Suggestion Display */}
                {aiSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg"
                  >
                    <p className="text-sm font-semibold text-purple-900 mb-2">
                      💡 AI Suggestion:
                    </p>
                    <p className="text-2xl mb-2">{aiSuggestion.emoji}</p>
                    <p className="text-sm text-purple-700">
                      {aiSuggestion.reasoning}
                    </p>
                  </motion.div>
                )}

                {/* Manual Emoji Input */}
                <div>
                  <Label className="text-sm font-semibold text-slate-700 block mb-2">
                    Or enter/paste emoji manually:
                  </Label>
                  <Input
                    type="text"
                    value={formData.emoji}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      emoji: e.target.value.trim().substring(0, 2),
                    }))}
                    placeholder="Paste emoji here (e.g., 🌱)"
                    className="rounded-lg border-2 border-slate-200 focus:border-orange-500 p-3 text-2xl text-center"
                    maxLength={2}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Copy/paste an emoji you prefer, or use AI suggestion
                  </p>
                </div>

                {/* Emoji Validation */}
                {formData.emoji && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-green-50 border-2 border-green-200 rounded-lg flex items-center gap-2"
                  >
                    <Check className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-700">
                      Selected emoji: <span className="text-xl">{formData.emoji}</span>
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Description (Optional) */}
            <div>
              <Label className="text-base font-semibold text-slate-900 block mb-2">
                Description (Optional)
              </Label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description for this category"
                className="rounded-lg border-2 border-slate-200 focus:border-orange-500 p-3"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="px-6 py-2 rounded-lg border-2 border-slate-300 text-slate-900"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Category
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Initialize Categories Dialog */}
      <Dialog open={initDialog} onOpenChange={setInitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Initialize Categories</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-600">
              This will load all 24 predefined categories from the project into your database:
            </p>
            <div className="max-h-64 overflow-y-auto bg-slate-50 p-4 rounded-lg border border-slate-200">
              <ul className="space-y-2 text-sm">
                <li>🍲 Suppen</li>
                <li>🥗 Salate</li>
                <li>🍤 Vorspeisen</li>
                <li>🌱 Vegetarische Gerichte</li>
                <li>🍗 Gerichte mit Huhn</li>
                <li>🍖 Lamm Spezialitäten</li>
                <li>🐟 Fisch Spezialitäten</li>
                <li>🍚 Biryani Spezialitäten</li>
                <li>🔥 Tandoori Spezialitäten</li>
                <li>🍞 Naan</li>
                <li>🥩 Rumpsteak</li>
                <li>🍖 Schnitzel</li>
                <li>🍗 Putenschnitzel</li>
                <li>🌿 Frischgerichte</li>
                <li>🍠 Beilagen</li>
                <li>🍝 Nudeln</li>
                <li>🍰 Dessert</li>
                <li>🥤 Alkoholfreie Getränke</li>
                <li>☕ Warme Getränke</li>
                <li>🍺 Biere</li>
                <li>🍎 Apfelwein</li>
                <li>🍾 Sekt & Spritz</li>
                <li>🥃 Spirituosen</li>
                <li>🍷 Offene Weine</li>
              </ul>
            </div>
            <div className="flex gap-3 justify-end">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleInitialize}
                disabled={isInitializing}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
              >
                {isInitializing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Initialize Categories
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
