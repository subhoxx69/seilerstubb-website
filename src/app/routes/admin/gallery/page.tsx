'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  uploadGalleryImage, 
  deleteGalleryImage, 
  getGalleryImages,
  updateGalleryImage,
  GalleryImage 
} from '@/lib/firebase/imagekit-gallery-service';
import {
  subscribeToCategories,
  addCategory,
  deleteCategory,
  GalleryCategory,
} from '@/lib/firebase/gallery-categories-service';
import { AdminProtection } from '@/components/admin/admin-protection';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  Loader, 
  Check, 
  AlertCircle,
  Star,
  Settings,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    category: '',
  });
  const [filter, setFilter] = useState<string>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  // Load gallery images and categories
  useEffect(() => {
    loadGalleryImages();
    loadCategories();
  }, []);

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: categories[0].name }));
      setFilter(categories[0].name);
    }
  }, [categories]);

  const loadGalleryImages = async () => {
    try {
      setIsLoading(true);
      const galleryImages = await getGalleryImages();
      setImages(galleryImages);
    } catch (error) {
      console.error('Error loading gallery:', error);
      toast.error('Fehler beim Laden der Galerie');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = () => {
    try {
      subscribeToCategories(
        (loadedCategories) => {
          setCategories(loadedCategories);
        },
        (error) => {
          console.error('Error loading categories:', error);
          toast.error('Fehler beim Laden der Kategorien');
        }
      );
    } catch (error) {
      console.error('Error setting up categories listener:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Bitte wählen Sie eine Bilddatei');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !formData.category) {
      toast.error('Bitte wählen Sie ein Bild und eine Kategorie');
      return;
    }

    try {
      setIsUploading(true);
      
      // Generate automatic title and alt text from filename
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
      const autoTitle = fileName.replace(/[-_]/g, ' ');
      const autoAlt = `${autoTitle} - ${formData.category}`;
      
      await uploadGalleryImage(
        selectedFile,
        autoTitle,
        formData.description,
        formData.category as any,
        autoAlt,
      );

      toast.success('Bild erfolgreich hochgeladen');
      setSelectedFile(null);
      setFormData({
        description: '',
        category: categories.length > 0 ? categories[0].name : '',
      });
      setIsUploadDialogOpen(false);
      loadGalleryImages();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Fehler beim Hochladen des Bildes');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (imageId: string, fileId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie dieses Bild löschen möchten?')) {
      return;
    }

    try {
      await deleteGalleryImage(imageId, fileId);
      toast.success('Bild erfolgreich gelöscht');
      loadGalleryImages();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fehler beim Löschen des Bildes');
    }
  };

  const handleToggleFeatured = async (image: GalleryImage) => {
    try {
      await updateGalleryImage(image.id, {
        ...image,
        featured: !image.featured,
      });
      toast.success(image.featured ? 'Aus Favoriten entfernt' : 'Zu Favoriten hinzugefügt');
      loadGalleryImages();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Kategoriename erforderlich');
      return;
    }

    try {
      await addCategory(newCategoryName, newCategoryDescription);
      toast.success('Kategorie erfolgreich hinzugefügt');
      setNewCategoryName('');
      setNewCategoryDescription('');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Fehler beim Hinzufügen der Kategorie');
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Sind Sie sicher, dass Sie die Kategorie "${categoryName}" löschen möchten?`)) {
      return;
    }

    try {
      await deleteCategory(categoryId);
      toast.success('Kategorie erfolgreich gelöscht');
      
      if (filter === categoryName) {
        setFilter('all');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Fehler beim Löschen der Kategorie');
    }
  };

  const filteredImages = filter === 'all'
    ? images
    : images.filter(img => img.category === filter);

  return (
    <AdminProtection>
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <ImageIcon className="w-10 h-10 text-orange-600" />
              Galerie-Verwaltung
            </h1>
            <p className="text-slate-600">Verwalten Sie die Restaurant-Galerie mit ImageKit und Firebase</p>
          </div>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg shadow-lg transition-all"
              >
                <Settings className="w-5 h-5" />
                Kategorien
              </motion.button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white border-slate-200 max-h-[85vh] overflow-y-auto">
              <DialogHeader className="sticky top-0 bg-white pb-4 border-b border-slate-200">
                <DialogTitle className="text-2xl text-slate-900 flex items-center gap-3">
                  <Settings className="w-6 h-6 text-blue-600" />
                  Kategorien verwalten
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Add New Category - Enhanced */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200 rounded-xl"
                >
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Neue Kategorie erstellen
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 mb-2 block">Kategoriename *</Label>
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="z.B. Restaurant, Speisen, Events, Ambiente..."
                        className="bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-700 mb-2 block">Beschreibung (optional)</Label>
                      <Textarea
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        placeholder="Beschreibung der Kategorie..."
                        className="bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm resize-none"
                        rows={2}
                      />
                    </div>
                    <Button
                      onClick={handleAddCategory}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-all"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Kategorie hinzufügen
                    </Button>
                  </div>
                </motion.div>

                {/* Existing Categories - Enhanced */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-orange-600" />
                    Vorhandene Kategorien
                    <span className="ml-auto text-sm font-normal bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                      {categories.length}
                    </span>
                  </h3>
                  
                  {categories.length === 0 ? (
                    <div className="text-center py-8 text-slate-600">
                      <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p>Keine Kategorien vorhanden. Erstellen Sie eine neue!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2">
                      {categories.map((category, idx) => (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-2">
                              <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {category.name}
                              </p>
                              {category.description && (
                                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                  {category.description}
                                </p>
                              )}
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteCategory(category.id, category.name)}
                              className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title={`Kategorie "${category.name}" löschen`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Upload Section */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg mb-8 transition-all"
            >
              <Upload className="w-5 h-5" />
              Neues Bild hochladen
            </motion.button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white border-slate-200 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 bg-white pb-4 border-b border-slate-200">
              <DialogTitle className="text-2xl text-slate-900 flex items-center gap-3">
                <Upload className="w-6 h-6 text-blue-600" />
                Neues Bild hochladen
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-5 py-4">
              {/* File Upload - Enhanced */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 transition-colors"
              >
                <Label className="text-sm font-bold text-slate-900 mb-3 block flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                  Bilddatei auswählen *
                </Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 cursor-pointer hover:bg-slate-50 file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                </div>
                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-3 p-3 bg-white border border-green-200 rounded-lg flex items-center gap-2"
                  >
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-green-700">{selectedFile.name}</p>
                      <p className="text-xs text-slate-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Category */}
              <div>
                <Label className="text-sm font-semibold text-slate-900 mb-2 block">Kategorie *</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    category: e.target.value
                  })}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Wählen Sie eine Kategorie...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">⚠️ Bitte erstellen Sie zuerst eine Kategorie</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-semibold text-slate-900 mb-2 block">Beschreibung (optional)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Geben Sie eine Beschreibung des Bildes ein..."
                  className="bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <DialogClose asChild>
                  <Button className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-2 rounded-lg transition-all">
                    Abbrechen
                  </Button>
                </DialogClose>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile || !formData.category}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-2 rounded-lg transition-all"
                >
                  {isUploading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Lädt...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Hochladen
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Filter */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <motion.button
            key="all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Alle
          </motion.button>
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(cat.name)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === cat.name
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {cat.name}
            </motion.button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full"
            />
          </div>
        ) : filteredImages.length === 0 ? (
          <Card className="bg-slate-50 border-slate-200 p-12 text-center">
            <ImageIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">Keine Bilder in dieser Kategorie</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredImages.map((image, idx) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="bg-white border-slate-200 overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all group">
                    {/* Image */}
                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                      <img
                        src={image.imageKitUrl}
                        alt={image.alt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {image.featured && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-slate-900 p-2 rounded-full">
                          <Star className="w-4 h-4 fill-current" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-slate-900">{image.title}</h3>
                      <p className="text-xs text-slate-600">{image.category}</p>
                      {image.description && (
                        <p className="text-sm text-slate-700 line-clamp-2">
                          {image.description}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleToggleFeatured(image)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            image.featured
                              ? 'bg-yellow-400 text-slate-900'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          <Star className="w-4 h-4" />
                          {image.featured ? 'Favorit' : 'Hinzufügen'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(image.id, image.imageKitFileId)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Stats */}
        {!isLoading && filteredImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 p-6 bg-slate-50 border border-slate-200 rounded-lg"
          >
            <p className="text-slate-700">
              <strong className="text-slate-900">{filteredImages.length}</strong> Bilder in dieser Kategorie
            </p>
          </motion.div>
        )}
      </div>
    </AdminProtection>
  );
}