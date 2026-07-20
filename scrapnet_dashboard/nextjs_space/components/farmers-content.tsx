'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, CheckCircle2, XCircle, MapPin, Mail, Phone, Trash2, Edit2 } from 'lucide-react';
import { cn, formatNumber, formatDate } from '@/lib/utils';
import { FarmerData } from '@/lib/types';

interface FarmerWithCounts extends FarmerData {
  _count?: {
    biocharBatches: number;
    credits: number;
  };
}

export default function FarmersContent() {
  const [farmers, setFarmers] = useState<FarmerWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<FarmerWithCounts | null>(null);
  const [filterVerified, setFilterVerified] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    farmName: '',
    farmLocation: '',
    gpsCoordinates: '',
  });

  const fetchFarmers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterVerified) params.set('verified', filterVerified);
      const res = await fetch(`/api/farmers?${params}`);
      const data = await res.json();
      setFarmers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching farmers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, [filterVerified]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFarmer) {
        await fetch(`/api/farmers/${editingFarmer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch('/api/farmers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setShowAddModal(false);
      setEditingFarmer(null);
      setFormData({ name: '', email: '', phone: '', farmName: '', farmLocation: '', gpsCoordinates: '' });
      fetchFarmers();
    } catch (error) {
      console.error('Error saving farmer:', error);
    }
  };

  const handleVerify = async (id: string, isVerified: boolean) => {
    try {
      await fetch(`/api/farmers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified }),
      });
      fetchFarmers();
    } catch (error) {
      console.error('Error updating verification:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this farmer?')) return;
    try {
      await fetch(`/api/farmers/${id}`, { method: 'DELETE' });
      fetchFarmers();
    } catch (error) {
      console.error('Error deleting farmer:', error);
    }
  };

  const openEditModal = (farmer: FarmerWithCounts) => {
    setEditingFarmer(farmer);
    setFormData({
      name: farmer.name,
      email: farmer.email || '',
      phone: farmer.phone || '',
      farmName: farmer.farmName || '',
      farmLocation: farmer.farmLocation || '',
      gpsCoordinates: farmer.gpsCoordinates || '',
    });
    setShowAddModal(true);
  };

  const totalCredits = farmers.reduce((sum, f) => sum + f.totalCreditsEarned, 0);
  const verifiedCount = farmers.filter((f) => f.isVerified).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Total Farmers</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{farmers.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Verified</p>
          <p className="text-2xl font-bold text-emerald-600">{verifiedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Pending Verification</p>
          <p className="text-2xl font-bold text-amber-600">{farmers.length - verifiedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Total Credits Earned</p>
          <p className="text-2xl font-bold text-amber-600">{formatNumber(totalCredits, 2)} t</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <select
          value={filterVerified}
          onChange={(e) => setFilterVerified(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">All Farmers</option>
          <option value="true">Verified Only</option>
          <option value="false">Pending Verification</option>
        </select>
        <button
          onClick={() => {
            setEditingFarmer(null);
            setFormData({ name: '', email: '', phone: '', farmName: '', farmLocation: '', gpsCoordinates: '' });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
        >
          <Plus className="h-4 w-4" />
          Add Farmer
        </button>
      </div>

      {/* Farmers Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : farmers.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-slate-500">
          <Users className="h-12 w-12 mb-2 opacity-50" />
          <p>No farmers registered yet</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {farmers.map((farmer) => (
            <div
              key={farmer.id}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{farmer.name}</h3>
                  {farmer.farmName && (
                    <p className="text-sm text-slate-500">{farmer.farmName}</p>
                  )}
                </div>
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                  farmer.isVerified
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                )}>
                  {farmer.isVerified ? (
                    <><CheckCircle2 className="h-3 w-3" /> Verified</>
                  ) : (
                    <><XCircle className="h-3 w-3" /> Pending</>
                  )}
                </span>
              </div>

              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                {farmer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {farmer.email}
                  </div>
                )}
                {farmer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {farmer.phone}
                  </div>
                )}
                {farmer.farmLocation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {farmer.farmLocation}
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-500">Feedstock Supplied</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatNumber(farmer.totalFeedstockKg, 0)} kg
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Credits Earned</p>
                  <p className="font-semibold text-amber-600">
                    {formatNumber(farmer.totalCreditsEarned, 4)} t
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(farmer)}
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(farmer.id)}
                    className="rounded p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {!farmer.isVerified && (
                  <button
                    onClick={() => handleVerify(farmer.id, true)}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
                  >
                    Verify Farmer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {editingFarmer ? 'Edit Farmer' : 'Add New Farmer'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Farm Name
                </label>
                <input
                  type="text"
                  value={formData.farmName}
                  onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Farm Location
                </label>
                <input
                  type="text"
                  value={formData.farmLocation}
                  onChange={(e) => setFormData({ ...formData, farmLocation: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  GPS Coordinates
                </label>
                <input
                  type="text"
                  value={formData.gpsCoordinates}
                  onChange={(e) => setFormData({ ...formData, gpsCoordinates: e.target.value })}
                  placeholder="e.g., 34.0522,-118.2437"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingFarmer(null);
                  }}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600"
                >
                  {editingFarmer ? 'Update' : 'Add Farmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
