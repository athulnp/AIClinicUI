import { AlertCircle } from 'lucide-react';

interface ValidationErrorProps {
  message: string;
}

export function ValidationError({ message }: ValidationErrorProps) {
  return (
    <div className="flex items-center gap-2 text-red-600 text-xs sm:text-sm mt-1">
      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
