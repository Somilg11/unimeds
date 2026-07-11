'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Users, Plus, Search, Copy, Check, Building2, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
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
  assignedClinics?: Array<{ clinicId: string; clinicName: string }>;
}

interface Clinic {
  id: string;
  name: string;
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

const ITEMS_PER_PAGE = 15;

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<NewDoctorForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdAuthId, setCreatedAuthId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [assigningDoctorId, setAssigningDoctorId] = useState<string | null>(null);
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [removingDoctorId, setRemovingDoctorId] = useState<string | null>(null);
  const [visibleAuthIds, setVisibleAuthIds] = useState<Set<string>>(new Set());

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clinicFilter, setClinicFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [openDropdownDoctorId, setOpenDropdownDoctorId] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
    fetchClinics();
  }, []);

  async function fetchDoctors() {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/admin/doctors');
      const raw = res.data;
      const doctorsList = raw?.doctors || raw?.data?.doctors || raw?.data || raw || [];
      setDoctors(Array.isArray(doctorsList) ? doctorsList : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch doctors';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchClinics() {
    try {
      const res = await apiClient.get('/admin/clinics');
      const raw = res.data;
      const clinicsList = raw?.clinics || raw?.data?.clinics || raw?.data || raw || [];
      setClinics(Array.isArray(clinicsList) ? clinicsList : []);
    } catch {
      // Silently fail - clinics list is supplementary
    }
  }

  async function handleCreateDoctor(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setSubmitError(null);
      const res = await apiClient.post('/admin/doctors', formData);
      const raw = res.data;
      const data = raw?.doctor || raw?.data?.doctor || raw?.data || raw || {};
      if (data.authId) {
        setCreatedAuthId(data.authId);
      }
      setFormData(emptyForm);
      fetchDoctors();
      toast.success('Doctor created successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create doctor';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssignDoctor(doctorId: string, clinicId: string) {
    if (!doctorId || !clinicId) return;
    try {
      setAssigning(true);
      await apiClient.post('/admin/doctors/assign', {
        doctorId,
        clinicId,
      });
      setAssigningDoctorId(null);
      setSelectedClinicId('');
      fetchDoctors();
      toast.success('Doctor assigned to clinic');
    } catch (err: unknown) {
      let message = 'Failed to assign doctor';
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: { error?: string; code?: string } } }).response;
        if (res?.data?.code === 'ALREADY_ASSIGNED') {
          message = 'Doctor is already assigned to this clinic';
        } else if (res?.data?.error) {
          message = res.data.error;
        }
      }
      toast.error(message);
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemoveDoctor(doctorId: string, clinicId: string) {
    try {
      setRemovingDoctorId(`${doctorId}-${clinicId}`);
      await apiClient.delete('/admin/doctors/assign', {
        data: { doctorId, clinicId },
      });
      fetchDoctors();
      toast.success('Doctor removed from clinic');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove doctor from clinic';
      setError(message);
      toast.error(message);
    } finally {
      setRemovingDoctorId(null);
    }
  }

  function handleCopyAuthId(authId: string) {
    navigator.clipboard.writeText(authId);
    setCopiedId(authId);
    toast.success('Auth ID copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  }

  const uniqueClinicNames = Array.from(
    new Set(
      doctors
        .flatMap((d) => d.assignedClinics?.map((c) => c.clinicName) ?? [])
    )
  ).sort();

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

    const matchesClinic =
      clinicFilter === 'all' ||
      doctor.assignedClinics?.some((c) => c.clinicName === clinicFilter);

    return matchesSearch && matchesStatus && matchesClinic;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedDoctors = filteredDoctors.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="p-4 lg:p-10">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-6">Doctors</h1>
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
            <Users className="w-5 h-5 text-gray-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Doctors</h1>
          </div>
        </div>
        <Button 
          onClick={() => { setShowAddForm(!showAddForm); setCreatedAuthId(null); }}
          className="rounded-xl bg-[#36565F] hover:bg-[#36565F]/90 text-white shadow-sm h-10 px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Doctor
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
          <p className="text-sm font-semibold text-gray-900 mb-4">Create New Doctor</p>
          {createdAuthId && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl">
              <p className="text-sm text-green-700 font-medium mb-2">
                Doctor created successfully!
              </p>
              <p className="text-xs text-green-600 mb-2">
                Auth ID (share with the doctor for login):
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white border border-green-200 rounded-xl text-sm text-gray-900 break-all font-mono">
                  {createdAuthId}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-lg"
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
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-600 rounded-xl">
              {submitError}
            </div>
          )}

          <form onSubmit={handleCreateDoctor} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase text-gray-500">Name *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Dr. Name"
                  className="bg-gray-50 border-gray-200 rounded-xl h-10 px-4 focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase text-gray-500">Email *</Label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="doctor@example.com"
                  className="bg-gray-50 border-gray-200 rounded-xl h-10 px-4 focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase text-gray-500">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 234 567 890"
                  className="bg-gray-50 border-gray-200 rounded-xl h-10 px-4 focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase text-gray-500">Specialization *</Label>
                <Input
                  required
                  value={formData.specialization}
                  onChange={(e) => setFormData((prev) => ({ ...prev, specialization: e.target.value }))}
                  placeholder="e.g. General Practice"
                  className="bg-gray-50 border-gray-200 rounded-xl h-10 px-4 focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-[10px] uppercase text-gray-500">License Number *</Label>
                <Input
                  required
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                  placeholder="License #"
                  className="bg-gray-50 border-gray-200 rounded-xl h-10 px-4 focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" disabled={submitting} className="rounded-xl bg-[#36565F] hover:bg-[#36565F]/90 text-white shadow-sm h-10 px-4">
                {submitting ? 'Creating...' : 'Create Doctor'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl h-10 px-4"
                onClick={() => { setShowAddForm(false); setCreatedAuthId(null); setSubmitError(null); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search doctors..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-10 h-10 bg-white/50 border-gray-200 rounded-xl focus:border-[#36565F]/30 focus:ring-[#36565F]/30 transition-all shadow-sm"
          />
        </div>
        <div className="flex p-1 bg-gray-100/80 rounded-xl border border-gray-100 self-start">
          {['all', 'active', 'inactive'].map((filter) => (
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
        <Select
          value={clinicFilter}
          onValueChange={(value) => { setClinicFilter(value); setCurrentPage(1); }}
        >
          <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white border-gray-200 rounded-xl shadow-sm focus:ring-[#36565F]/30">
            <SelectValue placeholder="All Clinics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clinics</SelectItem>
            {uniqueClinicNames.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50/50 border-b border-gray-100 z-10">
              <tr className="border-b border-gray-100">
                <th className="text-left font-mono text-[10px] uppercase text-gray-500 px-4 py-3.5">Name</th>
                <th className="text-left font-mono text-[10px] uppercase text-gray-500 px-4 py-3.5 hidden sm:table-cell">Email</th>
                <th className="text-left font-mono text-[10px] uppercase text-gray-500 px-4 py-3.5 hidden md:table-cell">Specialization</th>
                <th className="text-left font-mono text-[10px] uppercase text-gray-500 px-4 py-3.5 hidden lg:table-cell">License #</th>
                <th className="text-left font-mono text-[10px] uppercase text-gray-500 px-4 py-3.5 hidden md:table-cell">Clinics</th>
                <th className="text-left font-mono text-[10px] uppercase text-gray-500 px-4 py-3.5">Status</th>
                <th className="text-left font-mono text-[10px] uppercase text-gray-500 px-4 py-3.5 hidden lg:table-cell">Auth ID</th>
                <th className="text-left font-mono text-[10px] uppercase text-gray-500 px-4 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {paginatedDoctors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No doctors found</p>
                  </td>
                </tr>
              ) : (
                paginatedDoctors.map((doctor) => (
                  <tr key={doctor.doctorId} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-gray-900">
                      <div>{doctor.name}</div>
                      <div className="text-xs text-gray-500 sm:hidden mt-0.5">{doctor.email}</div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap hidden sm:table-cell">{doctor.email}</td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap hidden md:table-cell">{doctor.specialization}</td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap hidden lg:table-cell">{doctor.licenseNumber}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {doctor.assignedClinics && doctor.assignedClinics.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {doctor.assignedClinics.map((clinic) => (
                            <Badge key={clinic.clinicId} variant="secondary" className="text-[10px] bg-gray-100 text-gray-600 border-gray-200 rounded-full px-2.5 py-0.5">
                              <Building2 className="w-2.5 h-2.5 mr-1" />
                              {clinic.clinicName}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={doctor.isActive ? 'default' : 'secondary'}
                        className={`text-[10px] rounded-full px-2.5 py-0.5 ${
                          doctor.isActive
                            ? 'bg-green-55 bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        {doctor.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {doctor.authId ? (
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs bg-gray-50 px-2.5 py-1 border border-gray-100 rounded-lg max-w-[120px] truncate font-mono">
                            {visibleAuthIds.has(doctor.doctorId) ? doctor.authId : '\u2022'.repeat(Math.min(doctor.authId.length, 12))}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              setVisibleAuthIds(prev => {
                                const next = new Set(prev);
                                if (next.has(doctor.doctorId)) next.delete(doctor.doctorId);
                                else next.add(doctor.doctorId);
                                return next;
                              });
                            }}
                            className="shrink-0 text-gray-400 hover:text-gray-600 rounded-md p-0.5"
                            title={visibleAuthIds.has(doctor.doctorId) ? 'Hide' : 'Reveal'}
                          >
                            {visibleAuthIds.has(doctor.doctorId) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyAuthId(doctor.authId!)}
                            className="shrink-0 text-gray-400 hover:text-gray-600 rounded-md p-0.5"
                            title="Copy"
                          >
                            {copiedId === doctor.authId ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <DropdownMenu
                        open={openDropdownDoctorId === doctor.doctorId}
                        onOpenChange={(open) => setOpenDropdownDoctorId(open ? doctor.doctorId : null)}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-gray-100 min-w-[160px] p-1.5">
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="rounded-lg">
                              <Building2 className="w-4 h-4 mr-2" />
                              Assign to Clinic
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="rounded-xl p-1 shadow-md border-gray-100">
                              <DropdownMenuRadioGroup
                                value={selectedClinicId}
                                onValueChange={(value) => {
                                  setSelectedClinicId(value);
                                  handleAssignDoctor(doctor.doctorId, value);
                                  setOpenDropdownDoctorId(null);
                                }}
                              >
                                {clinics.map((clinic) => (
                                  <DropdownMenuRadioItem key={clinic.id} value={clinic.id} className="rounded-lg">
                                    {clinic.name}
                                  </DropdownMenuRadioItem>
                                ))}
                              </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          {doctor.assignedClinics && doctor.assignedClinics.length > 0 && (
                            <>
                              <DropdownMenuSeparator className="my-1 border-gray-100" />
                              {doctor.assignedClinics.map((clinic) => (
                                <DropdownMenuItem
                                  key={clinic.clinicId}
                                  variant="destructive"
                                  disabled={removingDoctorId === `${doctor.doctorId}-${clinic.clinicId}`}
                                  onClick={() => handleRemoveDoctor(doctor.doctorId, clinic.clinicId)}
                                  className="rounded-lg cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove from {clinic.clinicName}
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredDoctors.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100/80 bg-gray-50/30 gap-4">
            <p className="text-[13px] text-gray-500 font-medium">
              Page {safeCurrentPage} of {totalPages} <span className="text-gray-400">({filteredDoctors.length} total)</span>
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
        )}
      </div>
    </div>
  );
}
