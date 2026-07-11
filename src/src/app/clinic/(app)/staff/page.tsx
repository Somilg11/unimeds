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
  MoreHorizontal,
  Power,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [visibleAuthIds, setVisibleAuthIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<{ type: 'toggle' | 'delete'; doctorId: string; doctorName: string; isActive?: boolean } | null>(null);

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
    setCopiedId(authId);
    toast.success('Auth ID copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[12px] font-medium uppercase text-gray-500 tracking-wider mb-2">Clinic Portal</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Staff Management</h1>
        </div>
        <Button onClick={() => { setShowAddForm(!showAddForm); setCreatedAuthId(null); }} className="rounded-xl bg-[#36565F] hover:bg-[#36565F]/90 text-white shadow-sm h-10 px-5">
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-[15px] font-semibold text-gray-900">Add New Doctor</h2>
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
                    {copiedId === createdAuthId ? (
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

            <form onSubmit={handleAddDoctor} className="space-y-4 px-1 py-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-gray-700">Name <span className="text-red-500">*</span></Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Dr. Name"
                    className="h-10 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#36565F]/30 focus:ring-[#36565F]/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-gray-700">Email <span className="text-red-500">*</span></Label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="doctor@example.com"
                    className="h-10 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#36565F]/30 focus:ring-[#36565F]/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-gray-700">Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 234 567 890"
                    className="h-10 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#36565F]/30 focus:ring-[#36565F]/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-gray-700">Specialization <span className="text-red-500">*</span></Label>
                  <Input
                    required
                    value={formData.specialization}
                    onChange={(e) => setFormData((prev) => ({ ...prev, specialization: e.target.value }))}
                    placeholder="e.g. General Practice"
                    className="h-10 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#36565F]/30 focus:ring-[#36565F]/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-gray-700">License Number <span className="text-red-500">*</span></Label>
                  <Input
                    required
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                    placeholder="License #"
                    className="h-10 rounded-xl bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#36565F]/30 focus:ring-[#36565F]/30"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-6">
                <Button type="submit" disabled={submitting} className="rounded-xl h-10 px-6 bg-[#36565F] hover:bg-[#36565F]/90 text-white shadow-sm">
                  {submitting ? 'Adding...' : 'Add Doctor'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl h-10 px-5 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or specialization..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-10 h-10 bg-white/50 border-gray-200 rounded-xl focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all shadow-sm"
          />
        </div>
        
        <div className="flex p-1 bg-gray-100/80 rounded-xl border border-gray-100 self-start w-fit">
          {[
            { id: 'all', label: 'All Status' },
            { id: 'active', label: 'Active' },
            { id: 'inactive', label: 'Inactive' }
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => { setStatusFilter(status.id); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-[13px] font-medium rounded-lg transition-all ${
                statusFilter === status.id
                  ? 'bg-white text-[#36565F] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Doctor Name</th>
                <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Specialization</th>
                <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">License #</th>
                <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Auth ID</th>
                <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDoctors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-[15px] font-semibold text-gray-900 mb-1">No doctors found</p>
                  </td>
                </tr>
              ) : (
                paginatedDoctors.map((doctor) => (
                  <tr key={doctor.doctorId} className="hover:bg-gray-50/50 border-b border-gray-100/80 last:border-b-0 transition-colors">
                    <td className="px-5 py-4 text-[14px] text-gray-900 font-medium whitespace-nowrap">{doctor.name}</td>
                    <td className="px-5 py-4 text-[13px] text-gray-600 whitespace-nowrap hidden sm:table-cell">{doctor.email}</td>
                    <td className="px-5 py-4 text-[13px] text-gray-600 whitespace-nowrap hidden md:table-cell">{doctor.specialization}</td>
                    <td className="px-5 py-4 text-[13px] text-gray-600 whitespace-nowrap hidden lg:table-cell">{doctor.licenseNumber}</td>
                    <td className="px-5 py-4 whitespace-nowrap hidden xl:table-cell">
                      {doctor.authId ? (
                        <div className="flex items-center gap-1.5">
                          <code className="text-[12px] bg-gray-50 px-2 py-1 rounded-md border border-gray-100 max-w-[120px] truncate text-gray-700">
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
                            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
                            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Copy"
                          >
                            {copiedId === doctor.authId ? (
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[13px] text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge
                        variant={doctor.isActive ? 'default' : 'secondary'}
                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                          doctor.isActive
                            ? 'bg-[#E2F0F0]/80 text-[#36565F] border-[#E2F0F0]'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        {doctor.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            disabled={togglingId === doctor.doctorId || deletingId === doctor.doctorId}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() =>
                              setConfirmAction({
                                type: 'toggle',
                                doctorId: doctor.doctorId,
                                doctorName: doctor.name,
                                isActive: doctor.isActive,
                              })
                            }
                          >
                            <Power className="w-4 h-4" />
                            {doctor.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                              setConfirmAction({
                                type: 'delete',
                                doctorId: doctor.doctorId,
                                doctorName: doctor.name,
                              })
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        <div className="flex items-center justify-between mt-6 px-1">
          <p className="text-[13px] font-medium text-gray-500">
            Page {safePage} of {totalPages} ({filteredDoctors.length} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-xl h-9 px-4 text-[12px] font-medium border-gray-200 shadow-sm"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Prev
            </Button>
            <Button
              variant="outline"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-xl h-9 px-4 text-[12px] font-medium border-gray-200 shadow-sm"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmAction(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md mx-4 p-6">
            <h2 className="text-[16px] font-semibold text-gray-900 mb-2">
              {confirmAction.type === 'toggle'
                ? confirmAction.isActive
                  ? 'Deactivate Doctor'
                  : 'Activate Doctor'
                : 'Remove Doctor'}
            </h2>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
              {confirmAction.type === 'toggle'
                ? `Are you sure you want to ${confirmAction.isActive ? 'deactivate' : 'activate'} ${confirmAction.doctorName}? ${confirmAction.isActive ? 'They will no longer be able to access the clinic portal.' : 'They will regain access to the clinic portal.'}`
                : `Are you sure you want to remove ${confirmAction.doctorName} from this clinic? This action cannot be undone.`}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="rounded-xl h-10 px-5 text-[13px] font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'toggle') {
                    handleToggle(confirmAction.doctorId, confirmAction.isActive!);
                  } else {
                    handleDelete(confirmAction.doctorId);
                  }
                  setConfirmAction(null);
                }}
                className={`rounded-xl h-10 px-5 text-[13px] font-medium transition-colors ${
                  confirmAction.type === 'delete'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-[#36565F] text-white hover:bg-[#36565F]/90'
                }`}
              >
                {confirmAction.type === 'toggle'
                  ? confirmAction.isActive
                    ? 'Deactivate'
                    : 'Activate'
                  : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
