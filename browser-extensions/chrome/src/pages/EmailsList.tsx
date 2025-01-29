import React, { useEffect, useState, useCallback } from 'react';
import { MailboxBulkResponse, MailboxEmailApiModel } from '../models/email';
import { useDb } from '../context/DbContext';
import { useWebApi } from '../context/WebApiContext';
import { MailboxBulkRequest } from '../types/webapi/MailboxBulk';
import LoadingSpinner from '../components/LoadingSpinner';
import React from 'react';
import { useMinDurationLoading } from '../hooks/useMinDurationLoading';

/**
 * Emails list page.
 */
const EmailsList: React.FC = () => {
  const dbContext = useDb();
  const webApi = useWebApi();
  const [error, setError] = useState<string | null>(null);
  const [emails, setEmails] = useState<MailboxEmailApiModel[]>([]);
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
        });

        setEmails(data.mails);
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
  }, [currentPage, dbContext?.sqliteClient, pageSize, webApi]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

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
      <h2 className="text-gray-900 dark:text-white text-xl mb-4">Emails</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                From
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800">
            {emails.map((email) => (
              <tr key={email.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                  {email.subject}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {email.fromDisplay}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {new Date(email.dateSystem).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmailsList;
