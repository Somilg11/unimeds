'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Building2, Plus, Search, Users, Copy, Check, ExternalLink, MoreHorizontal, Power } from 'lucide-react';
import { toast } from 'sonner';

interface Clinic {
  id: string;
  name: string;
  email?: string;
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activationLink, setActivationLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedClinicId, setCopiedClinicId] = useState<string | null>(null);
  const [togglingClinicId, setTogglingClinicId] = useState<string | null>(null);
  const itemsPerPage = 10;

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

  async function handleAddClinic(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setSubmitError(null);
      setActivationLink(null);
      const res = await apiClient.post('/admin/tenants/onboard', {
        name: clinicName,
        email: clinicEmail,
      });
      const data = res.data;
      if (data.activationLink) {
        setActivationLink(data.activationLink);
      }
      setClinicName('');
      setClinicEmail('');
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
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Clinics</h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          Clinics
        </h1>
        <Button onClick={() => { setShowAddForm(!showAddForm); setSubmitError(null); setActivationLink(null); }} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Clinic
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">
            Dismiss
          </button>
        </div>
      )}

      {showAddForm && (
        <Card className="bg-white border border-zinc-200 mb-6">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold text-zinc-900">
              Add New Clinic
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {submitError}
              </div>
            )}

            <form onSubmit={handleAddClinic} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-600">Clinic Name *</Label>
                  <Input
                    required
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="e.g. Downtown Medical Center"
                    className="bg-zinc-50 border border-zinc-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-600">Admin Email (Gmail) *</Label>
                  <Input
                    required
                    type="email"
                    value={clinicEmail}
                    onChange={(e) => setClinicEmail(e.target.value)}
                    placeholder="clinic.admin@gmail.com"
                    className="bg-zinc-50 border border-zinc-200"
                  />
                  <p className="text-[10px] text-zinc-400">
                    This Gmail account will be used to login via Google Sign-In
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" disabled={submitting} size="sm">
                  {submitting ? 'Creating...' : 'Create & Send Invitation'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowAddForm(false); setSubmitError(null); setActivationLink(null); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activationLink && (
        <Card className="bg-green-50 border border-green-200 mb-6">
          <CardContent className="p-4">
            <p className="text-sm text-green-700 font-medium mb-2">
              Clinic created! Share this activation link with the clinic admin:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-white rounded border border-green-200 text-xs text-zinc-900 break-all">
                {activationLink}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => handleCopyLink(activationLink)}
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-zinc-500" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-green-600 mt-2">
              The clinic admin must click this link to activate their account before they can login.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search clinics by name or email..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-10 bg-white border border-zinc-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as 'all' | 'active' | 'pending'); setCurrentPage(1); }}
          className="h-9 px-3 text-sm bg-white border border-zinc-200 rounded-md text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <Card className="bg-white border border-zinc-200">
        <CardContent className="p-0">
          {filteredClinics.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No clinics found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50">
                      <th className="text-left py-3 px-4 font-medium text-zinc-600">Clinic Name</th>
                      <th className="text-left py-3 px-4 font-medium text-zinc-600">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-zinc-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-zinc-600">Doctors</th>
                      <th className="text-left py-3 px-4 font-medium text-zinc-600">Created</th>
                      <th className="text-right py-3 px-4 font-medium text-zinc-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClinics.map((clinic) => (
                      <tr key={clinic.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-zinc-900 truncate max-w-[200px]">
                          {clinic.name}
                        </td>
                        <td className="py-3 px-4 text-zinc-600 truncate max-w-[200px]">
                          {clinic.email || <span className="text-zinc-400">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={clinic.isActive ? 'default' : 'secondary'}
                            className={`text-[10px] ${
                              clinic.isActive
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }`}
                          >
                            {clinic.isActive ? 'Active' : 'Pending'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-zinc-600">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-zinc-400" />
                            {clinic.doctorCount ?? 0}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-zinc-500 text-xs">
                          {clinic.createdAt ? new Date(clinic.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={togglingClinicId === clinic.id}
                              >
                                {togglingClinicId === clinic.id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
                                ) : (
                                  <MoreHorizontal className="w-4 h-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleToggleClinicStatus(clinic)}>
                                <Power className="w-4 h-4 mr-2" />
                                {clinic.isActive ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              {!clinic.isActive && clinic.activationToken && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const link = `${window.location.origin}/clinic/activate?token=${clinic.activationToken}`;
                                      handleCopyClinicLink(link, clinic.id);
                                    }}
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
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

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200">
                <p className="text-xs text-zinc-500">
                  Page {safeCurrentPage} of {totalPages} ({filteredClinics.length} total)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
