'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

const ITEMS_PER_PAGE = 10;

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
  const [copiedId, setCopiedId] = useState(false);

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
      const message = err instanceof Error ? err.message : 'Failed to assign doctor';
      setError(message);
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
    setCopiedId(true);
    toast.success('Auth ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
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
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Doctors</h1>
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
          <Users className="w-6 h-6" />
          Doctors
        </h1>
        <Button onClick={() => { setShowAddForm(!showAddForm); setCreatedAuthId(null); }} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Create Doctor
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

      {/* Create Doctor Form */}
      {showAddForm && (
        <Card className="bg-white border border-zinc-200 mb-6">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold text-zinc-900">
              Create New Doctor
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {createdAuthId && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium mb-2">
                  Doctor created successfully!
                </p>
                <p className="text-xs text-green-600 mb-2">
                  Auth ID (share with the doctor for login):
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-2 py-1 bg-white rounded border border-green-200 text-sm text-zinc-900 break-all">
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
                      <Copy className="w-4 h-4 text-zinc-500" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-600">Name *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Dr. Name"
                    className="bg-zinc-50 border border-zinc-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-600">Email *</Label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="doctor@example.com"
                    className="bg-zinc-50 border border-zinc-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-600">Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 234 567 890"
                    className="bg-zinc-50 border border-zinc-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-600">Specialization *</Label>
                  <Input
                    required
                    value={formData.specialization}
                    onChange={(e) => setFormData((prev) => ({ ...prev, specialization: e.target.value }))}
                    placeholder="e.g. General Practice"
                    className="bg-zinc-50 border border-zinc-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-600">License Number *</Label>
                  <Input
                    required
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                    placeholder="License #"
                    className="bg-zinc-50 border border-zinc-200"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" disabled={submitting} size="sm">
                  {submitting ? 'Creating...' : 'Create Doctor'}
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
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search by name, email, or specialization..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-10 bg-white border border-zinc-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="h-9 px-3 text-sm border border-zinc-200 rounded-md bg-white text-zinc-700"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={clinicFilter}
          onChange={(e) => { setClinicFilter(e.target.value); setCurrentPage(1); }}
          className="h-9 px-3 text-sm border border-zinc-200 rounded-md bg-white text-zinc-700"
        >
          <option value="all">All Clinics</option>
          {uniqueClinicNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card className="bg-white border border-zinc-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="text-left font-medium text-zinc-500 px-4 py-3">Doctor Name</th>
                  <th className="text-left font-medium text-zinc-500 px-4 py-3">Email</th>
                  <th className="text-left font-medium text-zinc-500 px-4 py-3">Specialization</th>
                  <th className="text-left font-medium text-zinc-500 px-4 py-3">License #</th>
                  <th className="text-left font-medium text-zinc-500 px-4 py-3">Assigned Clinics</th>
                  <th className="text-left font-medium text-zinc-500 px-4 py-3">Status</th>
                  <th className="text-left font-medium text-zinc-500 px-4 py-3">Auth ID</th>
                  <th className="text-left font-medium text-zinc-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <Users className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                      <p className="text-zinc-500 text-sm">No doctors found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedDoctors.map((doctor) => (
                    <tr key={doctor.doctorId} className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/50">
                      <td className="px-4 py-3 font-medium text-zinc-900 whitespace-nowrap">{doctor.name}</td>
                      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{doctor.email}</td>
                      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{doctor.specialization}</td>
                      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{doctor.licenseNumber}</td>
                      <td className="px-4 py-3">
                        {doctor.assignedClinics && doctor.assignedClinics.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {doctor.assignedClinics.map((clinic) => (
                              <Badge key={clinic.clinicId} variant="secondary" className="text-[10px] bg-zinc-100 text-zinc-600 border-zinc-200">
                                <Building2 className="w-2.5 h-2.5 mr-1" />
                                {clinic.clinicName}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={doctor.isActive ? 'default' : 'secondary'}
                          className={`text-[10px] ${
                            doctor.isActive
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                          }`}
                        >
                          {doctor.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {doctor.authId ? (
                          <div className="flex items-center gap-1.5">
                            <code className="text-xs bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100 max-w-[120px] truncate">
                              {visibleAuthIds.has(doctor.doctorId) ? doctor.authId : '•'.repeat(Math.min(doctor.authId.length, 12))}
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
                              className="shrink-0 text-zinc-400 hover:text-zinc-600"
                              title={visibleAuthIds.has(doctor.doctorId) ? 'Hide' : 'Reveal'}
                            >
                              {visibleAuthIds.has(doctor.doctorId) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyAuthId(doctor.authId!)}
                              className="shrink-0 text-zinc-400 hover:text-zinc-600"
                              title="Copy"
                            >
                              {copiedId ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu
                          open={openDropdownDoctorId === doctor.doctorId}
                          onOpenChange={(open) => setOpenDropdownDoctorId(open ? doctor.doctorId : null)}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <Building2 className="w-4 h-4" />
                                Assign to Clinic
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup
                                  value={selectedClinicId}
                                  onValueChange={(value) => {
                                    setSelectedClinicId(value);
                                    handleAssignDoctor(doctor.doctorId, value);
                                    setOpenDropdownDoctorId(null);
                                  }}
                                >
                                  {clinics.map((clinic) => (
                                    <DropdownMenuRadioItem key={clinic.id} value={clinic.id}>
                                      {clinic.name}
                                    </DropdownMenuRadioItem>
                                  ))}
                                </DropdownMenuRadioGroup>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            {doctor.assignedClinics && doctor.assignedClinics.length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                {doctor.assignedClinics.map((clinic) => (
                                  <DropdownMenuItem
                                    key={clinic.clinicId}
                                    variant="destructive"
                                    disabled={removingDoctorId === `${doctor.doctorId}-${clinic.clinicId}`}
                                    onClick={() => handleRemoveDoctor(doctor.doctorId, clinic.clinicId)}
                                  >
                                    <Trash2 className="w-4 h-4" />
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

          {/* Pagination */}
          {filteredDoctors.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200">
              <span className="text-sm text-zinc-500">
                Page {safeCurrentPage} of {totalPages} ({filteredDoctors.length} total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
