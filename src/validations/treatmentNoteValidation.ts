import { z } from 'zod';

export const generateTreatmentNoteSchema = z.object({
  patientId: z.coerce.number().min(1, 'Patient is required'),
  appointmentId: z.coerce.number().min(1, 'Appointment is required'),
  procedureType: z.string()
    .min(1, 'Procedure type is required')
    .max(200, 'Procedure type must be less than 200 characters'),
  toothNumber: z.string()
    .max(10, 'Tooth number must be less than 10 characters')
    .optional(),
  symptoms: z.string()
    .max(1000, 'Symptoms must be less than 1000 characters')
    .optional(),
  diagnosis: z.string()
    .max(1000, 'Diagnosis must be less than 1000 characters')
    .optional(),
  treatmentPerformed: z.string()
    .max(2000, 'Treatment performed must be less than 2000 characters')
    .optional(),
  additionalNotes: z.string()
    .max(1000, 'Additional notes must be less than 1000 characters')
    .optional(),
});

export const createTreatmentNoteSchema = z.object({
  patientId: z.coerce.number().min(1, 'Patient is required'),
  appointmentId: z.coerce.number().min(1, 'Appointment is required'),
  procedureType: z.string()
    .min(1, 'Procedure type is required')
    .max(200, 'Procedure type must be less than 200 characters'),
  toothNumber: z.string()
    .max(10, 'Tooth number must be less than 10 characters')
    .optional(),
  symptoms: z.string()
    .max(1000, 'Symptoms must be less than 1000 characters')
    .optional(),
  diagnosis: z.string()
    .max(1000, 'Diagnosis must be less than 1000 characters')
    .optional(),
  treatmentPerformed: z.string()
    .max(2000, 'Treatment performed must be less than 2000 characters')
    .optional(),
  additionalNotes: z.string()
    .max(1000, 'Additional notes must be less than 1000 characters')
    .optional(),
  aiGeneratedNote: z.string()
    .max(5000, 'AI generated note must be less than 5000 characters')
    .optional(),
  finalNote: z.string()
    .max(5000, 'Final note must be less than 5000 characters')
    .optional(),
});

export const updateTreatmentNoteSchema = z.object({
  procedureType: z.string()
    .min(1, 'Procedure type is required')
    .max(200, 'Procedure type must be less than 200 characters')
    .optional(),
  toothNumber: z.string()
    .max(10, 'Tooth number must be less than 10 characters')
    .optional(),
  symptoms: z.string()
    .max(1000, 'Symptoms must be less than 1000 characters')
    .optional(),
  diagnosis: z.string()
    .max(1000, 'Diagnosis must be less than 1000 characters')
    .optional(),
  treatmentPerformed: z.string()
    .max(2000, 'Treatment performed must be less than 2000 characters')
    .optional(),
  additionalNotes: z.string()
    .max(1000, 'Additional notes must be less than 1000 characters')
    .optional(),
  finalNote: z.string()
    .max(5000, 'Final note must be less than 5000 characters')
    .optional(),
});

export type GenerateTreatmentNoteFormData = z.infer<typeof generateTreatmentNoteSchema>;
export type CreateTreatmentNoteFormData = z.infer<typeof createTreatmentNoteSchema>;
export type UpdateTreatmentNoteFormData = z.infer<typeof updateTreatmentNoteSchema>;
