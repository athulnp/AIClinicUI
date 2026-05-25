import { z } from 'zod';

export const createBillingSchema = z.object({
  patientId: z.number().min(1, 'Patient is required'),
  appointmentId: z.number().optional(),
  totalAmount: z.number()
    .min(0.01, 'Total amount must be greater than 0'),
  paymentMethod: z.number().min(0, 'Valid payment method is required'),
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
});

export const updateBillingSchema = z.object({
  patientId: z.number().min(1, 'Patient is required'),
  appointmentId: z.number().optional(),
  totalAmount: z.number()
    .min(0.01, 'Total amount must be greater than 0'),
  paymentMethod: z.number().min(0, 'Valid payment method is required'),
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
});

export const recordPaymentSchema = z.object({
  paymentAmount: z.number()
    .min(0.01, 'Payment amount must be greater than 0'),
  paymentMethod: z.number().min(0, 'Valid payment method is required'),
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
});

export type CreateBillingData = z.infer<typeof createBillingSchema>;
export type UpdateBillingData = z.infer<typeof updateBillingSchema>;
export type RecordPaymentData = z.infer<typeof recordPaymentSchema>;
