/**
 * User/Patient Portal Types
 * Strict TypeScript definitions for patient-facing features
 */

export interface TimelineItem {
  id: string;
  type: 'record' | 'appointment' | 'prescription' | 'lab_result';
  date: string;
  title: string;
  description?: string;
  status?: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'processing';
  metadata?: {
    doctorName?: string;
    location?: string;
    recordType?: string;
    fileType?: string;
    fileSize?: number;
    appointmentTime?: string;
    clinicName?: string;
  };
}

export interface MedicalRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  recordType: 'lab_report' | 'prescription' | 'imaging' | 'discharge_summary' | 'other';
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed';
  ocrData?: {
    extractedText?: string;
    keyFindings?: string[];
    medications?: string[];
    diagnoses?: string[];
  };
  s3Url?: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  clinicId: string;
  clinicName: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  type: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
  reason?: string;
  notes?: string;
}

export interface AppointmentSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
  clinicId: string;
}

export interface BookingWizardState {
  step: 1 | 2 | 3 | 4;
  selectedClinic?: string;
  selectedDoctor?: string;
  selectedSlot?: AppointmentSlot;
  reason?: string;
  notes?: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  bloodType?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}
