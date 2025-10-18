'use client';

import { useState, useEffect } from 'react';
import { FolderPlus, Edit2, Trash2, X, Save, FolderOpen } from 'lucide-react';

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

interface AlbumManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onAlbumCreated?: () => void;
  onAlbumUpdated?: () => void;
  onAlbumDeleted?: () => void;
}

export default function AlbumManager({ 
  isOpen, 
  onClose, 
  onAlbumCreated, 
  onAlbumUpdated,
  onAlbumDeleted 
}: AlbumManagerProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAlbums();
    }
  }, [isOpen]);

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

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Album name is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ name: '', description: '' });
        setIsCreating(false);
        fetchAlbums();
        onAlbumCreated?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create album');
      }
    } catch (error) {
      console.error('Error creating album:', error);
      alert('Failed to create album');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingAlbum || !formData.name.trim()) {
      alert('Album name is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/albums', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAlbum.id,
          name: formData.name,
          description: formData.description,
        }),
      });

      if (response.ok) {
        setFormData({ name: '', description: '' });
        setEditingAlbum(null);
        fetchAlbums();
        onAlbumUpdated?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update album');
      }
    } catch (error) {
      console.error('Error updating album:', error);
      alert('Failed to update album');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (albumId: number, albumName: string) => {
    if (albumName === 'General') {
      alert('Cannot delete the General album');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${albumName}"? Photos will be moved to General album.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/albums?id=${albumId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAlbums();
        onAlbumDeleted?.();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete album');
      }
    } catch (error) {
      console.error('Error deleting album:', error);
      alert('Failed to delete album');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (album: Album) => {
    setEditingAlbum(album);
    setFormData({
      name: album.name,
      description: album.description || '',
    });
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingAlbum(null);
    setIsCreating(false);
    setFormData({ name: '', description: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Albums</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create/Edit Form */}
          {(isCreating || editingAlbum) && (
            <div className="mb-6 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border-2 border-teal-200 dark:border-teal-800">
              <h3 className="text-lg font-semibold mb-4 text-teal-900 dark:text-teal-100">
                {editingAlbum ? 'Edit Album' : 'Create New Album'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Album Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Summer Vacation 2024"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 dark:text-white"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description for this album..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 dark:text-white resize-none"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={editingAlbum ? handleUpdate : handleCreate}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isLoading ? 'Saving...' : (editingAlbum ? 'Update' : 'Create')}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Button */}
          {!isCreating && !editingAlbum && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full mb-6 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FolderPlus className="w-5 h-5" />
              Create New Album
            </button>
          )}

          {/* Albums List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Your Albums ({albums.length})
            </h3>
            {albums.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No albums yet. Create your first album!
              </div>
            ) : (
              albums.map((album) => (
                <div
                  key={album.id}
                  className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {album.name}
                        </h4>
                        <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-medium rounded-full">
                          {album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'}
                        </span>
                      </div>
                      {album.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {album.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Created {new Date(album.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(album)}
                        disabled={isLoading}
                        className="p-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg transition-colors disabled:opacity-50"
                        title="Edit album"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {album.name !== 'General' && (
                        <button
                          onClick={() => handleDelete(album.id, album.name)}
                          disabled={isLoading}
                          className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete album"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
