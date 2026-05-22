export const UserRole = {
  SuperAdmin: 0,
  Admin: 1,
  Doctor: 2,
  Receptionist: 3,
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Gender = { Male: 1, Female: 2, Other: 3 } as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const AppointmentStatus = {
  Scheduled: 1,
  Completed: 2,
  Cancelled: 3,
  NoShow: 4,
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const PaymentStatus = { Pending: 1, Partial: 2, Paid: 3 } as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = { Cash: 1, UPI: 2, Card: 3, BankTransfer: 4 } as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors: string[];
  timestamp: string;
}

export interface PagedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface User {
  id: number;
  clinicId?: number | null;
  clinicName?: string | null;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiration: string;
  user: User;
}

export interface Clinic {
  id: number;
  code: string;
  name: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Patient {
  id: number;
  patientCode: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  medicalHistory?: string;
  allergies?: string;
  emergencyContact?: string;
  notes?: string;
  createdAt: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  createdAt: string;
}

export interface Doctor {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  licenseNumber: string;
  yearsOfExperience: number;
  bio?: string;
  consultationFee: number;
  department?: string;
  clinicLocation?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Billing {
  id: number;
  patientId: number;
  patientName: string;
  appointmentId?: number;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateAppointmentRequest {
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
  notes?: string;
}

export interface RescheduleAppointmentRequest {
  newAppointmentDate: string;
  newStartTime: string;
  newEndTime: string;
}

export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus;
  notes?: string;
}

export interface CreatePatientRequest {
  patientCode: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  medicalHistory?: string;
  allergies?: string;
  emergencyContact?: string;
  notes?: string;
}

export interface CreateDoctorRequest {
  userId: number;
  specialization: string;
  licenseNumber: string;
  yearsOfExperience: number;
  consultationFee: number;
  department?: string;
  bio?: string;
}

export interface UpdateDoctorRequest {
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  department?: string;
  bio?: string;
  isAvailable?: boolean;
}
