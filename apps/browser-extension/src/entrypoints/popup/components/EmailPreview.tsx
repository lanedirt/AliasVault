import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useDb } from '@/entrypoints/popup/context/DbContext';
import { useWebApi } from '@/entrypoints/popup/context/WebApiContext';

import { AppInfo } from '@/utils/AppInfo';
import type { ApiErrorResponse, MailboxEmail } from '@/utils/dist/shared/models/webapi';
import { EncryptionUtility } from '@/utils/EncryptionUtility';

import { storage } from '#imports';

type EmailPreviewProps = {
  email: string;
}

/**
 * This component shows a preview of the latest emails in the inbox.
 */
export const EmailPreview: React.FC<EmailPreviewProps> = ({ email }) => {
  const [emails, setEmails] = useState<MailboxEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastEmailId, setLastEmailId] = useState<number>(0);
  const [isSpamOk, setIsSpamOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webApi = useWebApi();
  const dbContext = useDb();

  /**
   * Checks if the email is a public domain.
   */
  const isPublicDomain = async (emailAddress: string): Promise<boolean> => {
    // Get metadata from storage
    const publicEmailDomains = await storage.getItem('session:publicEmailDomains') as string[] ?? [];
    return publicEmailDomains.some(domain => emailAddress.toLowerCase().endsWith(domain));
  };

  useEffect(() => {
    /**
     * Loads the latest emails from the server and decrypts them locally if needed.
     */
    const loadEmails = async (): Promise<void> => {
      try {
        setError(null);
        const isPublic = await isPublicDomain(email);
        setIsSpamOk(isPublic);

        if (isPublic) {
          // For public domains (SpamOK), use the SpamOK API directly
          const emailPrefix = email.split('@')[0];
          const response = await fetch(`https://api.spamok.com/v2/EmailBox/${emailPrefix}`, {
            headers: {
              'X-Asdasd-Platform-Id': 'av-chrome',
              'X-Asdasd-Platform-Version': AppInfo.VERSION,
            }
          });

          if (!response.ok) {
            setError('An error occurred while loading emails. Please try again later.');
            return;
          }

          const data = await response.json();

          // Only show the latest 2 emails to save space in UI
          const latestMails = data?.mails
            ?.toSorted((a: MailboxEmail, b: MailboxEmail) =>
              new Date(b.dateSystem).getTime() - new Date(a.dateSystem).getTime())
            ?.slice(0, 2) ?? [];

          if (loading && latestMails.length > 0) {
            setLastEmailId(latestMails[0].id);
          }

          setEmails(latestMails);
        } else {
          // For private domains, use existing encrypted email logic
          try {
            /**
             * We use authFetch here because we don't want to the inner method to throw an error if HTTP status is not 200.
             * Instead we want to catch the error ourselves.
             */
            const response = await webApi.authFetch(`EmailBox/${email}`, { method: 'GET' }, true, false);
            try {
              const data = response as { mails: MailboxEmail[] };

              // Only show the latest 2 emails to save space in UI
              const latestMails = data.mails
                .toSorted((a, b) => new Date(b.dateSystem).getTime() - new Date(a.dateSystem).getTime())
                .slice(0, 2);

              if (latestMails) {
                // Loop through all emails and decrypt them locally
                const decryptedEmails: MailboxEmail[] = await EncryptionUtility.decryptEmailList(
                  latestMails,
                  dbContext.sqliteClient!.getAllEncryptionKeys()
                );

                if (loading && decryptedEmails.length > 0) {
                  setLastEmailId(decryptedEmails[0].id);
                }

                setEmails(decryptedEmails);
              }
            } catch {
              // Try to parse as error response instead
              const apiErrorResponse = response as ApiErrorResponse;

              if (apiErrorResponse?.code === 'CLAIM_DOES_NOT_MATCH_USER') {
                setError('The current chosen email address is already in use. Please change the email address by editing this credential.');
              } else if (apiErrorResponse?.code === 'CLAIM_DOES_NOT_EXIST') {
                setError('An error occurred while trying to load the emails. Please try to edit and save the credential entry to synchronize the database, then try again.');
              } else {
                setError('An error occurred while loading emails. Please try again later.');
              }

              return;
            }
          } catch {
            setError('An error occurred while loading emails. Please try again later.');
            return;
          }
        }
      } catch (err) {
        console.error('Error loading emails:', err);
        setError('An unexpected error occurred while loading emails. Please try again later.');
      }
      setLoading(false);
    };

    loadEmails();
    // Set up auto-refresh interval
    const interval = setInterval(loadEmails, 2000);
    return () : void => clearInterval(interval);
  }, [email, loading, webApi, dbContext]);

  if (error) {
    return (
      <div className="text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent emails</h2>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent emails</h2>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        Loading emails...
      </div>
    );
  }
  if (emails.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent emails</h2>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        No emails received yet.
      </div>
    );
  }

  return (
    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent emails</h2>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      </div>

      {emails.map((mail) => (
        isSpamOk ? (
          <a
            key={mail.id}
            href={`https://spamok.com/${email.split('@')[0]}/${mail.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex justify-between items-center p-2 ps-3 pe-3 rounded cursor-pointer bg-white dark:bg-gray-800 shadow hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
              mail.id > lastEmailId ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''
            }`}
          >
            <div className="truncate flex-1">
              <span className="text-sm text-gray-900 dark:text-white">
                {mail.subject.substring(0, 30)}{mail.subject.length > 30 ? '...' : ''}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {new Date(mail.dateSystem).toLocaleDateString()}
            </div>
          </a>
        ) : (
          <Link
            key={mail.id}
            to={`/emails/${mail.id}`}
            className={`flex justify-between items-center p-2 ps-3 pe-3 rounded cursor-pointer bg-white dark:bg-gray-800 shadow hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
              mail.id > lastEmailId ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''
            }`}
          >
            <span className="truncate flex-1">
              <span className="text-sm text-gray-900 dark:text-white">
                {mail.subject.substring(0, 30)}{mail.subject.length > 30 ? '...' : ''}
              </span>
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {new Date(mail.dateSystem).toLocaleDateString()}
            </span>
          </Link>
        )
      ))}
    </div>
  );
};