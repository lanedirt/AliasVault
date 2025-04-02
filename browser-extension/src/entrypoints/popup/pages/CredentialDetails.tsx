import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDb } from '../context/DbContext';
import { Credential } from '../../../utils/types/Credential';
import { FormInputCopyToClipboard } from '../components/FormInputCopyToClipboard';
import { EmailPreview } from '../components/EmailPreview';
import { TotpViewer } from '../components/TotpViewer';
import { useLoading } from '../context/LoadingContext';
import SqliteClient from '../../../utils/SqliteClient';

type BlockProps = {
  children: React.ReactNode;
  className?: string;
}

/**
 * Render a block.
 */
const Block: React.FC<BlockProps> = ({ children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {children}
  </div>
);

/**
 * Render the header block.
 */
const HeaderBlock: React.FC<{ credential: Credential; onOpenNewPopup: () => void }> = ({ credential, onOpenNewPopup }) => (
  <Block className="mb-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <img
          src={SqliteClient.imgSrcFromBytes(credential.Logo)}
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
        onClick={onOpenNewPopup}
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
  </Block>
);

/**
 * Render the email block.
 */
const EmailBlock: React.FC<{ email: string; isSupported: boolean }> = ({ email, isSupported }) => (
  <Block>
    {isSupported && <EmailPreview email={email} />}
  </Block>
);

/**
 * Render the TOTP viewer block.
 */
const TotpBlock: React.FC<{ credentialId: string }> = ({ credentialId }) => (
  <Block>
    <TotpViewer credentialId={credentialId} />
  </Block>
);

/**
 * Render the login credentials block.
 */
const LoginCredentialsBlock: React.FC<{ credential: Credential }> = ({ credential }) => {
  const email = credential.Alias?.Email?.trim();
  const username = credential.Username?.trim();
  const password = credential.Password?.trim();

  if (!email && !username && !password) {
    return null;
  }

  return (
    <Block>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Login credentials</h2>
      {email && (
        <FormInputCopyToClipboard
          id="email"
          label="Email"
          value={email}
        />
      )}
      {username && (
        <FormInputCopyToClipboard
          id="username"
          label="Username"
          value={username}
        />
      )}
      {password && (
        <FormInputCopyToClipboard
          id="password"
          label="Password"
          value={password}
          type="password"
        />
      )}
    </Block>
  );
};

/**
 * Render the alias block.
 */
const AliasBlock: React.FC<{ credential: Credential; isValidDate: (date: string | null | undefined) => boolean }> = ({ 
  credential, 
  isValidDate 
}) => {
  const hasFirstName = Boolean(credential.Alias?.FirstName?.trim());
  const hasLastName = Boolean(credential.Alias?.LastName?.trim());
  const hasNickName = Boolean(credential.Alias?.NickName?.trim());
  const hasBirthDate = isValidDate(credential.Alias?.BirthDate);

  if (!hasFirstName && !hasLastName && !hasNickName && !hasBirthDate) {
    return null;
  }

  return (
    <Block>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Alias</h2>
      {(hasFirstName || hasLastName) && (
        <FormInputCopyToClipboard
          id="fullName"
          label="Full Name"
          value={[credential.Alias?.FirstName, credential.Alias?.LastName].filter(Boolean).join(' ')}
        />
      )}
      {hasFirstName && (
        <FormInputCopyToClipboard
          id="firstName"
          label="First Name"
          value={credential.Alias?.FirstName}
        />
      )}
      {hasLastName && (
        <FormInputCopyToClipboard
          id="lastName"
          label="Last Name"
          value={credential.Alias?.LastName}
        />
      )}
      {hasBirthDate && (
        <FormInputCopyToClipboard
          id="birthDate"
          label="Birth Date"
          value={new Date(credential.Alias?.BirthDate).toISOString().split('T')[0]}
        />
      )}
      {hasNickName && (
        <FormInputCopyToClipboard
          id="nickName"
          label="Nickname"
          value={credential.Alias?.NickName ?? ''}
        />
      )}
    </Block>
  );
};

/**
 * Render the notes block.
 */
const NotesBlock: React.FC<{ notes: string | undefined }> = ({ notes }) => {
  if (!notes) {
    return null;
  }

  return (
    <Block>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notes</h2>
      <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
          {notes}
        </p>
      </div>
    </Block>
  );
};

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
  const isPopup = (): boolean => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('expanded') === 'true';
  };

  /**
   * Open the credential details in a new expanded popup.
   */
  const openInNewPopup = (): void => {
    const width = 380;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      `popup.html?expanded=true#/credentials/${id}`,
      'CredentialDetails',
      `width=${width},height=${height},left=${left},top=${top},popup=true`
    );

    window.close();
  };

  /**
   * Check if the email domain is supported.
   */
  const isEmailDomainSupported = (email: string): boolean => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return false;
    }

    const publicDomains = dbContext.publicEmailDomains ?? [];
    const privateDomains = dbContext.privateEmailDomains ?? [];

    return [...publicDomains, ...privateDomains].some(supportedDomain =>
      domain === supportedDomain || domain.endsWith(`.${supportedDomain}`)
    );
  };

  /**
   * Check if a date is valid.
   */
  const isValidDate = useCallback((date: string | null | undefined): boolean => {
    if (!date || date === '0001-01-01 00:00:00') {
      return false;
    }
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  }, []);

  useEffect(() => {
    if (isPopup()) {
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
    <div className="space-y-6">
      <HeaderBlock credential={credential} onOpenNewPopup={openInNewPopup} />
      
      {credential.Alias?.Email && (
        <EmailBlock 
          email={credential.Alias.Email} 
          isSupported={isEmailDomainSupported(credential.Alias.Email)} 
        />
      )}
      
      <TotpBlock credentialId={credential.Id} />
      
      <LoginCredentialsBlock credential={credential} />
      
      <AliasBlock 
        credential={credential} 
        isValidDate={isValidDate} 
      />
      
      <NotesBlock notes={credential.Notes} />
    </div>
  );
};

export default CredentialDetails;