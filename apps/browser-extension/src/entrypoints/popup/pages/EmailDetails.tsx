import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import LoadingSpinner from '@/entrypoints/popup/components/LoadingSpinner';
import { useDb } from '@/entrypoints/popup/context/DbContext';
import { useHeaderButtons } from '@/entrypoints/popup/context/HeaderButtonsContext';
import { useLoading } from '@/entrypoints/popup/context/LoadingContext';
import { useWebApi } from '@/entrypoints/popup/context/WebApiContext';
import ConversionUtility from '@/entrypoints/popup/utils/ConversionUtility';

import type { EmailAttachment, Email } from '@/utils/dist/shared/models/webapi';
import EncryptionUtility from '@/utils/EncryptionUtility';

import { useMinDurationLoading } from '@/hooks/useMinDurationLoading';

import HeaderButton from '../components/HeaderButton';
import { HeaderIconType } from '../components/icons/HeaderIcons';

/**
 * Email details page.
 */
const EmailDetails: React.FC = (): React.ReactElement => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dbContext = useDb();
  const webApi = useWebApi();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useMinDurationLoading(true, 150);
  const { setIsInitialLoading } = useLoading();
  const { setHeaderButtons } = useHeaderButtons();
  const [headerButtonsConfigured, setHeaderButtonsConfigured] = useState(false);

  /**
   * Make sure the initial loading state is set to false when this component is loaded itself.
   */
  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoading(false);
    }
  }, [setIsInitialLoading, isLoading]);

  useEffect(() => {
    // For popup windows, ensure we have proper history state for navigation
    if (isPopup()) {
      // Clear existing history and create fresh entries
      window.history.replaceState({}, '', `popup.html#/emails`);
      window.history.pushState({}, '', `popup.html#/emails/${id}`);
    }

    /**
     * Load the email.
     */
    const loadEmail = async () : Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        if (!dbContext?.sqliteClient || !id) {
          return;
        }

        const response = await webApi.get<Email>(`Email/${id}`);

        // Decrypt email locally using public/private key pairs
        const encryptionKeys = dbContext.sqliteClient.getAllEncryptionKeys();
        const decryptedEmail = await EncryptionUtility.decryptEmail(response, encryptionKeys);
        setEmail(decryptedEmail);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadEmail();
  }, [id, dbContext?.sqliteClient, webApi, setIsLoading]);

  /**
   * Handle deleting an email.
   */
  const handleDelete = useCallback(async () : Promise<void> => {
    try {
      await webApi.delete(`Email/${id}`);
      if (isPopup()) {
        window.close();
      } else {
        navigate('/emails');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete email');
    }
  }, [id, webApi, navigate]);

  /**
   * Check if the current page is an expanded popup.
   */
  const isPopup = () : boolean => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('expanded') === 'true';
  };

  /**
   * Open the credential details in a new expanded popup.
   */
  const openInNewPopup = useCallback((): void => {
    const width = 800;
    const height = 1000;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      `popup.html?expanded=true#/emails/${id}`,
      'EmailDetails',
      `width=${width},height=${height},left=${left},top=${top},popup=true`
    );

    // Close the current tab
    window.close();
  }, [id]);

  /**
   * Handle downloading an attachment.
   */
  const handleDownloadAttachment = async (attachment: EmailAttachment): Promise<void> => {
    try {
      // Get the encrypted attachment bytes from the API
      const encryptedBytes = await webApi.downloadBlob(`Email/${id}/attachments/${attachment.id}`);

      if (!dbContext?.sqliteClient || !email) {
        setError('Database context or email not available');
        return;
      }

      // Get encryption keys for decryption
      const encryptionKeys = dbContext.sqliteClient.getAllEncryptionKeys();

      // Decrypt the attachment using raw bytes
      const decryptedBytes = await EncryptionUtility.decryptAttachment(encryptedBytes, email, encryptionKeys);

      if (!decryptedBytes) {
        setError('Failed to decrypt attachment');
        return;
      }

      // Create Blob directly from Uint8Array
      const blob = new Blob([new Uint8Array(decryptedBytes)], {
        type: attachment.mimeType ?? 'application/octet-stream'
      });

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('handleDownloadAttachment error', err);
      setError(err instanceof Error ? err.message : 'Failed to download attachment');
    }
  };

  // Set header buttons on mount and clear on unmount
  useEffect((): (() => void) => {
    // Only set the header buttons once on mount.
    if (!headerButtonsConfigured) {
      const headerButtonsJSX = (
        <div className="flex items-center gap-2">
          <HeaderButton
            onClick={openInNewPopup}
            title="Open in new window"
            iconType={HeaderIconType.EXPAND}
          />
          <HeaderButton
            onClick={handleDelete}
            title="Delete email"
            iconType={HeaderIconType.DELETE}
            variant="danger"
          />
        </div>
      );

      setHeaderButtons(headerButtonsJSX);
      setHeaderButtonsConfigured(true);
    }
    return () => {};
  }, [setHeaderButtons, headerButtonsConfigured, handleDelete, openInNewPopup]);

  // Clear header buttons on unmount
  useEffect((): (() => void) => {
    return () => setHeaderButtons(null);
  }, [setHeaderButtons]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!email) {
    return <div className="text-gray-500">Email not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{email.subject}</h1>
          </div>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <p>From: {email.fromDisplay} ({email.fromLocal}@{email.fromDomain})</p>
            <p>To: {email.toLocal}@{email.toDomain}</p>
            <p>Date: {new Date(email.dateSystem).toLocaleString()}</p>
          </div>
        </div>

        {/* Email Body */}
        <div className="bg-white">
          {email.messageHtml ? (
            <iframe
              srcDoc={ConversionUtility.convertAnchorTagsToOpenInNewTab(email.messageHtml)}
              className="w-full min-h-[500px] border-0"
              title="Email content"
            />
          ) : (
            <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {email.messagePlain}
            </pre>
          )}
        </div>

        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Attachments
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {email.attachments.map((attachment) => (
                <button
                  key={attachment.id}
                  onClick={() => handleDownloadAttachment(attachment)}
                  className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-left"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  <span>
                    {attachment.filename} ({Math.ceil(attachment.filesize / 1024)} KB)
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailDetails;