'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus,
  Users,
  Trash2,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface Doctor {
  doctorId: string;
  name: string;
  email: string;
  phone?: string;
  specialization: string;
  licenseNumber: string;
  isActive: boolean;
  createdAt: string;
  authId?: string;
}

interface NewDoctorForm {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
}

const emptyForm: NewDoctorForm = {
  name: '',
  email: '',
  phone: '',
  specialization: '',
  licenseNumber: '',
};

const PAGE_SIZE = 15;

export default function ClinicAdminStaff() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<NewDoctorForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdAuthId, setCreatedAuthId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [visibleAuthIds, setVisibleAuthIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDoctors();
  }, []);

  async function fetchDoctors() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/clinic-admin/staff');
      const raw = res.data;
      const staffList = raw?.staff || raw?.data?.staff || raw?.data || raw || [];
      setDoctors(Array.isArray(staffList) ? staffList : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch staff';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDoctor(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setSubmitError(null);
      const res = await apiClient.post('/clinic-admin/staff', formData);
      const raw = res.data;
      const data = raw?.doctor || raw?.data?.doctor || raw?.data || raw || {};
      if (data.authId) {
        setCreatedAuthId(data.authId);
      }
      setFormData(emptyForm);
      fetchDoctors();
      toast.success('Doctor added to clinic');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add doctor';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(doctorId: string, isActive: boolean) {
    try {
      setTogglingId(doctorId);
      await apiClient.put('/clinic-admin/staff/toggle', {
        doctorId,
        isActive: !isActive,
      });
      setDoctors((prev) =>
        prev.map((d) =>
          d.doctorId === doctorId ? { ...d, isActive: !isActive } : d
        )
      );
      toast.success(`Doctor ${isActive ? 'deactivated' : 'activated'}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to toggle status';
      setError(message);
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(doctorId: string) {
    if (!confirm('Are you sure you want to remove this doctor?')) return;
    try {
      setDeletingId(doctorId);
      await apiClient.delete('/clinic-admin/staff', { data: { doctorId } });
      setDoctors((prev) => prev.filter((d) => d.doctorId !== doctorId));
      toast.success('Doctor removed from clinic');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove doctor';
      setError(message);
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  }

  function handleCopyAuthId(authId: string) {
    navigator.clipboard.writeText(authId);
    setCopiedId(true);
    toast.success('Auth ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  }

  const filteredDoctors = doctors.filter((doctor) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      doctor.name?.toLowerCase().includes(query) ||
      doctor.email?.toLowerCase().includes(query) ||
      doctor.specialization?.toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && doctor.isActive) ||
      (statusFilter === 'inactive' && !doctor.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedDoctors = filteredDoctors.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  if (loading) {
    return (
      <div>
        <h1 className="text-lg font-bold text-gray-900 mb-6">Staff Management</h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">Staff Management</h1>
        <Button onClick={() => { setShowAddForm(!showAddForm); setCreatedAuthId(null); }} size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-400 hover:text-red-600"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add Doctor Form */}
      {showAddForm && (
        <div className="border border-gray-200 mb-6">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Add New Doctor</h2>
          </div>
          <div className="p-4">
            {createdAuthId && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200">
                <p className="text-sm text-green-700 font-medium mb-2">
                  Doctor created successfully!
                </p>
                <p className="text-xs text-green-600 mb-2">
                  Auth ID (share with the doctor for login):
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-2 py-1 bg-white border border-green-200 text-sm text-gray-900 break-all">
                    {createdAuthId}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleCopyAuthId(createdAuthId)}
                  >
                    {copiedId ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-600">
                {submitError}
              </div>
            )}

            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Name *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Dr. Name"
                    className="bg-gray-50 border border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Email *</Label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="doctor@example.com"
                    className="bg-gray-50 border border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 234 567 890"
                    className="bg-gray-50 border border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Specialization *</Label>
                  <Input
                    required
                    value={formData.specialization}
                    onChange={(e) => setFormData((prev) => ({ ...prev, specialization: e.target.value }))}
                    placeholder="e.g. General Practice"
                    className="bg-gray-50 border border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">License Number *</Label>
                  <Input
                    required
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                    placeholder="License #"
                    className="bg-gray-50 border border-gray-200"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" disabled={submitting} size="sm">
                  {submitting ? 'Adding...' : 'Add Doctor'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowAddForm(false); setCreatedAuthId(null); setSubmitError(null); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or specialization..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-10 bg-white border border-gray-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-[160px] bg-white border border-gray-200">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-[11px] font-mono uppercase text-gray-400 tracking-wider">Doctor Name</th>
                <th className="px-4 py-3 text-left text-[11px] font-mono uppercase text-gray-400 tracking-wider hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-left text-[11px] font-mono uppercase text-gray-400 tracking-wider hidden md:table-cell">Specialization</th>
                <th className="px-4 py-3 text-left text-[11px] font-mono uppercase text-gray-400 tracking-wider hidden lg:table-cell">License #</th>
                <th className="px-4 py-3 text-left text-[11px] font-mono uppercase text-gray-400 tracking-wider hidden xl:table-cell">Auth ID</th>
                <th className="px-4 py-3 text-left text-[11px] font-mono uppercase text-gray-400 tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-mono uppercase text-gray-400 tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDoctors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No doctors found</p>
                  </td>
                </tr>
              ) : (
                paginatedDoctors.map((doctor) => (
                  <tr key={doctor.doctorId} className="hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                    <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{doctor.name}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap hidden sm:table-cell">{doctor.email}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap hidden md:table-cell">{doctor.specialization}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap hidden lg:table-cell">{doctor.licenseNumber}</td>
                    <td className="px-4 py-3 whitespace-nowrap hidden xl:table-cell">
                      {doctor.authId ? (
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs bg-gray-50 px-2 py-0.5 border border-gray-100 max-w-[120px] truncate">
                            {visibleAuthIds.has(doctor.doctorId) ? doctor.authId : '••••••••'}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              setVisibleAuthIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(doctor.doctorId)) next.delete(doctor.doctorId);
                                else next.add(doctor.doctorId);
                                return next;
                              });
                            }}
                            className="shrink-0 text-gray-400 hover:text-gray-600"
                            title={visibleAuthIds.has(doctor.doctorId) ? 'Hide' : 'Reveal'}
                          >
                            {visibleAuthIds.has(doctor.doctorId) ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyAuthId(doctor.authId!)}
                            className="shrink-0 text-gray-400 hover:text-gray-600"
                            title="Copy"
                          >
                            {copiedId ? (
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant={doctor.isActive ? 'default' : 'secondary'}
                        className={`text-[10px] ${
                          doctor.isActive
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        {doctor.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={togglingId === doctor.doctorId}
                          onClick={() => handleToggle(doctor.doctorId, doctor.isActive)}
                        >
                          {doctor.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deletingId === doctor.doctorId}
                          onClick={() => handleDelete(doctor.doctorId)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          {deletingId === doctor.doctorId ? '...' : 'Remove'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredDoctors.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">
            Page {safePage} of {totalPages} ({filteredDoctors.length} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3 h-3" />
              Prev
            </button>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
