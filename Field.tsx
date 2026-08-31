import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

interface FieldWrapperProps {
  label: string;
  required?: boolean;
  error?: string | null;
  children: ReactNode;
  hint?: string;
}

export function FieldWrapper({ label, required, error, children, hint }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

const inputBase =
  'w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-sky-600 transition';

export function Input({ error, className = '', ...rest }: InputHTMLAttributes<HTMLInputElement> & { error?: string | null }) {
  return (
    <input
      className={`${inputBase} ${error ? 'ring-red-400 focus:ring-red-500' : ''} ${className}`}
      {...rest}
    />
  );
}

export function Select({
  error,
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { error?: string | null }) {
  return (
    <select
      className={`${inputBase} ${error ? 'ring-red-400 focus:ring-red-500' : ''} ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Textarea({
  error,
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string | null }) {
  return (
    <textarea
      className={`${inputBase} ${error ? 'ring-red-400 focus:ring-red-500' : ''} ${className}`}
      {...rest}
    />
  );
}
