'use client';

import { useEffect, useState } from 'react';
import { Gift, Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PageTitle } from '@/components/ui/PageTitle';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { Badge, EmptyState } from '@/components/ui/Feedback';
import { ConfirmModal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

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

const PRIORITY_VARIANT = {
  low: 'gray',
  medium: 'amber',
  high: 'default',
} as const;

const STATUS_VARIANT = {
  wished: 'default',
  planned: 'brand',
  purchased: 'green',
} as const;

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

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
    await fetch(`/api/wishlist?id=${id}`, { method: 'DELETE' });
    setPendingDelete(null);
    fetchItems();
  };

  const updateStatus = async (item: WishlistItem, newStatus: string) => {
    await fetch('/api/wishlist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, status: newStatus }),
    });
    fetchItems();
  };

  const formOpen = showForm || !!editingItem;

  return (
    <AppShell>
      <PageTitle
        title="Wishlists"
        description="Dream together, one item at a time."
        action={
          !formOpen && (
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingItem(null);
              }}
            >
              <Plus className="h-4 w-4" />
              Add wish
            </Button>
          )
        }
      />

      {formOpen ? (
        <WishlistForm
          item={editingItem}
          onSave={() => {
            setShowForm(false);
            setEditingItem(null);
            fetchItems();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={Gift}
            title="No wishes yet"
            description="Add the first thing you're hoping for."
            action={<Button onClick={() => setShowForm(true)}>Add wish</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} hover className="flex flex-col p-6">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-bold tracking-tight text-fg">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted">by {item.userName}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditingItem(item)}
                    aria-label="Edit item"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPendingDelete(item.id)}
                    aria-label="Delete item"
                    className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {item.description && (
                <p className="mb-3 break-words text-sm text-muted">
                  {item.description}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={PRIORITY_VARIANT[item.priority]}
                    className={cn(
                      item.priority === 'high' &&
                        'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    )}
                  >
                    {item.priority} priority
                  </Badge>
                  <Badge variant={STATUS_VARIANT[item.status]}>
                    {item.status}
                  </Badge>
                </div>

                {item.category && (
                  <p className="text-sm text-muted">{item.category}</p>
                )}

                {item.price != null && (
                  <p className="text-sm font-semibold text-fg">
                    Rp {Number(item.price).toLocaleString('id-ID')}
                  </p>
                )}

                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View link
                  </a>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-default pt-4">
                {item.status !== 'wished' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => updateStatus(item, 'wished')}
                  >
                    Wish
                  </Button>
                )}
                {item.status !== 'planned' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => updateStatus(item, 'planned')}
                  >
                    Plan
                  </Button>
                )}
                {item.status !== 'purchased' && (
                  <Button
                    variant="subtle"
                    size="sm"
                    className="flex-1"
                    onClick={() => updateStatus(item, 'purchased')}
                  >
                    Purchased
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete !== null && handleDelete(pendingDelete)}
        title="Delete this item?"
        description="This cannot be undone."
        confirmText="Delete"
        danger
      />
    </AppShell>
  );
}

function WishlistForm({
  item,
  onSave,
  onCancel,
}: {
  item: WishlistItem | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [category, setCategory] = useState(item?.category || '');
  const [priority, setPriority] = useState(item?.priority || 'medium');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [link, setLink] = useState(item?.link || '');
  const [status, setStatus] = useState(item?.status || 'wished');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

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

    try {
      await fetch('/api/wishlist', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mx-auto max-w-2xl p-6">
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-fg">
        {item ? 'Edit' : 'New'} wishlist item
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Title" required htmlFor="wl-title">
          <Input
            id="wl-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you wish for?"
            required
          />
        </Field>

        <Field label="Description" htmlFor="wl-desc">
          <Textarea
            id="wl-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Additional details…"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="wl-cat">
            <Input
              id="wl-cat"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Books, Gadgets"
            />
          </Field>
          <Field label="Price (Rp)" htmlFor="wl-price">
            <Input
              id="wl-price"
              type="number"
              step="1000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Priority" htmlFor="wl-priority">
            <Select
              id="wl-priority"
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as WishlistItem['priority'])
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </Field>
          <Field label="Status" htmlFor="wl-status">
            <Select
              id="wl-status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as WishlistItem['status'])
              }
            >
              <option value="wished">Wished</option>
              <option value="planned">Planned</option>
              <option value="purchased">Purchased</option>
            </Select>
          </Field>
        </div>

        <Field label="Link" htmlFor="wl-link">
          <Input
            id="wl-link"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://…"
          />
        </Field>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" size="lg" className="flex-1" loading={saving}>
            Save item
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
