import { z } from 'zod';

export const appointmentSchema = z.object({
  patientId: z.number().min(1, 'Patient is required'),
  doctorId: z.number().min(1, 'Doctor is required'),
  appointmentDate: z.string().min(1, 'Appointment date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  reason: z.string()
    .max(500, 'Reason must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
});

export const rescheduleAppointmentSchema = z.object({
  newAppointmentDate: z.string().min(1, 'New appointment date is required'),
  newStartTime: z.string().min(1, 'New start time is required'),
  newEndTime: z.string().min(1, 'New end time is required'),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.number().min(0, 'Valid status is required'),
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;
export type RescheduleAppointmentFormData = z.infer<typeof rescheduleAppointmentSchema>;
export type UpdateAppointmentStatusFormData = z.infer<typeof updateAppointmentStatusSchema>;
