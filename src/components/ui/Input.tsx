import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-forest-800 mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none placeholder:text-gray-400 ${
          error
            ? "border-red-400 focus:border-red-500"
            : "border-gray-200 focus:border-forest-500"
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
