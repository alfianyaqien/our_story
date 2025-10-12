'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plane, Plus, Edit2, Trash2 } from 'lucide-react';
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
      fetchPlans();
    }
  };

  const statusColors = {
    wishlist: 'bg-purple-100 text-purple-700',
    planning: 'bg-blue-100 text-blue-700',
    booked: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-love-ice via-white to-love-lavender dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <PageHeader title="Travel Planner" />
        </div>
        
        <div className="flex justify-end mb-4">
          <button
            onClick={() => { setShowForm(true); setEditingPlan(null); }}
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
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 card-hover">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{plan.destination}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPlan(plan)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[plan.status]}`}>
                    {plan.status}
                  </div>
                  
                  {plan.startDate && (
                    <p className="text-gray-600 dark:text-gray-400">
                      📅 {new Date(plan.startDate).toLocaleDateString()}
                      {plan.endDate && ` - ${new Date(plan.endDate).toLocaleDateString()}`}
                    </p>
                  )}
                  
                  {plan.budget && (
                    <p className="text-gray-600 dark:text-gray-400">💰 Budget: ${plan.budget}</p>
                  )}
                  
                  {plan.notes && (
                    <p className="text-gray-600 mt-2">{plan.notes}</p>
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
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{plan ? 'Edit' : 'New'} Travel Plan</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Destination *</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
            >
              <option value="wishlist">Wishlist</option>
              <option value="planning">Planning</option>
              <option value="booked">Booked</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none resize-none"
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

