import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotification, type NotificationType } from '../context/NotificationContext';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-[#bfc7d1]/30 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e1e3e4] px-6 py-5">
      <h2 className="text-xl font-semibold text-[#191c1d]">{title}</h2>
      {action}
    </div>
  );
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm';
  const variants = {
    primary: 'bg-[#005d90] text-white hover:bg-[#0077b6] shadow-md hover:shadow-lg',
    secondary: 'bg-[#69e5ff] text-[#001f25] hover:opacity-90 shadow-sm',
    danger: 'bg-[#ba1a1a] text-white hover:bg-[#93000a] shadow-md hover:shadow-lg',
    ghost: 'text-[#404850] hover:bg-[#f3f4f5] hover:text-[#005d90]',
    outline: 'border-2 border-[#707881] text-[#404850] hover:border-[#005d90] hover:bg-[#f3f4f5]',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Input({ label, error, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-2 block font-semibold text-[#191c1d]">{label}</span>}
      <input
        className={`w-full rounded-lg border border-[#bfc7d1] bg-white px-4 py-3 text-[#191c1d] outline-none transition-all duration-200 focus:border-[#005d90] focus:bg-white focus:ring-2 focus:ring-[#005d90]/20 placeholder:text-[#707881] ${error ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]/20' : ''} ${className}`}
        {...props}
      />
      {error && <span className="mt-2 block text-xs text-[#ba1a1a] flex items-center gap-1"><AlertCircle size={12} />{error}</span>}
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
      {label && <span className="mb-2 block font-semibold text-[#191c1d]">{label}</span>}
      <select
        className={`w-full rounded-lg border border-[#bfc7d1] bg-white px-4 py-3 text-[#191c1d] outline-none transition-all duration-200 focus:border-[#005d90] focus:bg-white focus:ring-2 focus:ring-[#005d90]/20 ${error ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]/20' : ''}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span className="mt-2 block text-xs text-[#ba1a1a] flex items-center gap-1"><AlertCircle size={12} />{error}</span>}
    </label>
  );
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'success' | 'warn' | 'danger' }) {
  const tones = {
    default: 'bg-[#f3f4f5] text-[#404850] border border-[#bfc7d1]',
    success: 'bg-[#e7fbff] text-[#00626f] border border-[#83d3e1]',
    warn: 'bg-[#ffdad6] text-[#ba1a1a] border border-[#ffdad6]',
    danger: 'bg-[#ffdad6] text-[#93000a] border border-[#ffdad6]',
  };
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between border-b border-[#e1e3e4] px-6 py-5">
          <h3 className="text-xl font-semibold text-[#191c1d]">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#707881] hover:bg-[#f3f4f5] hover:text-[#005d90] transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Alert({ message, errors }: { message: string; errors?: string[] }) {
  return (
    <div className="rounded-lg border border-[#ffdad6] bg-[#ffdad6] px-5 py-4 text-sm text-[#93000a]">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-medium">{message}</p>
          {errors?.map((e, i) => (
            <p key={i} className="mt-1 text-xs opacity-90">
              • {e}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 h-14 w-14 animate-spin rounded-full border-4 border-[#f3f4f5]"></div>
          <div className="absolute inset-0 h-14 w-14 animate-spin rounded-full border-4 border-t-[#005d90] border-r-transparent border-b-transparent border-l-transparent"></div>
        </div>
        <p className="text-sm font-medium text-[#707881]">Loading...</p>
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f4f5]">
        <Info className="h-8 w-8 text-[#707881]" />
      </div>
      <p className="text-[#404850]">{message}</p>
    </div>
  );
}

export function Toast({ message, type, onClose }: { message: string; type: NotificationType; onClose: () => void }) {
  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  };

  const bgColors = {
    success: 'bg-[#00626f]',
    error: 'bg-[#ba1a1a]',
    warning: 'bg-[#ffdad6]',
    info: 'bg-[#005d90]',
  };

  return (
    <div className={`${bgColors[type]} flex items-center gap-3 rounded-lg px-5 py-4 text-sm font-medium text-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] animate-in slide-in-from-right-4 duration-300`}>
      {icons[type]}
      <span>{message}</span>
      <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/20 transition-colors ml-2">
        <X size={18} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed bottom-0 right-0 z-50 space-y-3 p-6">
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
