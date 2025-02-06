import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDb } from '../context/DbContext';
import { Credential } from '../../shared/types/Credential';
import { Buffer } from 'buffer';
import { FormInputCopyToClipboard } from '../components/FormInputCopyToClipboard';

/**
 * Credential details page.
 */
const CredentialDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dbContext = useDb();
  const [credential, setCredential] = useState<Credential | null>(null);

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
    const width = 380;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      `index.html?popup=true#/credentials/${id}`,
      'CredentialDetails',
      `width=${width},height=${height},left=${left},top=${top},popup=true`
    );

    // Close the current tab
    window.close();
  };

  useEffect(() => {
    // For popup windows, ensure we have proper history state for navigation
    if (isPopup()) {
      // Clear existing history and create fresh entries
      window.history.replaceState({}, '', `index.html#/credentials`);
      window.history.pushState({}, '', `index.html#/credentials/${id}`);
    }

    if (!dbContext?.sqliteClient || !id) return;

    try {
      const result = dbContext.sqliteClient.getCredentialById(id);
      if (result) {
        setCredential(result);
      } else {
        console.error('Credential not found');
        navigate('/credentials');
      }
    } catch (err) {
      console.error('Error loading credential:', err);
    }
  }, [dbContext.sqliteClient, id, navigate]);

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
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm13 0a1 1 0 00-1-1h-4a1 1 0 100 2h1.586l-2.293 2.293a1 1 0 001.414 1.414L14 6.414V8a1 1 0 102 0V4zM3 16a1 1 0 001 1h4a1 1 0 100-2H6.414l2.293-2.293a1 1 0 00-1.414-1.414L5 13.586V12a1 1 0 10-2 0v4zm13 0a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L14 13.586V12a1 1 0 112 0v4z" />
            </svg>
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Login credentials</h2>
            <FormInputCopyToClipboard
              id="email"
              label="Email"
              value={credential.Email || ''}
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
          </div>

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
          <div className="space-y-4">
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