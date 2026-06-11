// Re-export database schema types from server for frontend use
// This file provides TypeScript types for API responses

export type UserRole = 'patient' | 'doctor' | 'clinic_admin' | 'super_admin';

export type User = {
  id: string;
  authId: string;
  role: UserRole;
  profileData: {
    name?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    medicalIdentifier?: string;
    specialization?: string;
    licenseNumber?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type Clinic = {
  id: string;
  name: string;
  n8nWebhookUrls: {
    appointmentBooked?: string;
    appointmentCancelled?: string;
    recordUploaded?: string;
    notificationBase?: string;
  };
  settings: {
    timezone?: string;
    bookingWindowDays?: number;
    cancellationHours?: number;
    features?: {
      voiceReminders?: boolean;
      emailNotifications?: boolean;
      whatsappNotifications?: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
};

export type ClinicDoctor = {
  id: string;
  clinicId: string;
  doctorId: string;
  isActive: boolean;
  joinedAt: string;
  invitedBy?: string;
  doctor?: User;
};

export type Notification = {
  id: string;
  userId: string;
  clinicId?: string;
  type: 'appointment_reminder' | 'appointment_booked' | 'appointment_cancelled' | 'record_uploaded' | 'lab_result_ready' | 'general';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
};

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  slotTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type MedicalRecord = {
  id: string;
  patientId: string;
  fileUrl: string;
  recordType: string;
  ocrData: {
    extractedText?: string;
    doctorName?: string;
    date?: string;
    medications?: string[];
    diagnoses?: string[];
    summary?: string;
    processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    processedAt?: string;
  };
  fileName: string;
  fileSize?: string;
  mimeType?: string;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  userId?: string;
  action: string;
  targetResource: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    changes?: Record<string, unknown>;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
  };
  timestamp: string;
};
