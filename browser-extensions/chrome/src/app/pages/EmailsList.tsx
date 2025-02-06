import React, { useEffect, useState, useCallback } from 'react';
import { MailboxBulkRequest, MailboxBulkResponse } from '../../shared/types/webapi/MailboxBulk';
import { MailboxEmail } from '../../shared/types/webapi/MailboxEmail';
import { useDb } from '../context/DbContext';
import { useWebApi } from '../context/WebApiContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { useMinDurationLoading } from '../hooks/useMinDurationLoading';
import EncryptionUtility from '../../shared/EncryptionUtility';
import { Buffer } from 'buffer';
import ReloadButton from '../components/ReloadButton';
import { Link } from 'react-router-dom';
/**
 * Emails list page.
 */
const EmailsList: React.FC = () => {
  const dbContext = useDb();
  const webApi = useWebApi();
  const [error, setError] = useState<string | null>(null);
  const [emails, setEmails] = useState<MailboxEmail[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);

  /**
   * Loading state with minimum duration for more fluid UX.
   */
  const [isLoading, setIsLoading] = useMinDurationLoading(true, 150);

  /**
   * Loads emails from the web API.
   */
  const loadEmails = useCallback(async () : Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!dbContext?.sqliteClient) {
        return;
      }

      // TODO: create separate query to only get email addresses to avoid loading all credentials.
      const credentials = dbContext.sqliteClient.getAllCredentials();

      // Get unique email addresses from all credentials.
      const emailAddresses = credentials
        .map(cred => cred.Email.trim()) // Trim whitespace
        .filter((email, index, self) => self.indexOf(email) === index);

      try {
        const data = await webApi.post<MailboxBulkRequest, MailboxBulkResponse>('EmailBox/bulk', {
          addresses: emailAddresses,
          page: currentPage,
          pageSize: pageSize,
        }) as MailboxBulkResponse;

        // Decrypt emails locally using private key associated with the email address.
        const encryptionKeys = dbContext.sqliteClient.getAllEncryptionKeys();

        const decryptedEmails = await Promise.all(data.mails.map(async email => {
          const encrytionKey = encryptionKeys.find(key => key.PublicKey === email.encryptionKey);
          if (!encrytionKey) {
            throw new Error(`Encryption key not found for email: ${email.fromDisplay}`);
          }

          // Decrypt symmetric key with assymetric private key.
          const symmetricKey = await EncryptionUtility.decryptWithPrivateKey(email.encryptedSymmetricKey, encrytionKey.PrivateKey);
          const symmetricKeyBase64 = Buffer.from(symmetricKey).toString('base64');

          // Decrypt email with decrypted symmetric key.
          email.subject = await EncryptionUtility.symmetricDecrypt(email.subject, symmetricKeyBase64);
          email.fromDisplay = await EncryptionUtility.symmetricDecrypt(email.fromDisplay, symmetricKeyBase64);
          email.fromDomain = await EncryptionUtility.symmetricDecrypt(email.fromDomain, symmetricKeyBase64);
          email.fromLocal = await EncryptionUtility.symmetricDecrypt(email.fromLocal, symmetricKeyBase64);
          email.messagePreview = await EncryptionUtility.symmetricDecrypt(email.messagePreview, symmetricKeyBase64);
          return email;
        }));

        setEmails(decryptedEmails);
        setTotalRecords(data.totalRecords);
      } catch (error) {
        console.error(error);
        throw new Error('Failed to load emails');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, dbContext?.sqliteClient, pageSize, webApi, setIsLoading]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  /**
   * Formats the date display for emails
   */
  const formatEmailDate = (dateSystem: string): string => {
    const now = new Date();
    const emailDate = new Date(dateSystem);
    const secondsAgo = Math.floor((now.getTime() - emailDate.getTime()) / 1000);

    if (secondsAgo < 60) {
      return 'just now';
    } else if (secondsAgo < 3600) {
      // Less than 1 hour ago
      const minutes = Math.floor(secondsAgo / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (secondsAgo < 86400) {
      // Less than 24 hours ago
      const hours = Math.floor(secondsAgo / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (secondsAgo < 172800) {
      // Less than 48 hours ago
      return 'yesterday';
    } else {
      // Older than 48 hours
      return emailDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit'
      });
    }
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

  if (emails.length === 0) {
    return (
      <div>
        <h2 className="text-gray-900 dark:text-white text-xl mb-4">Emails</h2>
        <p className="text-gray-500 dark:text-gray-400">No emails found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-gray-900 dark:text-white text-xl mb-4">Emails</h2>
        <ReloadButton onClick={loadEmails} />
      </div>
      <div className="space-y-2">
        {emails.map((email) => (
          <Link
            key={email.id}
            to={`/emails/${email.id}`}
            className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {email.fromDisplay}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatEmailDate(email.dateSystem)}
              </div>
            </div>
            <div className="text-sm text-gray-900 dark:text-white mb-1 font-bold">
              {email.subject}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {email.messagePreview}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EmailsList;
