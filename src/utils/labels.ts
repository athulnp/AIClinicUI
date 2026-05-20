import {
  AppointmentStatus,
  Gender,
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from '../types';

export const roleLabels: Record<UserRole, string> = {
  [UserRole.SuperAdmin]: 'Super Admin',
  [UserRole.Admin]: 'Clinic Admin',
  [UserRole.Doctor]: 'Doctor',
  [UserRole.Receptionist]: 'Receptionist',
};

export const genderLabels: Record<Gender, string> = {
  [Gender.Male]: 'Male',
  [Gender.Female]: 'Female',
  [Gender.Other]: 'Other',
};

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Scheduled]: 'Scheduled',
  [AppointmentStatus.Completed]: 'Completed',
  [AppointmentStatus.Cancelled]: 'Cancelled',
  [AppointmentStatus.NoShow]: 'No Show',
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: 'Pending',
  [PaymentStatus.Partial]: 'Partial',
  [PaymentStatus.Paid]: 'Paid',
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.Cash]: 'Cash',
  [PaymentMethod.UPI]: 'UPI',
  [PaymentMethod.Card]: 'Card',
  [PaymentMethod.BankTransfer]: 'Bank Transfer',
};

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(t: string) {
  if (!t) return '';
  const parts = t.split(':');
  return `${parts[0]}:${parts[1]}`;
}

export function toTimeSpan(hhmm: string): string {
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
}
