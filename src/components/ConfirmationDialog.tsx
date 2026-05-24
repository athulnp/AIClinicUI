import { AlertTriangle, X } from 'lucide-react';
import { Button } from './ui';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <AlertTriangle className="w-12 h-12 text-red-500" />,
      iconBg: 'bg-red-50',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: <AlertTriangle className="w-12 h-12 text-amber-500" />,
      iconBg: 'bg-amber-50',
      confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      icon: <AlertTriangle className="w-12 h-12 text-blue-500" />,
      iconBg: 'bg-blue-50',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-md w-full animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div className={`flex justify-center mb-6`}>
            <div className={`${styles.iconBg} p-4 rounded-full`}>
              {icon || styles.icon}
            </div>
          </div>

          {/* Title and Message */}
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-[#191c1d] mb-3">
              {title}
            </h3>
            <p className="text-[#404850] text-sm sm:text-base leading-relaxed">
              {message}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1 order-2 sm:order-1"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 order-1 sm:order-2 ${styles.confirmButton}`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationDialog;
