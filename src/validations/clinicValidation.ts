import { z } from 'zod';

export const createClinicSchema = z.object({
  code: z.string()
    .min(1, 'Clinic code is required')
    .max(50, 'Clinic code must be less than 50 characters'),
  name: z.string()
    .min(1, 'Clinic name is required')
    .max(200, 'Clinic name must be less than 200 characters'),
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  phoneNumber: z.string()
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[+]?[\d\s-()]{10,20}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  email: z.string()
    .max(200, 'Email must be less than 200 characters')
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  city: z.string()
    .max(100, 'City must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  state: z.string()
    .max(100, 'State must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  postalCode: z.string()
    .max(20, 'Postal code must be less than 20 characters')
    .optional()
    .or(z.literal('')),
  country: z.string()
    .max(100, 'Country must be less than 100 characters')
    .optional()
    .or(z.literal('')),
});

export const updateClinicSchema = z.object({
  name: z.string()
    .min(1, 'Clinic name is required')
    .max(200, 'Clinic name must be less than 200 characters'),
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  phoneNumber: z.string()
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[+]?[\d\s-()]{10,20}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  email: z.string()
    .max(200, 'Email must be less than 200 characters')
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  city: z.string()
    .max(100, 'City must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  state: z.string()
    .max(100, 'State must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  postalCode: z.string()
    .max(20, 'Postal code must be less than 20 characters')
    .optional()
    .or(z.literal('')),
  country: z.string()
    .max(100, 'Country must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean(),
});

export type CreateClinicData = z.infer<typeof createClinicSchema>;
export type UpdateClinicData = z.infer<typeof updateClinicSchema>;
