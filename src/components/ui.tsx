import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { X } from 'lucide-react';
import { useNotification, type NotificationType } from '../context/NotificationContext';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 px-4 sm:px-5 py-4">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {action}
    </div>
  );
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50';
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Input({ label, error, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1 block font-medium text-slate-700">{label}</span>}
      <input
        className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Select({
  label,
  options,
  error,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: { value: string | number; label: string }[];
  error?: string;
}) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1 block font-medium text-slate-700">{label}</span>}
      <select
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'success' | 'warn' | 'danger' }) {
  const tones = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-800',
    warn: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Alert({ message, errors }: { message: string; errors?: string[] }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <p>{message}</p>
      {errors?.map((e) => (
        <p key={e} className="mt-1 text-xs">
          {e}
        </p>
      ))}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="py-12 text-center text-slate-500">{message}</p>;
}

export function Toast({ message, type, onClose }: { message: string; type: NotificationType; onClose: () => void }) {
  const bgColors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`${bgColors[type]} flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg`}>
      <span>{message}</span>
      <button onClick={onClose} className="hover:opacity-80">
        <X size={18} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed bottom-0 right-0 z-50 space-y-2 p-4">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}
