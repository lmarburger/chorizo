"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

/**
 * Reusable form input component with consistent styling
 */
interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function FormInput({ label, error, id, className = "", type, ...props }: FormInputProps) {
  const inputId = id || props.name;

  // Base styles for all inputs
  const baseStyles =
    "w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700";

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      {type === "date" ? (
        <div className="relative overflow-hidden rounded-lg">
          <input id={inputId} type={type} className={`${baseStyles} ${className}`} {...props} />
        </div>
      ) : (
        <input id={inputId} type={type} className={`${baseStyles} ${className}`} {...props} />
      )}
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

/**
 * Reusable textarea component with consistent styling
 */
interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function FormTextarea({ label, error, id, className = "", ...props }: FormTextareaProps) {
  const textareaId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

/**
 * Reusable select component with consistent styling
 */
interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function FormSelect({ label, error, options, id, className = "", ...props }: FormSelectProps) {
  const selectId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 ${className}`}
        {...props}>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

/**
 * Reusable submit button with loading state
 */
interface FormButtonProps {
  type?: "submit" | "button" | "reset";
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
}

export function FormButton({
  type = "button",
  loading = false,
  disabled = false,
  children,
  onClick,
  variant = "primary",
  className = "",
}: FormButtonProps) {
  const baseClasses =
    "rounded-lg px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    primary:
      "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500 disabled:bg-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-blue-800",
    secondary:
      "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:disabled:bg-gray-800",
    danger:
      "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 disabled:bg-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:disabled:bg-red-800",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Form field wrapper with consistent spacing
 */
interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export function FormField({ children, className = "" }: FormFieldProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

/**
 * Form error message component
 */
interface FormErrorProps {
  message?: string | null;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <div className="mb-4 rounded-lg border-2 border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
      {message}
    </div>
  );
}

/**
 * Form success message component
 */
interface FormSuccessProps {
  message?: string | null;
}

export function FormSuccess({ message }: FormSuccessProps) {
  if (!message) return null;

  return (
    <div className="mb-4 rounded-lg border-2 border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-200">
      {message}
    </div>
  );
}
