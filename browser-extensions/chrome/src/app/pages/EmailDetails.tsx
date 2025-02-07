import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Email } from '../../shared/types/webapi/Email';
import { useDb } from '../context/DbContext';
import { useWebApi } from '../context/WebApiContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { useMinDurationLoading } from '../hooks/useMinDurationLoading';
import EncryptionUtility from '../../shared/EncryptionUtility';
import { Buffer } from 'buffer';

/**
 * Email details page.
 */
const EmailDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dbContext = useDb();
  const webApi = useWebApi();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useMinDurationLoading(true, 150);

  useEffect(() => {
    // For popup windows, ensure we have proper history state for navigation
    if (isPopup()) {
      // Clear existing history and create fresh entries
      window.history.replaceState({}, '', `index.html#/emails`);
      window.history.pushState({}, '', `index.html#/emails/${id}`);
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

        // Decrypt email locally using private key
        const encryptionKeys = dbContext.sqliteClient.getAllEncryptionKeys();
        const encrytionKey = encryptionKeys.find(key => key.PublicKey === response.encryptionKey);

        if (!encrytionKey) {
          throw new Error('Encryption key not found');
        }

        // Decrypt symmetric key with assymetric private key
        const symmetricKey = await EncryptionUtility.decryptWithPrivateKey(
          response.encryptedSymmetricKey,
          encrytionKey.PrivateKey
        );
        const symmetricKeyBase64 = Buffer.from(symmetricKey).toString('base64');

        // Decrypt all email fields
        response.subject = await EncryptionUtility.symmetricDecrypt(response.subject, symmetricKeyBase64);
        response.fromDisplay = await EncryptionUtility.symmetricDecrypt(response.fromDisplay, symmetricKeyBase64);
        response.fromDomain = await EncryptionUtility.symmetricDecrypt(response.fromDomain, symmetricKeyBase64);
        response.fromLocal = await EncryptionUtility.symmetricDecrypt(response.fromLocal, symmetricKeyBase64);

        if (response.messageHtml) {
          response.messageHtml = await EncryptionUtility.symmetricDecrypt(response.messageHtml, symmetricKeyBase64);
        }
        if (response.messagePlain) {
          response.messagePlain = await EncryptionUtility.symmetricDecrypt(response.messagePlain, symmetricKeyBase64);
        }

        setEmail(response);
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
  const handleDelete = async () : Promise<void> => {
    try {
      await webApi.delete(`Email/${id}`);
      navigate('/emails');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete email');
    }
  };

  /**
   * Check if the current page is a popup.
   */
  const isPopup = () : boolean => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('popup') === 'true';
  };

  /**
   * Open the credential details in a new popup.
   */
  const openInNewPopup = () : void => {
    const width = 800;
    const height = 1000;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      `index.html?popup=true#/emails/${id}`,
      'EmailDetails',
      `width=${width},height=${height},left=${left},top=${top},popup=true`
    );

    // Close the current tab
    window.close();
  };

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
            <div className="flex space-x-2">
              <button
                onClick={openInNewPopup}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                title="Open in new window"
              >
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-500 hover:text-red-600 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20"
                title="Delete email"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <p>From: {email.fromDisplay} ({email.fromLocal}@{email.fromDomain})</p>
            <p>To: {email.toLocal}@{email.toDomain}</p>
            <p>Date: {new Date(email.dateSystem).toLocaleString()}</p>
          </div>
        </div>

        {/* Email Body */}
        <div className="p-6">
          {email.messageHtml ? (
            <iframe
              srcDoc={email.messageHtml}
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
                <div
                  key={attachment.id}
                  className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400"
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailDetails;