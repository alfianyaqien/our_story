'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import {
  Camera,
  Upload,
  X,
  Trash2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Save,
  FolderOpen,
  Play,
  Pause,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import AlbumManager from '@/components/AlbumManager';
import { PageTitle } from '@/components/ui/PageTitle';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

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
    albumId: null as number | null,
  });
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [slideshowSpeed, setSlideshowSpeed] = useState(3000); // 3 seconds default
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slideshowIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchPhotos();
    fetchAlbums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterAlbumId]);

  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/albums');
      if (response.ok) {
        const data = await response.json();
        setAlbums(data.albums);
      }
    } catch (error) {
      // non-fatal: the album filter just stays empty
    }
  };

  const fetchPhotos = async () => {
    const url =
      filterAlbumId === 'all'
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
    setUploadError(null);
    const newlyUploadedPhotos: Photo[] = [];
    const failed: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.split('.')[0]);

      // Use current filter or default to General album
      const albumIdToUse =
        filterAlbumId === 'all'
          ? albums.find((a) => a.name === 'General')?.id?.toString() || ''
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
          failed.push(`${file.name}: ${error.error}`);
        }
      } catch (error) {
        failed.push(file.name);
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    if (failed.length) {
      setUploadError(`Failed to upload — ${failed.join('; ')}`);
    }

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
        albumId: newlyUploadedPhotos[0].albumId,
      });
      setShowStoryModal(true);
    }

    fetchPhotos();
  };

  const handleDelete = async (photoId: number) => {
    const response = await fetch(`/api/photos?id=${photoId}`, {
      method: 'DELETE',
    });

    setPendingDelete(null);
    if (response.ok) {
      setSelectedPhoto(null);
      fetchPhotos();
    } else {
      setUploadError('Failed to delete photo');
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
        const currentIndex = uploadedPhotos.findIndex(
          (p) => p.id === editingPhoto.id
        );
        if (currentIndex < uploadedPhotos.length - 1) {
          const nextPhoto = uploadedPhotos[currentIndex + 1];
          setEditingPhoto(nextPhoto);
          setStoryForm({
            title: nextPhoto.title || '',
            description: nextPhoto.description || '',
            albumId: nextPhoto.albumId,
          });
        } else {
          closeStoryModal();
        }
        fetchPhotos();
      } else {
        setUploadError('Failed to save story');
      }
    } catch (error) {
      setUploadError('Failed to save story');
    }
  };

  const closeStoryModal = () => {
    setShowStoryModal(false);
    setUploadedPhotos([]);
    setEditingPhoto(null);
  };

  const handleSkipStory = () => {
    const currentIndex = uploadedPhotos.findIndex(
      (p) => p.id === editingPhoto?.id
    );
    if (currentIndex < uploadedPhotos.length - 1) {
      const nextPhoto = uploadedPhotos[currentIndex + 1];
      setEditingPhoto(nextPhoto);
      setStoryForm({
        title: nextPhoto.title || '',
        description: nextPhoto.description || '',
        albumId: nextPhoto.albumId,
      });
    } else {
      closeStoryModal();
    }
  };

  const handleEditFromLightbox = () => {
    if (!selectedPhoto) return;
    setEditingPhoto(selectedPhoto);
    setStoryForm({
      title: selectedPhoto.title || '',
      description: selectedPhoto.description || '',
      albumId: selectedPhoto.albumId,
    });
    setUploadedPhotos([selectedPhoto]);
    setSelectedPhoto(null);
    setShowStoryModal(true);
  };

  const getAlbumLabel = (album: string) => {
    const labels: { [key: string]: string } = {
      general: 'General',
      culinary: 'Culinary Moments',
      travel: 'Travel',
      memories: 'Memories',
      special: 'Special Events',
    };
    return labels[album] || album.charAt(0).toUpperCase() + album.slice(1);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return;
    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    const newIndex =
      direction === 'next'
        ? (currentIndex + 1) % photos.length
        : (currentIndex - 1 + photos.length) % photos.length;
    setSelectedPhoto(photos[newIndex]);
  };

  const startSlideshow = () => {
    if (photos.length === 0) return;

    // Start from first photo if none selected, or continue from current
    if (!selectedPhoto) {
      setSelectedPhoto(photos[0]);
    }

    setIsSlideshow(true);
  };

  const stopSlideshow = () => {
    setIsSlideshow(false);
    if (slideshowIntervalRef.current) {
      clearInterval(slideshowIntervalRef.current);
      slideshowIntervalRef.current = null;
    }
  };

  // Slideshow effect
  useEffect(() => {
    if (isSlideshow && selectedPhoto && photos.length > 1) {
      slideshowIntervalRef.current = setInterval(() => {
        navigatePhoto('next');
      }, slideshowSpeed);

      return () => {
        if (slideshowIntervalRef.current) {
          clearInterval(slideshowIntervalRef.current);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSlideshow, selectedPhoto, photos, slideshowSpeed]);

  // Stop slideshow when the lightbox closes
  useEffect(() => {
    if (!selectedPhoto) {
      stopSlideshow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhoto]);

  // Arrow-key navigation while the lightbox is open
  useEffect(() => {
    if (!selectedPhoto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigatePhoto('next');
      if (e.key === 'ArrowLeft') navigatePhoto('prev');
      if (e.key === 'Escape') setSelectedPhoto(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhoto, photos]);

  return (
    <AppShell>
      <PageTitle
        title="Photo Gallery"
        description="Every moment worth keeping."
        action={
          <>
            <Button
              variant="secondary"
              onClick={startSlideshow}
              disabled={photos.length === 0}
              title="Start slideshow"
            >
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Slideshow</span>
            </Button>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
          </>
        }
      />

      {/* Album filter */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button
          variant={filterAlbumId === 'all' ? 'primary' : 'secondary'}
          size="sm"
          className="h-10 sm:h-8"
          onClick={() => setFilterAlbumId('all')}
        >
          All photos
        </Button>
        {albums.map((album) => (
          <Button
            key={album.id}
            variant={
              filterAlbumId === album.id.toString() ? 'primary' : 'secondary'
            }
            size="sm"
            className="h-10 sm:h-8"
            onClick={() => setFilterAlbumId(album.id.toString())}
          >
            {album.name} ({album.photoCount})
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="h-10 sm:h-8"
          onClick={() => setShowAlbumManager(true)}
        >
          <FolderOpen className="h-4 w-4" />
          Manage albums
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload progress */}
      {isUploading && (
        <Card className="mb-6 p-4">
          <div className="mb-2 flex items-center gap-3">
            <Upload className="h-5 w-5 animate-pulse text-brand-500" />
            <span className="text-sm text-fg">Uploading photos…</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-2 rounded-full bg-brand-gradient transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </Card>
      )}

      {uploadError && (
        <Card className="mb-6 border-red-200 p-4 text-sm text-red-700 dark:border-red-900/50 dark:text-red-300">
          <div className="flex items-start justify-between gap-3">
            <span className="break-words">{uploadError}</span>
            <button
              onClick={() => setUploadError(null)}
              className="shrink-0 text-muted hover:text-fg"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {/* Photo grid */}
      {photos.length === 0 ? (
        <Card>
          <EmptyState
            icon={Camera}
            title="No photos yet"
            description="Upload your first photo to start building the gallery."
            action={
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Upload your first photo
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-2xl border border-default bg-surface-2 shadow-soft transition-all duration-200',
                'hover:-translate-y-0.5 hover:shadow-card',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50'
              )}
            >
              <Image
                src={photo.filePath}
                alt={photo.title || 'Photo'}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
              <span className="absolute left-2 top-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                {getAlbumLabel(photo.album)}
              </span>
              <span className="absolute inset-0 grid place-items-center bg-black/0 transition-all duration-300 group-hover:bg-black/40">
                <ImageIcon className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              {photo.title && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="block truncate text-sm font-medium text-white">
                    {photo.title}
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPhoto(null);
            }}
            className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-surface text-fg shadow-pop transition hover:bg-surface-2"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Slideshow controls */}
          {photos.length > 1 && (
            <div
              className="absolute right-4 top-20 z-20 flex flex-col gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <select
                value={slideshowSpeed}
                onChange={(e) => setSlideshowSpeed(Number(e.target.value))}
                className="h-11 cursor-pointer rounded-xl border border-default bg-surface px-3 text-sm text-fg shadow-pop"
                aria-label="Slideshow speed"
              >
                <option value="2000">Fast (2s)</option>
                <option value="3000">Normal (3s)</option>
                <option value="5000">Slow (5s)</option>
              </select>

              {isSlideshow ? (
                <Button variant="secondary" onClick={stopSlideshow}>
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              ) : (
                <Button onClick={startSlideshow}>
                  <Play className="h-4 w-4" />
                  Play
                </Button>
              )}
            </div>
          )}

          {/* Navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigatePhoto('prev');
                }}
                className="absolute left-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-surface text-fg shadow-pop transition hover:bg-surface-2"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigatePhoto('next');
                }}
                className="absolute right-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-surface text-fg shadow-pop transition hover:bg-surface-2"
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="absolute left-4 top-4 z-20 rounded-lg bg-black/60 px-3 py-2">
                <span className="text-sm font-medium text-white">
                  {photos.findIndex((p) => p.id === selectedPhoto.id) + 1} /{' '}
                  {photos.length}
                </span>
              </div>
            </>
          )}

          <div
            className="flex h-full w-full max-w-6xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex flex-1 items-center justify-center">
              <Image
                src={selectedPhoto.filePath}
                alt={selectedPhoto.title || 'Photo'}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {/* Photo info */}
            <Card className="mt-4 max-h-[40vh] shrink-0 overflow-y-auto scrollbar-thin p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {selectedPhoto.title && (
                    <h3 className="mb-2 break-words text-lg font-bold text-fg">
                      {selectedPhoto.title}
                    </h3>
                  )}
                  {selectedPhoto.description && (
                    <p className="mb-2 break-words text-sm text-muted">
                      {selectedPhoto.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="capitalize">{selectedPhoto.album}</span>
                    <span>
                      {new Date(
                        selectedPhoto.uploadedAt
                      ).toLocaleDateString()}
                    </span>
                    <span>
                      {(selectedPhoto.fileSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="secondary" onClick={handleEditFromLightbox}>
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setPendingDelete(selectedPhoto.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Add story modal */}
      <Modal
        open={showStoryModal && !!editingPhoto}
        onClose={closeStoryModal}
        size="lg"
        title={uploadedPhotos.length > 1 ? 'Add story to photos' : 'Edit photo'}
        description={
          uploadedPhotos.length > 1 && editingPhoto
            ? `Photo ${
                uploadedPhotos.findIndex((p) => p.id === editingPhoto.id) + 1
              } of ${uploadedPhotos.length}`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={handleSkipStory}>
              Skip
            </Button>
            <Button onClick={handleSaveStory}>
              <Save className="h-4 w-4" />
              {editingPhoto &&
              uploadedPhotos.findIndex((p) => p.id === editingPhoto.id) <
                uploadedPhotos.length - 1
                ? 'Save & next'
                : 'Save & finish'}
            </Button>
          </>
        }
      >
        {editingPhoto && (
          <>
            <div className="relative mb-6 h-56 w-full overflow-hidden rounded-xl border border-default bg-surface-2 sm:h-64">
              <Image
                src={editingPhoto.filePath}
                alt={editingPhoto.title || 'Photo'}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            <div className="space-y-4">
              <Field label="Title" htmlFor="ph-title">
                <Input
                  id="ph-title"
                  type="text"
                  value={storyForm.title}
                  onChange={(e) =>
                    setStoryForm({ ...storyForm, title: e.target.value })
                  }
                  placeholder="Give your photo a title…"
                />
              </Field>

              <Field label="Story / description" htmlFor="ph-desc">
                <Textarea
                  id="ph-desc"
                  value={storyForm.description}
                  onChange={(e) =>
                    setStoryForm({ ...storyForm, description: e.target.value })
                  }
                  placeholder="Tell the story behind this photo…"
                  rows={4}
                />
              </Field>

              <Field label="Album" htmlFor="ph-album">
                <Select
                  id="ph-album"
                  value={storyForm.albumId || ''}
                  onChange={(e) =>
                    setStoryForm({
                      ...storyForm,
                      albumId: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                >
                  <option value="">Select an album…</option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.name} ({album.photoCount} photos)
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </>
        )}
      </Modal>

      <ConfirmModal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete !== null && handleDelete(pendingDelete)}
        title="Delete this photo?"
        description="This cannot be undone."
        confirmText="Delete"
        danger
      />

      {/* Album manager modal */}
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
    </AppShell>
  );
}
