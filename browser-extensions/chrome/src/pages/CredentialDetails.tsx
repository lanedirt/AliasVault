import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDb } from '../context/DbContext';
import { Credential } from '../types/Credential';
import { Buffer } from 'buffer';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{credential.ServiceName}</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
              <input
                type="email"
                readOnly
                value={credential.Email || ''}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
              <input
                type="text"
                readOnly
                value={credential.Username}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  readOnly
                  value={credential.Password}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-200"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Service URL</label>
              <input
                type="text"
                readOnly
                value={credential.ServiceUrl || ''}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
              <textarea
                readOnly
                value={credential.Notes || ''}
                rows={3}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialDetails;