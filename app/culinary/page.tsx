'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChefHat, Heart, MapPin, Edit2, Trash2, Upload, X, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmojiStarRating, { CompactEmojiRating } from '@/components/EmojiStarRating';

interface CulinaryPlan {
  id: number;
  placeName: string;
  location?: string;
  cuisineType?: string;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  recommendedMenu?: string;
  notes?: string;
  status: 'wishlist' | 'planned' | 'visited';
  rating?: number;
  isFavorite: boolean;
  visitDate?: string;
  createdAt: string;
}

interface CulinaryPhoto {
  id: number;
  culinaryId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  photoOrder: number;
  uploadedAt: string;
  createdAt: string;
}

export default function RecipesPage() {
  const [plans, setPlans] = useState<CulinaryPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<CulinaryPlan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CulinaryPlan | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [photos, setPhotos] = useState<CulinaryPhoto[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const [photosChanged, setPhotosChanged] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (selectedPlan && selectedPlan.status === 'visited') {
      fetchPhotos(selectedPlan.id);
    } else {
      setPhotos([]);
    }
  }, [selectedPlan]);

  const fetchPlans = async () => {
    const response = await fetch('/api/culinary');
    if (response.ok) {
      const data = await response.json();
      setPlans(data.recipes);
    }
  };

  const fetchPhotos = async (culinaryId: number) => {
    const response = await fetch(`/api/culinary/photos?culinaryId=${culinaryId}`);
    if (response.ok) {
      const data = await response.json();
      setPhotos(data.photos);
    }
  };

  const handlePhotoUpload = async (photoOrder: number, file: File) => {
    if (!selectedPlan) return;

    setUploadingPhoto(photoOrder);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('culinaryId', selectedPlan.id.toString());
    formData.append('photoOrder', photoOrder.toString());

    try {
      const response = await fetch('/api/culinary/photos', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchPhotos(selectedPlan.id);
        setPhotosChanged(true);
      } else {
        const error = await response.json();
        alert(`Failed to upload photo: ${error.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload photo');
    } finally {
      setUploadingPhoto(null);
      if (fileInputRefs[photoOrder - 1].current) {
        fileInputRefs[photoOrder - 1].current!.value = '';
      }
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    if (!selectedPlan) return;

    const response = await fetch(`/api/culinary/photos?id=${photoId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      await fetchPhotos(selectedPlan.id);
      setPhotosChanged(true);
    } else {
      alert('Failed to delete photo');
    }
  };

  const handleSavePhotos = () => {
    setPhotosChanged(false);
    alert('Photos saved successfully!');
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (selectedPhotoIndex === null) return;
    const newIndex = direction === 'next' 
      ? (selectedPhotoIndex + 1) % photos.length
      : (selectedPhotoIndex - 1 + photos.length) % photos.length;
    setSelectedPhotoIndex(newIndex);
  };

  const toggleFavorite = async (plan: CulinaryPlan) => {
    await fetch('/api/culinary', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...plan, isFavorite: !plan.isFavorite }),
    });
    fetchPlans();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this culinary plan?')) {
      await fetch(`/api/culinary?id=${id}`, { method: 'DELETE' });
      setSelectedPlan(null);
      fetchPlans();
    }
  };

  const handleEdit = (plan: CulinaryPlan) => {
    setEditingPlan(plan);
    setShowForm(true);
    setSelectedPlan(null);
  };

  const statusColors = {
    wishlist: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    planned: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    visited: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  };

  const statusEmojis = {
    wishlist: '✨',
    planned: '📅',
    visited: '✅',
  };

  const filteredPlans = filterStatus === 'all' 
    ? plans 
    : plans.filter(p => p.status === filterStatus);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-love-ice via-white to-love-lavender dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <PageHeader title="Culinary Plan" />
        </div>
        
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition shadow-md"
          >
            <ChefHat size={20} />
            Add Place
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'wishlist', 'planned', 'visited'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setSelectedPlan(null); // Close detail view when filter changes
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === status
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {status === 'all' ? '🍽️ All Places' : `${statusEmojis[status as keyof typeof statusEmojis]} ${status.charAt(0).toUpperCase() + status.slice(1)}`}
            </button>
          ))}
        </div>

        {showForm ? (
          <CulinaryForm 
            plan={editingPlan} 
            onSave={() => { setShowForm(false); setEditingPlan(null); fetchPlans(); }} 
            onCancel={() => { setShowForm(false); setEditingPlan(null); }} 
          />
        ) : selectedPlan ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <button
              onClick={() => setSelectedPlan(null)}
              className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition"
            >
              <ChefHat size={20} />
              Back to all places
            </button>

            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{selectedPlan.placeName}</h2>
                <div className="flex flex-wrap gap-2 items-center mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[selectedPlan.status]}`}>
                    {statusEmojis[selectedPlan.status]} {selectedPlan.status.charAt(0).toUpperCase() + selectedPlan.status.slice(1)}
                  </span>
                  {selectedPlan.cuisineType && (
                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm font-medium">
                      🍜 {selectedPlan.cuisineType}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">
                    {selectedPlan.priceRange}
                  </span>
                </div>

                {/* Rating Display with Emoji */}
                {selectedPlan.rating && (
                  <div className="mt-4 mb-4">
                    <EmojiStarRating value={selectedPlan.rating} readonly={true} size="md" />
                  </div>
                )}

                {selectedPlan.location && (
                  <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400 mb-2">
                    <MapPin size={18} className="mt-1 flex-shrink-0" />
                    <span>{selectedPlan.location}</span>
                  </div>
                )}
                {selectedPlan.visitDate && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    📅 Visit Date: {new Date(selectedPlan.visitDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(selectedPlan)}
                  className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/40 transition"
                  title="Edit"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => handleDelete(selectedPlan.id)}
                  className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/40 transition"
                  title="Delete"
                >
                  <Trash2 size={20} />
                </button>
                <button
                  onClick={() => toggleFavorite(selectedPlan)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  title="Toggle Favorite"
                >
                  <Heart
                    size={24}
                    className={selectedPlan.isFavorite ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'}
                    fill={selectedPlan.isFavorite ? '#ef4444' : 'none'}
                  />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {selectedPlan.recommendedMenu && (
                <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 dark:text-gray-100">
                    <ChefHat size={20} className="text-teal-500" />
                    Recommended Menu
                  </h3>
                  <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 whitespace-pre-wrap border border-teal-100 dark:border-teal-800 dark:text-gray-300">
                    {selectedPlan.recommendedMenu}
                  </div>
                </div>
              )}

              {selectedPlan.notes && (
                <div>
                  <h3 className="text-xl font-semibold mb-3 dark:text-gray-100">Notes</h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 whitespace-pre-wrap border border-gray-200 dark:border-gray-600 dark:text-gray-300">
                    {selectedPlan.notes}
                  </div>
                </div>
              )}

              {/* Photo Upload Section - Only for Visited Places */}
              {selectedPlan.status === 'visited' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2 dark:text-gray-100">
                      📸 Our Moment Together
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">(Max 3 photos)</span>
                    </h3>
                    {photosChanged && (
                      <button
                        onClick={handleSavePhotos}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-md"
                      >
                        <Save size={16} />
                        Save Photos
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((photoOrder) => {
                      const existingPhoto = photos.find(p => p.photoOrder === photoOrder);
                      
                      return (
                        <div key={photoOrder} className="relative">
                          {existingPhoto ? (
                            <div 
                              className="relative aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden group cursor-pointer"
                              onClick={() => setSelectedPhotoIndex(photos.indexOf(existingPhoto))}
                            >
                              <Image
                                src={existingPhoto.filePath}
                                alt={`Photo ${photoOrder}`}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                sizes="(max-width: 768px) 100vw, 33vw"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePhoto(existingPhoto.id);
                                }}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                                title="Delete photo"
                              >
                                <X size={16} />
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-xs">
                                  {(existingPhoto.fileSize / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-square bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                              <input
                                ref={fileInputRefs[photoOrder - 1]}
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePhotoUpload(photoOrder, file);
                                }}
                                className="hidden"
                              />
                              <button
                                onClick={() => fileInputRefs[photoOrder - 1].current?.click()}
                                disabled={uploadingPhoto === photoOrder}
                                className="flex flex-col items-center gap-2 p-4 w-full h-full"
                              >
                                {uploadingPhoto === photoOrder ? (
                                  <>
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="text-gray-400 dark:text-gray-500" size={32} />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Photo {photoOrder}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-500">Click to upload</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    ℹ️ Upload photos from your visit. Max 10MB per photo. Supported: JPEG, PNG, GIF, WebP
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-xl shadow-lg p-6 cursor-pointer card-hover hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{plan.placeName}</h3>
                    {plan.location && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-2">
                        <MapPin size={14} />
                        {plan.location}
                      </p>
                    )}
                  </div>
                  <Heart
                    size={24}
                    className={plan.isFavorite ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'}
                    fill={plan.isFavorite ? '#ef4444' : 'none'}
                  />
                </div>

                <div className="flex flex-wrap gap-2 items-center mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[plan.status]}`}>
                    {statusEmojis[plan.status]} {plan.status}
                  </span>
                  {plan.cuisineType && (
                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium">
                      {plan.cuisineType}
                    </span>
                  )}
                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium">
                    {plan.priceRange}
                  </span>
                </div>

                {/* Compact Emoji Rating for List View */}
                {plan.rating && (
                  <div className="mb-3">
                    <CompactEmojiRating value={plan.rating} />
                  </div>
                )}

                {plan.recommendedMenu && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {plan.recommendedMenu.split('\n')[0]}
                  </p>
                )}
              </div>
            ))}
            {filteredPlans.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                <ChefHat size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>No culinary plans yet. Start planning your food adventures! 🍽️</p>
              </div>
            )}
          </div>
        )}

        {/* Photo Lightbox/Viewer */}
        {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
          <div
            className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedPhotoIndex(null); }}
              className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition z-10"
            >
              <X size={24} className="text-gray-700 dark:text-gray-300" />
            </button>

            {/* Navigation Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); navigatePhoto('prev'); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition z-10"
                >
                  <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigatePhoto('next'); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition z-10"
                >
                  <ChevronRight size={24} className="text-gray-700 dark:text-gray-300" />
                </button>
              </>
            )}

            {/* Photo */}
            <div className="max-w-5xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
              <div className="relative w-full h-full">
                <Image
                  src={photos[selectedPhotoIndex].filePath}
                  alt={`Photo ${photos[selectedPhotoIndex].photoOrder}`}
                  width={1200}
                  height={800}
                  className="object-contain max-h-[85vh] w-auto h-auto mx-auto rounded-lg"
                />
              </div>
              
              {/* Photo Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
                <div className="text-white text-center">
                  <p className="text-sm">
                    Photo {selectedPhotoIndex + 1} of {photos.length}
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    {(photos[selectedPhotoIndex].fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CulinaryForm({ plan, onSave, onCancel }: { plan?: CulinaryPlan | null; onSave: () => void; onCancel: () => void }) {
  const [placeName, setPlaceName] = useState(plan?.placeName || '');
  const [location, setLocation] = useState(plan?.location || '');
  const [cuisineType, setCuisineType] = useState(plan?.cuisineType || '');
  const [priceRange, setPriceRange] = useState<'$' | '$$' | '$$$' | '$$$$'>(plan?.priceRange || '$$');
  const [recommendedMenu, setRecommendedMenu] = useState(plan?.recommendedMenu || '');
  const [notes, setNotes] = useState(plan?.notes || '');
  const [status, setStatus] = useState<'wishlist' | 'planned' | 'visited'>(plan?.status || 'wishlist');
  const [rating, setRating] = useState<number | undefined>(plan?.rating);
  const [visitDate, setVisitDate] = useState(plan?.visitDate || '');
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handlePhotoSelect = (photoOrder: number, file: File | null) => {
    if (!file) return;
    
    const newPhotos = [...uploadedPhotos];
    newPhotos[photoOrder - 1] = file;
    setUploadedPhotos(newPhotos);
  };

  const handleRemovePhoto = (photoOrder: number) => {
    const newPhotos = [...uploadedPhotos];
    delete newPhotos[photoOrder - 1];
    setUploadedPhotos(newPhotos);
    if (fileInputRefs[photoOrder - 1].current) {
      fileInputRefs[photoOrder - 1].current!.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/culinary', {
      method: plan ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(plan && { id: plan.id }),
        placeName,
        location: location || undefined,
        cuisineType: cuisineType || undefined,
        priceRange,
        recommendedMenu: recommendedMenu || undefined,
        notes: notes || undefined,
        status,
        rating: rating || undefined,
        visitDate: visitDate || undefined,
        isFavorite: plan?.isFavorite || false,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const culinaryId = data.recipeId || plan?.id;

      // Upload photos if status is visited and photos are selected
      if (status === 'visited' && culinaryId) {
        const photosToUpload = uploadedPhotos.filter(file => file !== undefined && file !== null);
        
        if (photosToUpload.length > 0) {
          for (let i = 0; i < uploadedPhotos.length; i++) {
            const file = uploadedPhotos[i];
            if (!file) continue;

            setUploadingPhoto(i + 1);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('culinaryId', culinaryId.toString());
            formData.append('photoOrder', (i + 1).toString());

            try {
              const uploadResponse = await fetch('/api/culinary/photos', {
                method: 'POST',
                body: formData,
              });

              if (!uploadResponse.ok) {
                const error = await uploadResponse.json();
                console.error('Error uploading photo:', error);
                alert(`Failed to upload photo ${i + 1}: ${error.error}`);
              }
            } catch (error) {
              console.error('Error uploading photo:', error);
              alert(`Failed to upload photo ${i + 1}`);
            }
          }
        }
        setUploadingPhoto(null);
      }

      onSave();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 dark:text-gray-100">
        <ChefHat className="text-teal-500" />
        {plan ? 'Edit Culinary Plan' : 'Add New Culinary Plan'}
      </h2>
      
      <div className="space-y-4">
        {/* Place Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Place Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            placeholder="e.g., Sushi Paradise, Joe's Pizza"
            required
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            placeholder="e.g., 123 Main St, Downtown"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Cuisine Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cuisine Type</label>
            <input
              type="text"
              value={cuisineType}
              onChange={(e) => setCuisineType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              placeholder="e.g., Japanese, Italian"
            />
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price Range</label>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            >
              <option value="$">$ (Budget)</option>
              <option value="$$">$$ (Moderate)</option>
              <option value="$$$">$$$ (Expensive)</option>
              <option value="$$$$">$$$$ (Fine Dining)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            >
              <option value="wishlist">✨ Wishlist</option>
              <option value="planned">📅 Planned</option>
              <option value="visited">✅ Visited</option>
            </select>
          </div>
        </div>

        {/* Conditional fields for visited */}
        {status === 'visited' && (
          <div className="grid md:grid-cols-2 gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visit Date</label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Rate Your Experience
              </label>
              <EmojiStarRating 
                value={rating} 
                onChange={setRating}
                size="md"
              />
            </div>
          </div>
        )}

        {/* Recommended Menu */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recommended Menu / Must-Try Dishes
          </label>
          <textarea
            value={recommendedMenu}
            onChange={(e) => setRecommendedMenu(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
            placeholder="e.g., Spicy Tuna Roll, Dragon Roll, Miso Soup"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
            placeholder="Any additional notes, special occasions, tips..."
          />
        </div>

        {/* Photo Upload Section - Only for Visited Places */}
        {status === 'visited' && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 dark:text-gray-100">
              📸 Upload Photos
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">(Optional, Max 3 photos)</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((photoOrder) => {
                const selectedFile = uploadedPhotos[photoOrder - 1];
                
                return (
                  <div key={photoOrder} className="relative">
                    {selectedFile ? (
                      <div className="relative aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden group">
                        <Image
                          src={URL.createObjectURL(selectedFile)}
                          alt={`Photo ${photoOrder}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photoOrder)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          title="Remove photo"
                        >
                          <X size={16} />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <input
                          ref={fileInputRefs[photoOrder - 1]}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoSelect(photoOrder, file);
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRefs[photoOrder - 1].current?.click()}
                          className="flex flex-col items-center gap-2 p-4 w-full h-full"
                        >
                          <Upload className="text-gray-400 dark:text-gray-500" size={32} />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Photo {photoOrder}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">Click to select</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
              ℹ️ You can upload photos now or add them later after creating the place.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={uploadingPhoto !== null}
            className="flex-1 bg-teal-500 text-white font-semibold py-3 rounded-lg hover:bg-teal-600 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadingPhoto !== null ? `Uploading photo ${uploadingPhoto}...` : 'Save Culinary Plan'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={uploadingPhoto !== null}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
