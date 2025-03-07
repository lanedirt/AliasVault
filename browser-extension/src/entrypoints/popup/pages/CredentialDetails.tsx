import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDb } from '../context/DbContext';
import { Credential } from '../../../utils/types/Credential';
import { Buffer } from 'buffer';
import { FormInputCopyToClipboard } from '../components/FormInputCopyToClipboard';
import { EmailPreview } from '../components/EmailPreview';
import { useLoading } from '../context/LoadingContext';

/**
 * Credential details page.
 */
const CredentialDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dbContext = useDb();
  const [credential, setCredential] = useState<Credential | null>(null);
  const { setIsInitialLoading } = useLoading();

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
  const openInNewPopup = () : void => {
    const width = 380;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      `popup.html?expanded=true#/credentials/${id}`,
      'CredentialDetails',
      `width=${width},height=${height},left=${left},top=${top},popup=true`
    );

    // Close the current tab
    window.close();
  };

  /**
   * Checks if the email domain is supported for email preview.
   *
   * @param email The email address to check
   * @returns True if the domain is supported, false otherwise
   */
  const isEmailDomainSupported = (email: string): boolean => {
    // Extract domain from email
    const domain = email.split('@')[1]?.toLowerCase();

    if (!domain) {
      return false;
    }

    // Check if domain is in public or private domains
    const publicDomains = dbContext.publicEmailDomains ?? [];
    const privateDomains = dbContext.privateEmailDomains ?? [];

    // Check if the domain ends with any of the supported domains
    return [...publicDomains, ...privateDomains].some(supportedDomain =>
      domain === supportedDomain || domain.endsWith(`.${supportedDomain}`)
    );
  };

  useEffect(() => {
    // For popup windows, ensure we have proper history state for navigation
    if (isPopup()) {
      // Clear existing history and create fresh entries
      window.history.replaceState({}, '', `popup.html#/credentials`);
      window.history.pushState({}, '', `popup.html#/credentials/${id}`);
    }

    if (!dbContext?.sqliteClient || !id) {
      return;
    }

    try {
      const result = dbContext.sqliteClient.getCredentialById(id);
      if (result) {
        setCredential(result);
        setIsInitialLoading(false);
      } else {
        console.error('Credential not found');
        navigate('/credentials');
      }
    } catch (err) {
      console.error('Error loading credential:', err);
    }
  }, [dbContext.sqliteClient, id, navigate, setIsInitialLoading]);

  if (!credential) {
    return <div>Loading...</div>;
  }

  return (
    <div className="">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <img
              src={credential.Logo ? `data:image/x-icon;base64,${Buffer.from(credential.Logo).toString('base64')}` : '/assets/images/service-placeholder.webp'}
              alt={credential.ServiceName}
              className="w-12 h-12 rounded-lg mr-4"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{credential.ServiceName}</h1>
              {credential.ServiceUrl && (
                <a
                  href={credential.ServiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {credential.ServiceUrl}
                </a>
              )}
            </div>
          </div>
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
        </div>

        {credential.Email && (
          <>
            {isEmailDomainSupported(credential.Email) && (
              <div className="mt-6">
                <EmailPreview
                  email={credential.Email}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid gap-6">
        <div className="space-y-4 lg:col-span-2 xl:col-span-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Login credentials</h2>
          <FormInputCopyToClipboard
            id="email"
            label="Email"
            value={credential.Email ?? ''}
          />
          <FormInputCopyToClipboard
            id="username"
            label="Username"
            value={credential.Username}
          />
          <FormInputCopyToClipboard
            id="password"
            label="Password"
            value={credential.Password}
            type="password"
          />

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Alias</h2>
            <FormInputCopyToClipboard
              id="fullName"
              label="Full Name"
              value={`${credential.Alias.FirstName} ${credential.Alias.LastName}`}
            />
            <FormInputCopyToClipboard
              id="firstName"
              label="First Name"
              value={credential.Alias.FirstName}
            />
            <FormInputCopyToClipboard
              id="lastName"
              label="Last Name"
              value={credential.Alias.LastName}
            />
            <FormInputCopyToClipboard
              id="birthDate"
              label="Birth Date"
              value={credential.Alias.BirthDate ? new Date(credential.Alias.BirthDate).toISOString().split('T')[0] : ''}
            />
            {credential.Alias.NickName && (
              <FormInputCopyToClipboard
                id="nickName"
                label="Nickname"
                value={credential.Alias.NickName}
              />
            )}
          </div>
        </div>

        {credential.Notes && (
          <div className="space-y-4 lg:col-span-2 xl:col-span-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notes</h2>
            <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                {credential.Notes}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CredentialDetails;