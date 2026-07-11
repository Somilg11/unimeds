'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Building2, Plus, Search, Users, Copy, Check, MoreHorizontal, Power, ChevronLeft, ChevronRight, Navigation } from 'lucide-react';
import { toast } from 'sonner';

interface Clinic {
  id: string;
  name: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  doctorCount?: number;
  activationToken?: string;
}

export default function AdminClinics() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicCity, setClinicCity] = useState('');
  const [clinicState, setClinicState] = useState('');
  const [clinicZipCode, setClinicZipCode] = useState('');
  const [clinicLatitude, setClinicLatitude] = useState('');
  const [clinicLongitude, setClinicLongitude] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activationLink, setActivationLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedClinicId, setCopiedClinicId] = useState<string | null>(null);
  const [togglingClinicId, setTogglingClinicId] = useState<string | null>(null);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchClinics();
  }, []);

  async function fetchClinics() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/admin/clinics');
      const raw = res.data;
      const clinicsList = raw?.clinics || raw?.data?.clinics || raw?.data || raw || [];
      setClinics(Array.isArray(clinicsList) ? clinicsList : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch clinics';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setClinicLatitude(String(position.coords.latitude));
        setClinicLongitude(String(position.coords.longitude));
        toast.success('Current location set');
      },
      (err) => {
        toast.error(`Failed to get location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleAddClinic(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setSubmitError(null);
      setActivationLink(null);
      const res = await apiClient.post('/admin/tenants/onboard', {
        name: clinicName,
        email: clinicEmail,
        address: clinicAddress || undefined,
        city: clinicCity || undefined,
        state: clinicState || undefined,
        zipCode: clinicZipCode || undefined,
        latitude: clinicLatitude ? Number(clinicLatitude) : undefined,
        longitude: clinicLongitude ? Number(clinicLongitude) : undefined,
      });
      const data = res.data;
      if (data.activationLink) {
        setActivationLink(data.activationLink);
      }
      setClinicName('');
      setClinicEmail('');
      setClinicAddress('');
      setClinicCity('');
      setClinicState('');
      setClinicZipCode('');
      setClinicLatitude('');
      setClinicLongitude('');
      setShowAddForm(false);
      fetchClinics();
      toast.success('Clinic created successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create clinic';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleClinicStatus(clinic: Clinic) {
    try {
      setTogglingClinicId(clinic.id);
      await apiClient.put(`/admin/clinics/${clinic.id}/toggle-status`);
      setClinics((prev) =>
        prev.map((c) =>
          c.id === clinic.id ? { ...c, isActive: !c.isActive } : c
        )
      );
      toast.success(`Clinic ${clinic.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to toggle clinic status';
      toast.error(message);
    } finally {
      setTogglingClinicId(null);
    }
  }

  function handleCopyLink(link: string) {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success('Activation link copied to clipboard');
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handleCopyClinicLink(link: string, clinicId: string) {
    navigator.clipboard.writeText(link);
    setCopiedClinicId(clinicId);
    toast.success('Activation link copied to clipboard');
    setTimeout(() => setCopiedClinicId(null), 2000);
  }

  const filteredClinics = clinics.filter((clinic) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      clinic.name?.toLowerCase().includes(query) ||
      clinic.email?.toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && clinic.isActive) ||
      (statusFilter === 'pending' && !clinic.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredClinics.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedClinics = filteredClinics.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="p-4 lg:p-10">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-6">Clinics</h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2">
            Admin Portal
          </p>
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-gray-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Clinics</h1>
          </div>
        </div>
        <Button 
          onClick={() => { setShowAddForm(!showAddForm); setSubmitError(null); setActivationLink(null); }}
          className="rounded-xl bg-[#36565F] hover:bg-[#36565F]/90 text-white shadow-sm h-10 px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Clinic
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">
            Dismiss
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-6 animate-subtle">
          <p className="text-sm font-semibold text-gray-900 mb-4">Add New Clinic</p>
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-600 rounded-xl">
              {submitError}
            </div>
          )}

          <form onSubmit={handleAddClinic} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase text-gray-500">Clinic Name *</Label>
                <Input
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="e.g. Downtown Medical Center"
                  className="bg-gray-50 border-gray-200 rounded-xl h-10 px-4 focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase text-gray-500">Admin Email (Gmail) *</Label>
                <Input
                  required
                  type="email"
                  value={clinicEmail}
                  onChange={(e) => setClinicEmail(e.target.value)}
                  placeholder="clinic.admin@gmail.com"
                  className="bg-gray-50 border-gray-200 rounded-xl h-10 px-4 focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  This Gmail account will be used to login via Google Sign-In
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-[10px] uppercase text-gray-500">Address</Label>
              <Input
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                placeholder="Street address"
                className="bg-gray-50 border-gray-200 rounded-xl h-10 px-4 focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase text-gray-500">City</Label>
                <Input
                  value={clinicCity}
                  onChange={(e) => setClinicCity(e.target.value)}
                  placeholder="City"
                  className="bg-gray-50 border-gray-200 rounded-xl h-10 px-4 focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase text-gray-500">State</Label>
                <Input
                  value={clinicState}
                  onChange={(e) => setClinicState(e.target.value)}
                  placeholder="State"
                  className="bg-gray-50 border-gray-200 rounded-xl h-10 px-4 focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase text-gray-500">Zip Code</Label>
                <Input
                  value={clinicZipCode}
                  onChange={(e) => setClinicZipCode(e.target.value)}
                  placeholder="Zip"
                  className="bg-gray-50 border-gray-200 rounded-xl h-10 px-4 focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase text-gray-500">Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={clinicLatitude}
                  onChange={(e) => setClinicLatitude(e.target.value)}
                  placeholder="e.g. 40.7128"
                  className="bg-gray-50 border-gray-200 rounded-xl h-10 px-4 focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase text-gray-500">Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={clinicLongitude}
                  onChange={(e) => setClinicLongitude(e.target.value)}
                  placeholder="e.g. -74.0060"
                  className="bg-gray-50 border-gray-200 rounded-xl h-10 px-4 focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseCurrentLocation}
              className="border-dashed rounded-xl h-9 px-4 shadow-sm text-xs font-medium border-gray-200 hover:bg-gray-50"
            >
              <Navigation className="w-3.5 h-3.5 mr-2 text-gray-500" />
              Use Current Location
            </Button>
            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" disabled={submitting} className="rounded-xl bg-[#36565F] hover:bg-[#36565F]/90 text-white shadow-sm h-10 px-4">
                {submitting ? 'Creating...' : 'Create & Send Invitation'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl h-10 px-4"
                onClick={() => { setShowAddForm(false); setSubmitError(null); setActivationLink(null); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {activationLink && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-2xl mb-6">
          <p className="text-sm text-green-700 font-medium mb-2">
            Clinic created! Share this activation link with the clinic admin:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white border border-green-200 text-xs text-gray-900 rounded-xl break-all font-mono">
              {activationLink}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg"
              onClick={() => handleCopyLink(activationLink)}
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-green-600 mt-2">
            The clinic admin must click this link to activate their account before they can login.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search clinics..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-10 h-10 bg-white/50 border-gray-200 rounded-xl focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all shadow-sm"
          />
        </div>
        <div className="flex p-1 bg-gray-100/80 rounded-xl border border-gray-100 self-start">
          {(['all', 'active', 'pending'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => { setStatusFilter(filter); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-[13px] font-medium capitalize rounded-lg transition-all ${
                statusFilter === filter
                  ? 'bg-white text-[#36565F] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {filteredClinics.length === 0 ? (
          <div className="text-center py-16 border-b border-gray-100 bg-gray-50/50 m-4 rounded-3xl border-dashed">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-[15px] font-semibold text-gray-900 mb-1">No clinics found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Clinic Name</th>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Location</th>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Doctors</th>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Created</th>
                    <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/80">
                  {paginatedClinics.map((clinic) => (
                    <tr key={clinic.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-gray-900 text-[14px]">
                        <div className="truncate max-w-[150px] sm:max-w-[200px]">{clinic.name}</div>
                        <div className="text-[12px] font-normal text-gray-500 sm:hidden mt-0.5 truncate max-w-[150px]">{clinic.email || '—'}</div>
                      </td>
                      <td className="px-5 py-4 text-gray-600 text-[13px] truncate max-w-[200px] hidden sm:table-cell">
                        {clinic.email || <span className="text-gray-400 italic">—</span>}
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-[13px] hidden lg:table-cell">
                        {clinic.address || clinic.city ? (
                          <div className="truncate max-w-[180px]">
                            {clinic.address}{clinic.city ? `, ${clinic.city}` : ''}{clinic.state ? `, ${clinic.state}` : ''}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={clinic.isActive ? 'default' : 'secondary'}
                          className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
                            clinic.isActive
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}
                        >
                          {clinic.isActive ? 'Active' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-gray-600 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          {clinic.doctorCount ?? 0}
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-gray-500 text-xs hidden lg:table-cell">
                        {clinic.createdAt ? new Date(clinic.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-gray-100 transition-colors"
                              disabled={togglingClinicId === clinic.id}
                            >
                              {togglingClinicId === clinic.id ? (
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                              ) : (
                                <MoreHorizontal className="w-4 h-4 text-gray-500" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-gray-100 min-w-[160px] p-1.5">
                            <DropdownMenuItem
                              onClick={() => handleToggleClinicStatus(clinic)}
                              className={`rounded-lg cursor-pointer text-[13px] ${clinic.isActive ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}
                            >
                              <Power className="w-4 h-4 mr-2" />
                              {clinic.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            {!clinic.isActive && clinic.activationToken && (
                              <>
                                <DropdownMenuSeparator className="my-1 border-gray-100" />
                                <DropdownMenuItem
                                  onClick={() => {
                                    const link = `${window.location.origin}/clinic/activate?token=${clinic.activationToken}`;
                                    handleCopyClinicLink(link, clinic.id);
                                  }}
                                  className="rounded-lg cursor-pointer text-[13px] text-gray-700 hover:bg-gray-50"
                                >
                                  <Copy className="w-4 h-4 mr-2 text-gray-400" />
                                  Copy Activation Link
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100/80 bg-gray-50/30 gap-4">
              <p className="text-[13px] text-gray-500 font-medium">
                Page {safeCurrentPage} of {totalPages} <span className="text-gray-400">({filteredClinics.length} total)</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 rounded-xl text-[13px] font-medium border-gray-200 hover:bg-white shadow-sm"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4 mr-1.5" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 rounded-xl text-[13px] font-medium border-gray-200 hover:bg-white shadow-sm"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
