import React, { forwardRef } from 'react';

/**
 * Form input props.
 */
type FormInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'password';
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  error?: string;
}

/**
 * Form input component.
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  multiline = false,
  rows = 1,
  error
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const inputClasses = `mt-1 block w-full rounded-md ${
    error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
  } text-gray-900 sm:text-sm rounded-lg shadow-sm border focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 p-3`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {multiline ? (
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            className={inputClasses}
          />
        ) : (
          <input
            ref={ref}
            type={type === 'password' && !showPassword ? 'password' : 'text'}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={inputClasses}
          />
        )}
        {type === 'password' && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';