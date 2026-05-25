import { z } from 'zod';

export const loginSchema = z.object({
  clinicCode: z.string()
    .max(50, 'Clinic code must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  clinicId: z.number().optional(),
  username: z.string()
    .min(1, 'Username is required'),
  password: z.string()
    .min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .max(100, 'Username must be less than 100 characters'),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  fullName: z.string()
    .min(1, 'Full name is required')
    .max(200, 'Full name must be less than 200 characters'),
  email: z.string()
    .min(1, 'Email is required')
    .max(200, 'Email must be less than 200 characters')
    .email('Invalid email address'),
  phoneNumber: z.string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[+]?[\d\s-()]{10,20}$/, 'Invalid phone number format'),
  roleId: z.coerce.number()
    .min(1, 'Valid role is required'),
  clinicId: z.number().optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string()
    .min(1, 'Full name is required')
    .max(200, 'Full name must be less than 200 characters'),
  email: z.string()
    .min(1, 'Email is required')
    .max(200, 'Email must be less than 200 characters')
    .email('Invalid email address'),
  phoneNumber: z.string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[+]?[\d\s-()]{10,20}$/, 'Invalid phone number format'),
  roleId: z.coerce.number()
    .min(1, 'Valid role is required'),
  isActive: z.boolean(),
});

export const updateProfileSchema = z.object({
  fullName: z.string()
    .min(1, 'Full name is required')
    .max(200, 'Full name must be less than 200 characters'),
  email: z.string()
    .min(1, 'Email is required')
    .max(200, 'Email must be less than 200 characters')
    .email('Invalid email address'),
  phoneNumber: z.string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[+]?[\d\s-()]{10,20}$/, 'Invalid phone number format'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(1, 'New password is required')
    .min(6, 'New password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
