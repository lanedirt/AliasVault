import React, { useState, useEffect } from 'react';
import { ClipboardCopyService } from '@/entrypoints/popup/utils/ClipboardCopyService';

/**
 * Form input copy to clipboard props.
 */
type FormInputCopyToClipboardProps = {
  id: string;
  label: string;
  value: string;
  type?: 'text' | 'password';
}

const clipboardService = new ClipboardCopyService();

/**
 * Form input copy to clipboard component.
 */
export const FormInputCopyToClipboard: React.FC<FormInputCopyToClipboardProps> = ({
  id,
  label,
  value,
  type = 'text'
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = clipboardService.subscribe((copiedId) : void => {
      setCopied(copiedId === id);
    });
    return () : void => {
      unsubscribe();
    };
  }, [id]);

  /**
   * Copy to clipboard.
   */
  const copyToClipboard = async () : Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      clipboardService.setCopied(id);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        if (clipboardService.getCopiedId() === id) {
          clipboardService.setCopied('');
        }
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        <input
          type={type === 'password' && !showPassword ? 'password' : 'text'}
          id={id}
          readOnly
          value={value}
          onClick={copyToClipboard}
          className={`w-full px-3 py-2.5 bg-white border ${
            copied ? 'border-green-500 border-2' : 'border-gray-300'
          } text-gray-900 sm:text-sm rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {copied && (
            <span className="text-green-500 dark:text-green-400">
              Copied!
            </span>
          )}
          {type === 'password' && (
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-200"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};