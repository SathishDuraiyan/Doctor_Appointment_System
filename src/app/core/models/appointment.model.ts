export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  experience: number | string;
  department: string;
  licenseNumber: string;
  consultationFee: number;
  profileImage?: string;
  isActive: boolean;
  gender?: string;
  languages?: string[];
  qualification?: string;
  location?: string;
  rating?: number;
  totalReviews?: number;
  slots: DoctorSlot[];
}

export interface DoctorSlot {
  id: string;
  doctorId: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  maxPatients: number;
  maxCapacity?: number; // Alternative property name for backward compatibility
  bookedCount: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  slotId: string;
  appointmentDate: string; // YYYY-MM-DD format
  appointmentTime: string; // HH:MM format
  duration: number; // in minutes
  purpose: string;
  status: AppointmentStatus;
  insuranceProvider?: string;
  patientIdNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  doctorAvatar?: string;
  rescheduleStatus?: 'SUCCESSFUL' | 'REJECTED' | 'REQUESTED';
  newAppointmentDate?: string; // YYYY-MM-DD format\
  newAppointmentTime?: string; // HH:MM format
  rescheduleStatusChangedAt?: Date;

  // base64 or url for doctor image
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULE_REQUESTED = 'RESCHEDULE_REQUESTED'
}

export interface MedicalCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  specializations: string[];
}

export interface BookingRequest {
  doctorId: string;
  slotId: string;
  patientId: string;
  purpose: string;
  insuranceProvider?: string;
  patientIdNumber?: string;
  notes?: string;
}

export interface SlotAvailability {
  date: string;
  slots: {
    slotId: string;
    startTime: string;
    endTime: string;
    maxPatients: number;
    bookedCount: number;
    isAvailable: boolean;
  }[];
}

export interface WeeklySchedule {
  doctorId: string;
  weekStartDate: string; // YYYY-MM-DD format
  weekEndDate: string; // YYYY-MM-DD format
  dailySlots: {
    [date: string]: DoctorSlot[];
  };
}
