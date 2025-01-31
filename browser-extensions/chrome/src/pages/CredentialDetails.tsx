import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDb } from '../context/DbContext';
import { Credential } from '../types/Credential';
import { Buffer } from 'buffer';
import { FormInputCopyToClipboard } from '../components/FormInputCopyToClipboard';

const CredentialDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dbContext = useDb();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!dbContext?.sqliteClient || !id) return;

    try {
      const result = dbContext.sqliteClient.getAllCredentials();
      // TODO: create a SQLite function to get a credential by id.
      const credential = result.find(cred => cred.Id === id);
      if (credential) {
        setCredential(credential);
      } else {
        navigate('/credentials');
      }
    } catch (err) {
      console.error('Error loading credential:', err);
    }
  }, [dbContext.sqliteClient, id]);

  if (!credential) {
    return <div>Loading...</div>;
  }

  return (
    <div className="">
      <div className="space-y-6">
        <div className="flex items-center mb-6">
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

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
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
        </div>
      </div>
    </div>
  );
};

export default CredentialDetails;