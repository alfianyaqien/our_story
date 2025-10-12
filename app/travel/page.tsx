'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plane, Plus, Edit2, Trash2, Calendar, DollarSign, MapPin } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

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

export default function TravelPage() {
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TravelPlan | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<TravelPlan | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

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
    if (confirm('Delete this travel plan?')) {
      await fetch(`/api/travel?id=${id}`, { method: 'DELETE' });
      setSelectedPlan(null);
      fetchPlans();
    }
  };

  const handleEdit = (plan: TravelPlan) => {
    setEditingPlan(plan);
    setSelectedPlan(null);
  };

  const filteredPlans = filterStatus === 'all' 
    ? plans 
    : plans.filter(plan => plan.status === filterStatus);

  const statusColors = {
    wishlist: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    planning: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    booked: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    completed: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-love-ice via-white to-love-lavender dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <PageHeader title="Travel Planner" />
        </div>
        
        {/* Filter Buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['all', 'wishlist', 'planning', 'booked', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setSelectedPlan(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === status
                  ? 'bg-cyan-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => { setShowForm(true); setEditingPlan(null); setSelectedPlan(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition shadow-md"
          >
            <Plus size={20} />
            Add Plan
          </button>
        </div>

        {showForm || editingPlan ? (
          <TravelForm
            plan={editingPlan}
            onSave={() => { setShowForm(false); setEditingPlan(null); fetchPlans(); }}
            onCancel={() => { setShowForm(false); setEditingPlan(null); }}
          />
        ) : selectedPlan ? (
          <TravelDetail 
            plan={selectedPlan} 
            onClose={() => setSelectedPlan(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <div 
                key={plan.id} 
                onClick={() => setSelectedPlan(plan)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 card-hover cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={20} className="text-cyan-600 dark:text-cyan-400" />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{plan.destination}</h3>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusColors[plan.status]}`}>
                    {plan.status}
                  </div>
                  
                  {plan.startDate && (
                    <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Calendar size={16} />
                      {new Date(plan.startDate).toLocaleDateString('id-ID')}
                      {plan.endDate && ` - ${new Date(plan.endDate).toLocaleDateString('id-ID')}`}
                    </p>
                  )}
                  
                  {plan.budget && (
                    <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <DollarSign size={16} />
                      Budget: Rp {Number(plan.budget).toLocaleString('id-ID')}
                    </p>
                  )}
                  
                  {plan.notes && (
                    <p className="text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{plan.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Detail View Component
function TravelDetail({ plan, onClose, onEdit, onDelete }: { 
  plan: TravelPlan; 
  onClose: () => void;
  onEdit: (plan: TravelPlan) => void;
  onDelete: (id: number) => void;
}) {
  const statusColors = {
    wishlist: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    planning: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    booked: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    completed: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-2xl mx-auto border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <MapPin size={28} className="text-cyan-600 dark:text-cyan-400" />
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{plan.destination}</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${statusColors[plan.status]}`}>
          {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
        </div>

        {plan.startDate && (
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Calendar size={20} className="text-cyan-600 dark:text-cyan-400" />
            <div>
              <p className="font-medium">Travel Dates</p>
              <p className="text-sm">
                {new Date(plan.startDate).toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                {plan.endDate && ` - ${new Date(plan.endDate).toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}`}
              </p>
            </div>
          </div>
        )}

        {plan.budget && (
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <DollarSign size={20} className="text-cyan-600 dark:text-cyan-400" />
            <div>
              <p className="font-medium">Budget</p>
              <p className="text-sm">Rp {Number(plan.budget).toLocaleString('id-ID')}</p>
            </div>
          </div>
        )}

        {plan.notes && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</p>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{plan.notes}</p>
          </div>
        )}

        <div className="flex gap-3 pt-6 border-t dark:border-gray-700">
          <button
            onClick={() => onEdit(plan)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-md"
          >
            <Edit2 size={18} />
            Edit Plan
          </button>
          <button
            onClick={() => onDelete(plan.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-md"
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function TravelForm({ plan, onSave, onCancel }: { plan: TravelPlan | null; onSave: () => void; onCancel: () => void }) {
  const [destination, setDestination] = useState(plan?.destination || '');
  const [startDate, setStartDate] = useState(plan?.startDate || '');
  const [endDate, setEndDate] = useState(plan?.endDate || '');
  const [budget, setBudget] = useState(plan?.budget?.toString() || '');
  const [notes, setNotes] = useState(plan?.notes || '');
  const [status, setStatus] = useState(plan?.status || 'wishlist');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    await fetch('/api/travel', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-2xl mx-auto border border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{plan ? 'Edit' : 'New'} Travel Plan</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Destination *</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Budget (Rp)</label>
            <input
              type="number"
              step="10000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
            >
              <option value="wishlist">Wishlist</option>
              <option value="planning">Planning</option>
              <option value="booked">Booked</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none resize-none transition"
            placeholder="Additional details..."
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-cyan-500 text-white font-semibold py-3 rounded-lg hover:bg-cyan-600 transition"
          >
            Save Plan
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

