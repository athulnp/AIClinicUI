import { z } from 'zod';

export const patientSchema = z.object({
  fullName: z.string()
    .min(1, 'Full name is required')
    .max(200, 'Full name must be less than 200 characters'),
  gender: z.number().refine(val => val >= 0 && val <= 2, 'Valid gender is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  phoneNumber: z.string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[+]?[\d\s-()]{10,20}$/, 'Invalid phone number format'),
  email: z.string()
    .max(200, 'Email must be less than 200 characters')
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  bloodGroup: z.string()
    .max(10, 'Blood group must be less than 10 characters')
    .optional()
    .or(z.literal('')),
  medicalHistory: z.string()
    .max(2000, 'Medical history must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
  allergies: z.string()
    .max(1000, 'Allergies must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  emergencyContact: z.string()
    .max(200, 'Emergency contact must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
});

export type PatientFormData = z.infer<typeof patientSchema>;
