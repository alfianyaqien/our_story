'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gift, Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

interface WishlistItem {
  id: number;
  userId: number;
  userName: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  price?: number;
  link?: string;
  status: 'wished' | 'planned' | 'purchased';
  createdAt: string;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const response = await fetch('/api/wishlist');
    if (response.ok) {
      const data = await response.json();
      setItems(data.items);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this item?')) {
      await fetch(`/api/wishlist?id=${id}`, { method: 'DELETE' });
      fetchItems();
    }
  };

  const updateStatus = async (item: WishlistItem, newStatus: string) => {
    await fetch('/api/wishlist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, status: newStatus }),
    });
    fetchItems();
  };

  const priorityColors = {
    low: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  };

  const statusColors = {
    wished: 'bg-purple-100 text-purple-700',
    planned: 'bg-blue-100 text-blue-700',
    purchased: 'bg-green-100 text-green-700',
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-love-ice via-white to-love-lavender dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <PageHeader title="Wishlists" />
        </div>
        
        <div className="flex justify-end mb-4">
          <button
            onClick={() => { setShowForm(true); setEditingItem(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-md"
          >
            <Plus size={20} />
            Add Wish
          </button>
        </div>

        {showForm || editingItem ? (
          <WishlistForm
            item={editingItem}
            onSave={() => { setShowForm(false); setEditingItem(null); fetchItems(); }}
            onCancel={() => { setShowForm(false); setEditingItem(null); }}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 card-hover">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">by {item.userName}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {item.description && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{item.description}</p>
                )}

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[item.priority]}`}>
                      {item.priority} priority
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                      {item.status}
                    </span>
                  </div>

                  {item.category && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">📁 {item.category}</p>
                  )}

                  {item.price && (
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">💰 Rp {Number(item.price).toLocaleString('id-ID')}</p>
                  )}

                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
                    >
                      <ExternalLink size={14} />
                      View Link
                    </a>
                  )}

                  <div className="pt-3 border-t dark:border-gray-700 flex gap-2 text-xs">
                    {item.status !== 'wished' && (
                      <button
                        onClick={() => updateStatus(item, 'wished')}
                        className="flex-1 py-1 px-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded hover:bg-purple-100 dark:hover:bg-purple-900/50 transition"
                      >
                        Wish
                      </button>
                    )}
                    {item.status !== 'planned' && (
                      <button
                        onClick={() => updateStatus(item, 'planned')}
                        className="flex-1 py-1 px-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                      >
                        Plan
                      </button>
                    )}
                    {item.status !== 'purchased' && (
                      <button
                        onClick={() => updateStatus(item, 'purchased')}
                        className="flex-1 py-1 px-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/50 transition"
                      >
                        ✓ Purchased
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WishlistForm({ item, onSave, onCancel }: { item: WishlistItem | null; onSave: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [category, setCategory] = useState(item?.category || '');
  const [priority, setPriority] = useState(item?.priority || 'medium');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [link, setLink] = useState(item?.link || '');
  const [status, setStatus] = useState(item?.status || 'wished');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const method = item ? 'PUT' : 'POST';
    const body = {
      id: item?.id,
      title,
      description,
      category,
      priority,
      price: price ? parseFloat(price) : undefined,
      link,
      status,
    };

    await fetch('/api/wishlist', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-2xl mx-auto border border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{item ? 'Edit' : 'New'} Wishlist Item</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
            placeholder="What do you wish for?"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none transition"
            placeholder="Additional details..."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
              placeholder="e.g., Books, Gadgets"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price (Rp)</label>
            <input
              type="number"
              step="1000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
            >
              <option value="wished">Wished</option>
              <option value="planned">Planned</option>
              <option value="purchased">Purchased</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Link</label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
            placeholder="https://..."
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-red-500 text-white font-semibold py-3 rounded-lg hover:bg-red-600 transition"
          >
            Save Item
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

