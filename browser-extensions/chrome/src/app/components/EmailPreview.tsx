import React, { useState, useEffect } from 'react';
import { useWebApi } from '../context/WebApiContext';
import { useDb } from '../context/DbContext';
import EncryptionUtility from '../../shared/EncryptionUtility';
import { Buffer } from 'buffer';
import { MailboxEmail } from '../../shared/types/webapi/MailboxEmail';
import { Link } from 'react-router-dom';

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
  const webApi = useWebApi();
  const dbContext = useDb();

  const isPublicDomain = async (emailAddress: string): Promise<boolean> => {
    // Get metadata from storage
    const storageResult = await chrome.storage.session.get(['publicEmailDomains']);
    return storageResult.publicEmailDomains.some(domain => emailAddress.toLowerCase().endsWith(domain));
  };

  useEffect(() => {
    /**
     * Loads the latest emails from the server and decrypts them locally if needed.
     */
    const loadEmails = async (): Promise<void> => {
      try {
        const isPublic = await isPublicDomain(email);
        setIsSpamOk(isPublic);

        if (isPublic) {
          // For public domains (SpamOK), use their API directly
          const emailPrefix = email.split('@')[0];
          const response = await fetch(`https://api.spamok.com/v2/EmailBox/${emailPrefix}`);
          const data = await response.json();

          // Only show the latest 2 emails to save space in UI
          const latestMails = data?.mails
            ?.sort((a: MailboxEmail, b: MailboxEmail) =>
              new Date(b.dateSystem).getTime() - new Date(a.dateSystem).getTime())
            ?.slice(0, 2) || [];

          if (loading && latestMails.length > 0) {
            setLastEmailId(latestMails[0].id);
          }

          setEmails(latestMails);
        } else {
          // For private domains, use existing encrypted email logic
          const response = await webApi.get(`EmailBox/${email}`);
          const data = response as { mails: MailboxEmail[] };

          // Only show the latest 2 emails to save space in UI
          const latestMails = data?.mails
            .sort((a, b) => new Date(b.dateSystem).getTime() - new Date(a.dateSystem).getTime())
            .slice(0, 2);

          if (latestMails) {
            // Loop through all emails and decrypt them locally
            const decryptedEmails: MailboxEmail[] = await Promise.all(
              latestMails.map(async (mail: MailboxEmail) => {
                try {
                  // Decrypt email locally using private key
                  const encryptionKeys = dbContext.sqliteClient!.getAllEncryptionKeys();
                  const encryptionKey = encryptionKeys.find(
                    key => key.PublicKey === mail.encryptionKey
                  );

                  if (!encryptionKey) {
                    throw new Error('Encryption key not found');
                  }

                  // Decrypt symmetric key with asymmetric private key
                  const symmetricKey = await EncryptionUtility.decryptWithPrivateKey(
                    mail.encryptedSymmetricKey,
                    encryptionKey.PrivateKey
                  );
                  const symmetricKeyBase64 = Buffer.from(symmetricKey).toString('base64');

                  // Create a new object to avoid mutating the original
                  const decryptedMail = { ...mail };

                  // Decrypt all email fields
                  decryptedMail.subject = await EncryptionUtility.symmetricDecrypt(
                    mail.subject,
                    symmetricKeyBase64
                  );
                  decryptedMail.fromDisplay = await EncryptionUtility.symmetricDecrypt(
                    mail.fromDisplay,
                    symmetricKeyBase64
                  );
                  decryptedMail.fromDomain = await EncryptionUtility.symmetricDecrypt(
                    mail.fromDomain,
                    symmetricKeyBase64
                  );
                  decryptedMail.fromLocal = await EncryptionUtility.symmetricDecrypt(
                    mail.fromLocal,
                    symmetricKeyBase64
                  );
                  decryptedMail.messagePreview = await EncryptionUtility.symmetricDecrypt(
                    mail.messagePreview,
                    symmetricKeyBase64
                  );

                  return decryptedMail;
                } catch (error) {
                  console.error('Error decrypting email:', error);
                  return mail; // Return original mail if decryption fails
                }
              })
            );

            if (loading && decryptedEmails.length > 0) {
              setLastEmailId(decryptedEmails[0].id);
            }

            setEmails(decryptedEmails);
          }
        }
      } catch (err) {
        console.error('Error loading emails:', err);
      }
      setLoading(false);
    };

    loadEmails();
    // Set up auto-refresh interval
    const interval = setInterval(loadEmails, 2000);
    return () : void => clearInterval(interval);
  }, [email, loading, webApi, dbContext]);

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
            className={`flex justify-between items-center p-2 rounded cursor-pointer block bg-white dark:bg-gray-800 shadow hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 ${
              mail.id > lastEmailId
                ? 'bg-yellow-50 dark:bg-yellow-900/30'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
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
            className={`flex justify-between items-center p-2 rounded cursor-pointer block bg-white dark:bg-gray-800 shadow hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 ${
              mail.id > lastEmailId
                ? 'bg-yellow-50 dark:bg-yellow-900/30'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
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
          </Link>
        )
      ))}
    </div>
  );
};