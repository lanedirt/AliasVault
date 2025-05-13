import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Credential } from '@/utils/types/Credential';
import SqliteClient from '@/utils/SqliteClient';

type CredentialCardProps = {
  credential: Credential;
};

/**
 * CredentialCard component
 *
 * This component displays a credential card with a service name, username, and email.
 * It allows the user to navigate to the credential details page when clicked.
 *
 */
const CredentialCard: React.FC<CredentialCardProps> = ({ credential }) => {
  const navigate = useNavigate();

  /**
   * Get the display text for the credential
   * @param cred - The credential to get the display text for
   * @returns The display text for the credential
   */
  const getDisplayText = (cred: Credential): string => {
    // Show username if available
    if (cred.Username) {
      return cred.Username;
    }

    // Show email if username is not available
    if (cred.Alias?.Email) {
      return cred.Alias.Email;
    }

    // Show empty string if neither username nor email is available
    return '';
  };

  return (
    <li>
      <button
        onClick={() => navigate(`/credentials/${credential.Id}`)}
        className="w-full p-2 border dark:border-gray-600 rounded flex items-center bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <img
          src={SqliteClient.imgSrcFromBytes(credential.Logo)}
          alt={credential.ServiceName}
          className="w-8 h-8 mr-2 flex-shrink-0"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/assets/images/service-placeholder.webp';
          }}
        />
        <div className="text-left">
          <p className="font-medium text-gray-900 dark:text-white">{credential.ServiceName}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{getDisplayText(credential)}</p>
        </div>
      </button>
    </li>
  );
};

export default CredentialCard;
