import { z } from 'zod';

// Schema for creating a doctor (includes user fields)
export const createDoctorSchema = z.object({
  // User fields
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits').optional().or(z.literal('')),
  // Doctor fields
  specialization: z.string().min(2, 'Specialization is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  yearsOfExperience: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num >= 0 && num <= 50;
  }, 'Years of experience must be between 0 and 50'),
  consultationFee: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
  }, 'Consultation fee must be greater than 0'),
  department: z.string().optional(),
  bio: z.string().max(1000, 'Bio must be less than 1000 characters').optional(),
  isAvailable: z.boolean().optional(),
});

// Schema for updating doctor profile (no user fields)
export const updateDoctorSchema = z.object({
  specialization: z.string().min(2, 'Specialization is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  yearsOfExperience: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num >= 0 && num <= 50;
  }, 'Years of experience must be between 0 and 50'),
  consultationFee: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
  }, 'Consultation fee must be greater than 0'),
  department: z.string().optional(),
  bio: z.string().max(1000, 'Bio must be less than 1000 characters').optional(),
  isAvailable: z.boolean().optional(),
});

export type CreateDoctorFormData = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorFormData = z.infer<typeof updateDoctorSchema>;
