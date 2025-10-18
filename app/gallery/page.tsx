'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Upload, X, Trash2, Image as ImageIcon, ChevronLeft, ChevronRight, Edit2, Save, FolderOpen } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import AlbumManager from '@/components/AlbumManager';

interface Photo {
  id: number;
  userId: number;
  title: string | null;
  description: string | null;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  album: string;
  albumId: number | null;
  uploadedAt: string;
  createdAt: string;
}

interface Album {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  coverPhotoId: number | null;
  coverPhotoPath: string | null;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [filterAlbumId, setFilterAlbumId] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>([]);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showAlbumManager, setShowAlbumManager] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [storyForm, setStoryForm] = useState({ 
    title: '', 
    description: '', 
    albumId: null as number | null 
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPhotos();
    fetchAlbums();
  }, [filterAlbumId]);

  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/albums');
      if (response.ok) {
        const data = await response.json();
        setAlbums(data.albums);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  };

  const fetchPhotos = async () => {
    const url = filterAlbumId === 'all' 
      ? '/api/photos' 
      : `/api/photos?albumId=${filterAlbumId}`;
    
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      setPhotos(data.photos);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    const newlyUploadedPhotos: Photo[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.split('.')[0]);
      
      // Use current filter or default to General album
      const albumIdToUse = filterAlbumId === 'all' 
        ? albums.find(a => a.name === 'General')?.id?.toString() || ''
        : filterAlbumId;
      
      if (albumIdToUse) {
        formData.append('albumId', albumIdToUse);
      }

      try {
        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          newlyUploadedPhotos.push(data.photo);
          setUploadProgress(((i + 1) / files.length) * 100);
        } else {
          const error = await response.json();
          alert(`Failed to upload ${file.name}: ${error.error}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Show story modal for uploaded photos
    if (newlyUploadedPhotos.length > 0) {
      setUploadedPhotos(newlyUploadedPhotos);
      setEditingPhoto(newlyUploadedPhotos[0]);
      setStoryForm({
        title: newlyUploadedPhotos[0].title || '',
        description: newlyUploadedPhotos[0].description || '',
        albumId: newlyUploadedPhotos[0].albumId
      });
      setShowStoryModal(true);
    }
    
    fetchPhotos();
  };

  const handleDelete = async (photoId: number) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    const response = await fetch(`/api/photos?id=${photoId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setSelectedPhoto(null);
      fetchPhotos();
    } else {
      alert('Failed to delete photo');
    }
  };

  const handleSaveStory = async () => {
    if (!editingPhoto) return;

    try {
      const response = await fetch('/api/photos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingPhoto.id,
          title: storyForm.title || null,
          description: storyForm.description || null,
          albumId: storyForm.albumId,
        }),
      });

      if (response.ok) {
        // Move to next photo or close modal
        const currentIndex = uploadedPhotos.findIndex(p => p.id === editingPhoto.id);
        if (currentIndex < uploadedPhotos.length - 1) {
          const nextPhoto = uploadedPhotos[currentIndex + 1];
          setEditingPhoto(nextPhoto);
          setStoryForm({
            title: nextPhoto.title || '',
            description: nextPhoto.description || '',
            albumId: nextPhoto.albumId
          });
        } else {
          setShowStoryModal(false);
          setUploadedPhotos([]);
          setEditingPhoto(null);
        }
        fetchPhotos();
      } else {
        alert('Failed to save story');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save story');
    }
  };

  const handleSkipStory = () => {
    const currentIndex = uploadedPhotos.findIndex(p => p.id === editingPhoto?.id);
    if (currentIndex < uploadedPhotos.length - 1) {
      const nextPhoto = uploadedPhotos[currentIndex + 1];
      setEditingPhoto(nextPhoto);
      setStoryForm({
        title: nextPhoto.title || '',
        description: nextPhoto.description || '',
        albumId: nextPhoto.albumId
      });
    } else {
      setShowStoryModal(false);
      setUploadedPhotos([]);
      setEditingPhoto(null);
    }
  };

  const handleEditFromLightbox = () => {
    if (!selectedPhoto) return;
    setEditingPhoto(selectedPhoto);
    setStoryForm({
      title: selectedPhoto.title || '',
      description: selectedPhoto.description || '',
      albumId: selectedPhoto.albumId
    });
    setUploadedPhotos([selectedPhoto]);
    setSelectedPhoto(null);
    setShowStoryModal(true);
  };

  const getUniqueAlbums = () => {
    const albums = new Set(photos.map(p => p.album));
    return Array.from(albums);
  };

  const getAlbumIcon = (album: string) => {
    const icons: { [key: string]: string } = {
      'general': '📷',
      'culinary': '🍽️',
      'travel': '✈️',
      'memories': '💝',
      'special': '⭐',
    };
    return icons[album] || '📸';
  };

  const getAlbumLabel = (album: string) => {
    const labels: { [key: string]: string } = {
      'general': 'General',
      'culinary': 'Culinary Moments',
      'travel': 'Travel',
      'memories': 'Memories',
      'special': 'Special Events',
    };
    return labels[album] || album.charAt(0).toUpperCase() + album.slice(1);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return;
    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % photos.length
      : (currentIndex - 1 + photos.length) % photos.length;
    setSelectedPhoto(photos[newIndex]);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-love-ice via-white to-love-lavender dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <PageHeader title="Photo Gallery" />
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          {/* Album Filter */}
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setFilterAlbumId('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterAlbumId === 'all'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              📸 All Photos
            </button>
            {albums.map(album => (
              <button
                key={album.id}
                onClick={() => setFilterAlbumId(album.id.toString())}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterAlbumId === album.id.toString()
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {getAlbumIcon(album.name.toLowerCase())} {album.name} ({album.photoCount})
              </button>
            ))}
            <button
              onClick={() => setShowAlbumManager(true)}
              className="px-4 py-2 rounded-lg font-medium transition bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 border-2 border-teal-600 dark:border-teal-400 hover:bg-teal-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <FolderOpen size={18} />
              Manage Albums
            </button>
          </div>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-md"
          >
            <Upload size={20} />
            Upload Photos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Upload size={20} className="text-blue-500 animate-pulse" />
              <span className="text-gray-700 dark:text-gray-300">Uploading photos...</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Photos Grid */}
        {photos.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center border border-gray-100 dark:border-gray-700">
            <Camera className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-2">
              No Photos Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Upload your first photo to start building your gallery!
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-md"
            >
              <Upload size={20} />
              Upload Your First Photo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="relative aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer group card-hover"
              >
                <Image
                  src={photo.filePath}
                  alt={photo.title || 'Photo'}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
                {/* Album Badge */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full flex items-center gap-1">
                    {getAlbumIcon(photo.album)}
                    <span className="hidden sm:inline">{getAlbumLabel(photo.album)}</span>
                  </span>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                  <ImageIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                </div>
                {photo.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium truncate">{photo.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }}
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

            <div className="max-w-6xl w-full h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex-1 relative flex items-center justify-center">
                <Image
                  src={selectedPhoto.filePath}
                  alt={selectedPhoto.title || 'Photo'}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>

              {/* Photo Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mt-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    {selectedPhoto.title && (
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {selectedPhoto.title}
                      </h3>
                    )}
                    {selectedPhoto.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {selectedPhoto.description}
                      </p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="capitalize">📁 {selectedPhoto.album}</span>
                      <span>📅 {new Date(selectedPhoto.uploadedAt).toLocaleDateString()}</span>
                      <span>📊 {(selectedPhoto.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditFromLightbox}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      <Edit2 size={16} />
                      Edit Photo
                    </button>
                    <button
                      onClick={() => handleDelete(selectedPhoto.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Story Modal */}
        {showStoryModal && editingPhoto && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {uploadedPhotos.length > 1 ? 'Add Story to Photos' : 'Edit Photo'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowStoryModal(false);
                      setUploadedPhotos([]);
                      setEditingPhoto(null);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                  >
                    <X size={24} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Photo Preview */}
                <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <Image
                    src={editingPhoto.filePath}
                    alt={editingPhoto.title || 'Photo'}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                {/* Progress Indicator */}
                {uploadedPhotos.length > 1 && (
                  <div className="mb-4 text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Photo {uploadedPhotos.findIndex(p => p.id === editingPhoto.id) + 1} of {uploadedPhotos.length}
                    </span>
                  </div>
                )}

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={storyForm.title}
                      onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                      placeholder="Give your photo a title..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Story / Description
                    </label>
                    <textarea
                      value={storyForm.description}
                      onChange={(e) => setStoryForm({ ...storyForm, description: e.target.value })}
                      placeholder="Tell the story behind this photo..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Album
                    </label>
                    <select
                      value={storyForm.albumId || ''}
                      onChange={(e) => setStoryForm({ ...storyForm, albumId: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select an album...</option>
                      {albums.map(album => (
                        <option key={album.id} value={album.id}>
                          {getAlbumIcon(album.name.toLowerCase())} {album.name} ({album.photoCount} photos)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSkipStory}
                    className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleSaveStory}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-md"
                  >
                    <Save size={16} />
                    {uploadedPhotos.findIndex(p => p.id === editingPhoto.id) < uploadedPhotos.length - 1 ? 'Save & Next' : 'Save & Finish'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Album Manager Modal */}
        <AlbumManager
          isOpen={showAlbumManager}
          onClose={() => setShowAlbumManager(false)}
          onAlbumCreated={() => {
            fetchAlbums();
            fetchPhotos();
          }}
          onAlbumUpdated={() => {
            fetchAlbums();
            fetchPhotos();
          }}
          onAlbumDeleted={() => {
            fetchAlbums();
            fetchPhotos();
            setFilterAlbumId('all');
          }}
        />
      </div>
    </div>
  );
}
