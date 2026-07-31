import { type ReactNode, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none";

  const variants: Record<string, string> = {
    primary:
      "bg-forest-600 text-white shadow-md hover:bg-forest-700 hover:shadow-lg",
    secondary:
      "bg-forest-100 text-forest-700 hover:bg-forest-200",
    outline:
      "border-2 border-forest-600 text-forest-700 hover:bg-forest-50",
    danger:
      "bg-red-500 text-white shadow-md hover:bg-red-600",
    ghost:
      "text-forest-700 hover:bg-forest-50",
  };

  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base",
  };

  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
