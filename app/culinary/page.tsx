'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import {
  ChefHat,
  Heart,
  MapPin,
  Edit2,
  Trash2,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Save,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import EmojiStarRating, {
  CompactEmojiRating,
} from '@/components/EmojiStarRating';
import { PageTitle } from '@/components/ui/PageTitle';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { Badge, EmptyState, Spinner, Alert } from '@/components/ui/Feedback';
import { ConfirmModal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

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

const STATUS_VARIANT = {
  wishlist: 'default',
  planned: 'brand',
  visited: 'green',
} as const;

const FILTERS = ['all', 'wishlist', 'planned', 'visited'] as const;

export default function RecipesPage() {
  const [plans, setPlans] = useState<CulinaryPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<CulinaryPlan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CulinaryPlan | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [photos, setPhotos] = useState<CulinaryPhoto[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const [photosChanged, setPhotosChanged] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null
  );
  const [pendingDeletePlan, setPendingDeletePlan] = useState<number | null>(
    null
  );
  const [pendingDeletePhoto, setPendingDeletePhoto] = useState<number | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const fileInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

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
    const response = await fetch(
      `/api/culinary/photos?culinaryId=${culinaryId}`
    );
    if (response.ok) {
      const data = await response.json();
      setPhotos(data.photos);
    }
  };

  const handlePhotoUpload = async (photoOrder: number, file: File) => {
    if (!selectedPlan) return;

    setUploadingPhoto(photoOrder);
    setError(null);

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
        const err = await response.json();
        setError(`Failed to upload photo: ${err.error}`);
      }
    } catch (err) {
      setError('Failed to upload photo');
    } finally {
      setUploadingPhoto(null);
      if (fileInputRefs[photoOrder - 1].current) {
        fileInputRefs[photoOrder - 1].current!.value = '';
      }
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    setPendingDeletePhoto(null);
    if (!selectedPlan) return;

    const response = await fetch(`/api/culinary/photos?id=${photoId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      await fetchPhotos(selectedPlan.id);
      setPhotosChanged(true);
    } else {
      setError('Failed to delete photo');
    }
  };

  const handleSavePhotos = () => {
    setPhotosChanged(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (selectedPhotoIndex === null) return;
    const newIndex =
      direction === 'next'
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
    // keep the open detail view in sync
    setSelectedPlan((p) =>
      p && p.id === plan.id ? { ...p, isFavorite: !plan.isFavorite } : p
    );
    fetchPlans();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/culinary?id=${id}`, { method: 'DELETE' });
    setPendingDeletePlan(null);
    setSelectedPlan(null);
    fetchPlans();
  };

  const handleEdit = (plan: CulinaryPlan) => {
    setEditingPlan(plan);
    setShowForm(true);
    setSelectedPlan(null);
  };

  const filteredPlans =
    filterStatus === 'all'
      ? plans
      : plans.filter((p) => p.status === filterStatus);

  return (
    <AppShell>
      <PageTitle
        title="Culinary Plan"
        description="Places to try, and the ones you loved."
        action={
          !showForm &&
          !selectedPlan && (
            <Button onClick={() => setShowForm(true)}>
              <ChefHat className="h-4 w-4" />
              Add place
            </Button>
          )
        }
      />

      {error && (
        <Alert variant="error" className="mb-6">
          <span className="flex items-start justify-between gap-3">
            <span className="break-words">{error}</span>
            <button
              onClick={() => setError(null)}
              aria-label="Dismiss"
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        </Alert>
      )}
      {savedNotice && (
        <Alert variant="success" className="mb-6">
          Photos saved.
        </Alert>
      )}

      {/* Filter tabs */}
      {!showForm && !selectedPlan && (
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'primary' : 'secondary'}
              size="sm"
              className="h-10 capitalize sm:h-8"
              onClick={() => {
                setFilterStatus(status);
                setSelectedPlan(null);
              }}
            >
              {status === 'all' ? 'All places' : status}
            </Button>
          ))}
        </div>
      )}

      {showForm ? (
        <CulinaryForm
          plan={editingPlan}
          onSave={() => {
            setShowForm(false);
            setEditingPlan(null);
            fetchPlans();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingPlan(null);
          }}
        />
      ) : selectedPlan ? (
        <Card className="p-6 sm:p-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 h-10 sm:h-8"
            onClick={() => setSelectedPlan(null)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all places
          </Button>

          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="mb-2 break-words text-2xl font-bold tracking-tight text-fg sm:text-3xl">
                {selectedPlan.placeName}
              </h2>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_VARIANT[selectedPlan.status]}>
                  {selectedPlan.status.charAt(0).toUpperCase() +
                    selectedPlan.status.slice(1)}
                </Badge>
                {selectedPlan.cuisineType && (
                  <Badge variant="amber">{selectedPlan.cuisineType}</Badge>
                )}
                <Badge variant="green">{selectedPlan.priceRange}</Badge>
              </div>

              {selectedPlan.rating && (
                <div className="mb-4">
                  <EmojiStarRating
                    value={selectedPlan.rating}
                    readonly
                    size="md"
                  />
                </div>
              )}

              {selectedPlan.location && (
                <div className="mb-2 flex items-start gap-2 text-sm text-muted">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="break-words">{selectedPlan.location}</span>
                </div>
              )}
              {selectedPlan.visitDate && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Calendar className="h-4 w-4 shrink-0" />
                  Visited{' '}
                  {new Date(selectedPlan.visitDate).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => handleEdit(selectedPlan)}
                aria-label="Edit place"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setPendingDeletePlan(selectedPlan.id)}
                aria-label="Delete place"
                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleFavorite(selectedPlan)}
                aria-label="Toggle favourite"
                aria-pressed={selectedPlan.isFavorite}
              >
                <Heart
                  className={cn(
                    'h-5 w-5',
                    selectedPlan.isFavorite ? 'text-red-500' : 'text-muted'
                  )}
                  fill={selectedPlan.isFavorite ? 'currentColor' : 'none'}
                />
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {selectedPlan.recommendedMenu && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-fg">
                  <ChefHat className="h-5 w-5 text-brand-500" />
                  Recommended menu
                </h3>
                <div className="whitespace-pre-wrap break-words rounded-xl border border-default bg-surface-2 p-4 text-sm text-fg">
                  {selectedPlan.recommendedMenu}
                </div>
              </div>
            )}

            {selectedPlan.notes && (
              <div>
                <h3 className="mb-3 text-lg font-semibold text-fg">Notes</h3>
                <div className="whitespace-pre-wrap break-words rounded-xl border border-default bg-surface-2 p-4 text-sm text-fg">
                  {selectedPlan.notes}
                </div>
              </div>
            )}

            {/* Photos - visited places only */}
            {selectedPlan.status === 'visited' && (
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-fg">
                    Our moment together{' '}
                    <span className="text-sm font-normal text-muted">
                      (max 3 photos)
                    </span>
                  </h3>
                  {photosChanged && (
                    <Button size="sm" onClick={handleSavePhotos}>
                      <Save className="h-4 w-4" />
                      Save photos
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[1, 2, 3].map((photoOrder) => {
                    const existingPhoto = photos.find(
                      (p) => p.photoOrder === photoOrder
                    );

                    return (
                      <div key={photoOrder} className="relative">
                        {existingPhoto ? (
                          <div
                            className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-default bg-surface-2"
                            onClick={() =>
                              setSelectedPhotoIndex(
                                photos.indexOf(existingPhoto)
                              )
                            }
                          >
                            <Image
                              src={existingPhoto.filePath}
                              alt={`Photo ${photoOrder}`}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              sizes="(max-width: 640px) 100vw, 33vw"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingDeletePhoto(existingPhoto.id);
                              }}
                              className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-red-600 text-white opacity-0 transition-opacity hover:bg-red-700 group-hover:opacity-100"
                              aria-label="Delete photo"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                              <p className="text-xs text-white">
                                {(
                                  existingPhoto.fileSize /
                                  1024 /
                                  1024
                                ).toFixed(2)}{' '}
                                MB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-square rounded-xl border-2 border-dashed border-default bg-surface-2/60 transition hover:border-brand-300">
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
                              type="button"
                              onClick={() =>
                                fileInputRefs[photoOrder - 1].current?.click()
                              }
                              disabled={uploadingPhoto === photoOrder}
                              className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 disabled:opacity-60"
                            >
                              {uploadingPhoto === photoOrder ? (
                                <>
                                  <Spinner className="h-7 w-7" />
                                  <span className="text-sm text-muted">
                                    Uploading…
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Upload className="h-7 w-7 text-muted" />
                                  <span className="text-sm text-fg">
                                    Photo {photoOrder}
                                  </span>
                                  <span className="text-xs text-muted">
                                    Click to upload
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p className="mt-3 text-xs text-muted">
                  Max 10MB per photo. Supported: JPEG, PNG, GIF, WebP.
                </p>
              </div>
            )}
          </div>
        </Card>
      ) : filteredPlans.length === 0 ? (
        <Card>
          <EmptyState
            icon={ChefHat}
            title="No culinary plans yet"
            description={
              filterStatus === 'all'
                ? 'Start planning your food adventures.'
                : `Nothing marked "${filterStatus}" yet.`
            }
            action={
              <Button onClick={() => setShowForm(true)}>Add place</Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPlans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={cn(
                'rounded-2xl border border-default bg-surface p-6 text-left shadow-soft transition-all duration-200',
                'hover:-translate-y-0.5 hover:shadow-card',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50'
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="mb-2 break-words text-lg font-bold tracking-tight text-fg">
                    {plan.placeName}
                  </h3>
                  {plan.location && (
                    <p className="flex items-center gap-1.5 text-sm text-muted">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{plan.location}</span>
                    </p>
                  )}
                </div>
                <Heart
                  className={cn(
                    'h-5 w-5 shrink-0',
                    plan.isFavorite ? 'text-red-500' : 'text-muted/50'
                  )}
                  fill={plan.isFavorite ? 'currentColor' : 'none'}
                />
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_VARIANT[plan.status]}>
                  {plan.status}
                </Badge>
                {plan.cuisineType && (
                  <Badge variant="amber">{plan.cuisineType}</Badge>
                )}
                <Badge variant="green">{plan.priceRange}</Badge>
              </div>

              {plan.rating && (
                <div className="mb-3">
                  <CompactEmojiRating value={plan.rating} />
                </div>
              )}

              {plan.recommendedMenu && (
                <p className="line-clamp-2 break-words text-sm text-muted">
                  {plan.recommendedMenu.split('\n')[0]}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Photo lightbox */}
      {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPhotoIndex(null);
            }}
            className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-surface text-fg shadow-pop transition hover:bg-surface-2"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

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
            </>
          )}

          <div
            className="relative max-h-[90vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[selectedPhotoIndex].filePath}
              alt={`Photo ${photos[selectedPhotoIndex].photoOrder}`}
              width={1200}
              height={800}
              className="mx-auto h-auto max-h-[85vh] w-auto rounded-xl object-contain"
            />
            <div className="absolute inset-x-0 bottom-0 rounded-b-xl bg-gradient-to-t from-black/80 to-transparent p-4 text-center">
              <p className="text-sm text-white">
                Photo {selectedPhotoIndex + 1} of {photos.length}
              </p>
              <p className="mt-1 text-xs text-white/70">
                {(
                  photos[selectedPhotoIndex].fileSize /
                  1024 /
                  1024
                ).toFixed(2)}{' '}
                MB
              </p>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={pendingDeletePlan !== null}
        onClose={() => setPendingDeletePlan(null)}
        onConfirm={() =>
          pendingDeletePlan !== null && handleDelete(pendingDeletePlan)
        }
        title="Delete this culinary plan?"
        description="This cannot be undone."
        confirmText="Delete"
        danger
      />

      <ConfirmModal
        open={pendingDeletePhoto !== null}
        onClose={() => setPendingDeletePhoto(null)}
        onConfirm={() =>
          pendingDeletePhoto !== null && handleDeletePhoto(pendingDeletePhoto)
        }
        title="Delete this photo?"
        description="This cannot be undone."
        confirmText="Delete"
        danger
      />
    </AppShell>
  );
}

function CulinaryForm({
  plan,
  onSave,
  onCancel,
}: {
  plan?: CulinaryPlan | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [placeName, setPlaceName] = useState(plan?.placeName || '');
  const [location, setLocation] = useState(plan?.location || '');
  const [cuisineType, setCuisineType] = useState(plan?.cuisineType || '');
  const [priceRange, setPriceRange] = useState<'$' | '$$' | '$$$' | '$$$$'>(
    plan?.priceRange || '$$'
  );
  const [recommendedMenu, setRecommendedMenu] = useState(
    plan?.recommendedMenu || ''
  );
  const [notes, setNotes] = useState(plan?.notes || '');
  const [status, setStatus] = useState<'wishlist' | 'planned' | 'visited'>(
    plan?.status || 'wishlist'
  );
  const [rating, setRating] = useState<number | undefined>(plan?.rating);
  const [visitDate, setVisitDate] = useState(plan?.visitDate || '');
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

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
    setSaving(true);
    setFormError(null);

    try {
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
          const failed: string[] = [];
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
                const err = await uploadResponse.json();
                failed.push(`photo ${i + 1}: ${err.error}`);
              }
            } catch (err) {
              failed.push(`photo ${i + 1}`);
            }
          }
          setUploadingPhoto(null);
          if (failed.length) {
            setFormError(`Failed to upload ${failed.join('; ')}`);
            return;
          }
        }

        onSave();
      } else {
        setFormError('Failed to save culinary plan');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mx-auto max-w-3xl p-6">
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold tracking-tight text-fg">
        <ChefHat className="h-6 w-6 text-brand-500" />
        {plan ? 'Edit culinary plan' : 'Add new culinary plan'}
      </h2>

      {formError && (
        <Alert variant="error" className="mb-4">
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Place name" required htmlFor="cl-name">
          <Input
            id="cl-name"
            type="text"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="e.g. Sushi Paradise, Joe's Pizza"
            required
          />
        </Field>

        <Field label="Location" htmlFor="cl-loc">
          <Input
            id="cl-loc"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Address or area"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cuisine type" htmlFor="cl-cuisine">
            <Input
              id="cl-cuisine"
              type="text"
              value={cuisineType}
              onChange={(e) => setCuisineType(e.target.value)}
              placeholder="e.g. Japanese, Italian"
            />
          </Field>
          <Field label="Price range" htmlFor="cl-price">
            <Select
              id="cl-price"
              value={priceRange}
              onChange={(e) =>
                setPriceRange(e.target.value as CulinaryPlan['priceRange'])
              }
            >
              <option value="$">$ (Budget)</option>
              <option value="$$">$$ (Moderate)</option>
              <option value="$$$">$$$ (Expensive)</option>
              <option value="$$$$">$$$$ (Fine Dining)</option>
            </Select>
          </Field>
        </div>

        <Field label="Status" htmlFor="cl-status">
          <Select
            id="cl-status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as CulinaryPlan['status'])
            }
          >
            <option value="wishlist">Wishlist</option>
            <option value="planned">Planned</option>
            <option value="visited">Visited</option>
          </Select>
        </Field>

        {status === 'visited' && (
          <div className="space-y-4 rounded-xl border border-default bg-surface-2/60 p-4">
            <Field label="Visit date" htmlFor="cl-date">
              <Input
                id="cl-date"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </Field>

            <div>
              <p className="mb-3 text-sm font-medium text-fg">
                Rate your experience
              </p>
              <EmojiStarRating value={rating} onChange={setRating} size="md" />
            </div>
          </div>
        )}

        <Field label="Recommended menu / must-try dishes" htmlFor="cl-menu">
          <Textarea
            id="cl-menu"
            value={recommendedMenu}
            onChange={(e) => setRecommendedMenu(e.target.value)}
            rows={4}
            placeholder="One dish per line…"
          />
        </Field>

        <Field label="Notes" htmlFor="cl-notes">
          <Textarea
            id="cl-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Anything else worth remembering…"
          />
        </Field>

        {status === 'visited' && (
          <div>
            <p className="mb-3 text-sm font-medium text-fg">
              Photos{' '}
              <span className="font-normal text-muted">(max 3, optional)</span>
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((photoOrder) => {
                const selectedFile = uploadedPhotos[photoOrder - 1];

                return (
                  <div key={photoOrder} className="relative">
                    {selectedFile ? (
                      <div className="relative aspect-square overflow-hidden rounded-xl border border-default bg-surface-2">
                        <Image
                          src={URL.createObjectURL(selectedFile)}
                          alt={`Photo ${photoOrder}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 33vw"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photoOrder)}
                          className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
                          aria-label={`Remove photo ${photoOrder}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="aspect-square rounded-xl border-2 border-dashed border-default bg-surface-2/60 transition hover:border-brand-300">
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
                          onClick={() =>
                            fileInputRefs[photoOrder - 1].current?.click()
                          }
                          className="flex h-full w-full flex-col items-center justify-center gap-2 p-4"
                        >
                          <Upload className="h-7 w-7 text-muted" />
                          <span className="text-sm text-fg">
                            Photo {photoOrder}
                          </span>
                          <span className="text-xs text-muted">
                            Click to select
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            type="submit"
            size="lg"
            className="flex-1"
            loading={saving}
            disabled={saving}
          >
            {uploadingPhoto !== null
              ? `Uploading photo ${uploadingPhoto}…`
              : 'Save culinary plan'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
