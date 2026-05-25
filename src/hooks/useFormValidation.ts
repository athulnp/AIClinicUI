import { useState } from 'react';
import { z } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
}

export function useFormValidation<T extends z.ZodType>(
  schema: T,
  onSubmit: (data: z.infer<T>) => void | Promise<void>
) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (data: unknown): data is z.infer<T> => {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const validationErrors: ValidationError[] = result.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      setErrors(validationErrors);
      return false;
    }
    
    setErrors([]);
    return true;
  };

  const handleSubmit = async (data: unknown) => {
    if (!validate(data)) {
      return false;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(data as z.infer<T>);
      setErrors([]);
      return true;
    } catch (error) {
      console.error('Submission error:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getError = (field: string): string | undefined => {
    return errors.find((e) => e.field === field)?.message;
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const clearFieldError = (field: string) => {
    setErrors((prev) => prev.filter((e) => e.field !== field));
  };

  return {
    errors,
    isSubmitting,
    validate,
    handleSubmit,
    getError,
    clearErrors,
    clearFieldError,
  };
}
