'use client';

import { useEffect, useState } from 'react';
import {
  MapPin,
  Calendar,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Plane,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PageTitle } from '@/components/ui/PageTitle';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { Badge, EmptyState } from '@/components/ui/Feedback';
import { ConfirmModal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

interface TravelPlan {
  id: number;
  destination: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  notes: string;
  status: 'wishlist' | 'planning' | 'booked' | 'completed';
  createdAt: string;
}

const STATUS_VARIANT = {
  wishlist: 'default',
  planning: 'brand',
  booked: 'green',
  completed: 'gray',
} as const;

const FILTERS = ['all', 'wishlist', 'planning', 'booked', 'completed'] as const;

export default function TravelPage() {
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TravelPlan | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<TravelPlan | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const response = await fetch('/api/travel');
    if (response.ok) {
      const data = await response.json();
      setPlans(data.plans);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/travel?id=${id}`, { method: 'DELETE' });
    setSelectedPlan(null);
    setPendingDelete(null);
    fetchPlans();
  };

  const handleEdit = (plan: TravelPlan) => {
    setEditingPlan(plan);
    setSelectedPlan(null);
  };

  const filteredPlans =
    filterStatus === 'all'
      ? plans
      : plans.filter((plan) => plan.status === filterStatus);

  const formOpen = showForm || !!editingPlan;

  return (
    <AppShell>
      <PageTitle
        title="Travel Planner"
        description="Plan the next adventure together."
        action={
          !formOpen &&
          !selectedPlan && (
            <Button
              onClick={() => {
                setShowForm(true);
                setEditingPlan(null);
                setSelectedPlan(null);
              }}
            >
              <Plus className="h-4 w-4" />
              Add plan
            </Button>
          )
        }
      />

      {!formOpen && !selectedPlan && (
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'primary' : 'secondary'}
              size="sm"
              className="h-10 sm:h-8"
              onClick={() => {
                setFilterStatus(status);
                setSelectedPlan(null);
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      )}

      {formOpen ? (
        <TravelForm
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
        <TravelDetail
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onEdit={handleEdit}
          onDelete={(id) => setPendingDelete(id)}
        />
      ) : filteredPlans.length === 0 ? (
        <Card>
          <EmptyState
            icon={Plane}
            title="No plans here"
            description={
              filterStatus === 'all'
                ? 'Add the first destination on your list.'
                : `Nothing marked "${filterStatus}" yet.`
            }
            action={
              <Button onClick={() => setShowForm(true)}>Add plan</Button>
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
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
                <h3 className="truncate text-lg font-bold tracking-tight text-fg">
                  {plan.destination}
                </h3>
              </div>

              <div className="space-y-2 text-sm">
                <Badge variant={STATUS_VARIANT[plan.status]}>
                  {plan.status}
                </Badge>

                {plan.startDate && (
                  <p className="flex items-center gap-2 text-muted">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {new Date(plan.startDate).toLocaleDateString('id-ID')}
                      {plan.endDate &&
                        ` – ${new Date(plan.endDate).toLocaleDateString('id-ID')}`}
                    </span>
                  </p>
                )}

                {plan.budget != null && (
                  <p className="flex items-center gap-2 text-muted">
                    <DollarSign className="h-4 w-4 shrink-0" />
                    Rp {Number(plan.budget).toLocaleString('id-ID')}
                  </p>
                )}

                {plan.notes && (
                  <p className="line-clamp-2 break-words text-muted">
                    {plan.notes}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <ConfirmModal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete !== null && handleDelete(pendingDelete)}
        title="Delete this travel plan?"
        description="This cannot be undone."
        confirmText="Delete"
        danger
      />
    </AppShell>
  );
}

function TravelDetail({
  plan,
  onClose,
  onEdit,
  onDelete,
}: {
  plan: TravelPlan;
  onClose: () => void;
  onEdit: (plan: TravelPlan) => void;
  onDelete: (id: number) => void;
}) {
  const longDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <Card className="mx-auto max-w-2xl p-6 sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <MapPin className="h-7 w-7 shrink-0 text-brand-600 dark:text-brand-400" />
          <h2 className="break-words text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {plan.destination}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close detail"
        >
          ✕
        </Button>
      </div>

      <div className="space-y-4">
        <Badge variant={STATUS_VARIANT[plan.status]}>
          {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
        </Badge>

        {plan.startDate && (
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
            <div className="min-w-0">
              <p className="font-medium text-fg">Travel dates</p>
              <p className="text-sm text-muted">
                {longDate(plan.startDate)}
                {plan.endDate && ` – ${longDate(plan.endDate)}`}
              </p>
            </div>
          </div>
        )}

        {plan.budget != null && (
          <div className="flex items-start gap-3">
            <DollarSign className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
            <div>
              <p className="font-medium text-fg">Budget</p>
              <p className="text-sm text-muted">
                Rp {Number(plan.budget).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        )}

        {plan.notes && (
          <div className="rounded-xl border border-default bg-surface-2 p-4">
            <p className="mb-2 font-medium text-fg">Notes</p>
            <p className="whitespace-pre-wrap break-words text-sm text-muted">
              {plan.notes}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 border-t border-default pt-6">
          <Button className="flex-1" onClick={() => onEdit(plan)}>
            <Edit2 className="h-4 w-4" />
            Edit plan
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => onDelete(plan.id)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}

function TravelForm({
  plan,
  onSave,
  onCancel,
}: {
  plan: TravelPlan | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [destination, setDestination] = useState(plan?.destination || '');
  const [startDate, setStartDate] = useState(plan?.startDate || '');
  const [endDate, setEndDate] = useState(plan?.endDate || '');
  const [budget, setBudget] = useState(plan?.budget?.toString() || '');
  const [notes, setNotes] = useState(plan?.notes || '');
  const [status, setStatus] = useState(plan?.status || 'wishlist');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const method = plan ? 'PUT' : 'POST';
    const body = {
      id: plan?.id,
      destination,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      budget: budget ? parseFloat(budget) : undefined,
      notes,
      status,
    };

    try {
      await fetch('/api/travel', {
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
        {plan ? 'Edit' : 'New'} travel plan
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Destination" required htmlFor="tv-dest">
          <Input
            id="tv-dest"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Where to?"
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date" htmlFor="tv-start">
            <Input
              id="tv-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          <Field label="End date" htmlFor="tv-end">
            <Input
              id="tv-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Budget (Rp)" htmlFor="tv-budget">
            <Input
              id="tv-budget"
              type="number"
              step="10000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Status" htmlFor="tv-status">
            <Select
              id="tv-status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as TravelPlan['status'])
              }
            >
              <option value="wishlist">Wishlist</option>
              <option value="planning">Planning</option>
              <option value="booked">Booked</option>
              <option value="completed">Completed</option>
            </Select>
          </Field>
        </div>

        <Field label="Notes" htmlFor="tv-notes">
          <Textarea
            id="tv-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Additional details…"
          />
        </Field>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" size="lg" className="flex-1" loading={saving}>
            Save plan
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
