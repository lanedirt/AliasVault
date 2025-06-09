import { yupResolver } from '@hookform/resolvers/yup';
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import * as Yup from 'yup';

import { FormInput } from '@/entrypoints/popup/components/FormInput';
import HeaderButton from '@/entrypoints/popup/components/HeaderButton';
import { HeaderIconType } from '@/entrypoints/popup/components/icons/HeaderIcons';
import { useDb } from '@/entrypoints/popup/context/DbContext';
import { useHeaderButtons } from '@/entrypoints/popup/context/HeaderButtonsContext';
import { useVaultMutate } from '@/entrypoints/popup/hooks/useVaultMutate';

import { IdentityHelperUtils } from '@/utils/shared/identity-generator';
import type { Credential } from '@/utils/shared/models/vault';

import LoadingSpinner from '../components/LoadingSpinner';
import { useLoading } from '../context/LoadingContext';

type CredentialMode = 'random' | 'manual';

/**
 * Validation schema for the credential form.
 */
const credentialSchema = Yup.object().shape({
  Id: Yup.string().optional(),
  ServiceName: Yup.string().required('Service name is required'),
  ServiceUrl: Yup.string().url('Invalid URL format').nullable().notRequired(),
  Alias: Yup.object().shape({
    FirstName: Yup.string().nullable().notRequired(),
    LastName: Yup.string().nullable().notRequired(),
    NickName: Yup.string().nullable().notRequired(),
    BirthDate: Yup.string()
      .nullable()
      .notRequired()
      .test(
        'is-valid-date-format',
        'Date must be in YYYY-MM-DD format',
        value => {
          if (!value) {
            return true;
          } // allow empty
          return /^\d{4}-\d{2}-\d{2}$/.test(value);
        },
      ),
    Gender: Yup.string().nullable().notRequired(),
    Email: Yup.string().email('Invalid email format').nullable().notRequired()
  }),
  Username: Yup.string().nullable().notRequired(),
  Password: Yup.string().nullable().notRequired(),
  Notes: Yup.string().nullable().notRequired()
});

/**
 * Add or edit credential page.
 */
const CredentialAddEdit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dbContext = useDb();
  const { executeVaultMutation, isLoading, syncStatus } = useVaultMutate();
  const [mode, setMode] = useState<CredentialMode>('random');
  const { setHeaderButtons } = useHeaderButtons();
  const { setIsInitialLoading } = useLoading();

  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<Credential>({
    resolver: yupResolver(credentialSchema),
    defaultValues: {
      Id: "",
      Username: "",
      Password: "",
      ServiceName: "",
      ServiceUrl: "",
      Notes: "",
      Alias: {
        FirstName: "",
        LastName: "",
        NickName: "",
        BirthDate: "",
        Gender: undefined,
        Email: ""
      }
    }
  });

  // If we received an ID, we're in edit mode
  const isEditMode = id !== undefined && id.length > 0;

  /**
   * Load an existing credential from the database in edit mode.
   */
  useEffect(() => {
    if (!dbContext?.sqliteClient || !id) {
      return;
    }

    try {
      const result = dbContext.sqliteClient.getCredentialById(id);

      if (result) {
        result.Alias.BirthDate = IdentityHelperUtils.normalizeBirthDateForDisplay(result.Alias.BirthDate);

        // Set form values
        Object.entries(result).forEach(([key, value]) => {
          setValue(key as keyof Credential, value);
        });
        // If credential has alias data, switch to manual mode
        if (result.Alias?.FirstName || result.Alias?.LastName) {
          setMode('manual');
        }
      } else {
        console.error('Credential not found');
        navigate('/credentials');
      }
    } catch (err) {
      console.error('Error loading credential:', err);
    }
  }, [dbContext.sqliteClient, id, navigate, setIsInitialLoading, setValue]);

  /**
   * Handle the delete button click.
   */
  const handleDelete = useCallback(async (): Promise<void> => {
    if (!id || !window.confirm('Are you sure you want to delete this credential? This action cannot be undone.')) {
      return;
    }

    executeVaultMutation(async () => {
      dbContext.sqliteClient!.deleteCredentialById(id);
    }, {
      /**
       * Navigate to the credentials list page on success.
       */
      onSuccess: () => {
        navigate('/credentials');
      }
    });
  }, [id, executeVaultMutation, dbContext.sqliteClient, navigate]);

  /**
   * Handle form submission.
   */
  const onSubmit = useCallback(async (data: Credential): Promise<void> => {
    // Normalize the birth date for database entry.
    if (data?.Alias?.BirthDate) {
      data.Alias.BirthDate = IdentityHelperUtils.normalizeBirthDateForDb(data.Alias.BirthDate);
    }

    executeVaultMutation(async () => {
      if (isEditMode) {
        await dbContext.sqliteClient!.updateCredentialById(data);
      } else {
        const credentialId = await dbContext.sqliteClient!.createCredential(data);
        data.Id = credentialId.toString();
      }
    }, {
      /**
       * Navigate to the credential details page on success.
       */
      onSuccess: () => {
        // Pop the current page from the history stack
        navigate(-1);
      },
    });
  }, [isEditMode, dbContext.sqliteClient, executeVaultMutation, navigate]);

  // Set header buttons on mount and clear on unmount
  useEffect((): (() => void) => {
    // Only set the header buttons once on mount.
    const headerButtonsJSX = (
      <div className="flex items-center gap-2">
        {isEditMode && (
          <HeaderButton
            onClick={handleDelete}
            title="Delete credential"
            iconType={HeaderIconType.DELETE}
            variant="danger"
          />
        )}
        <HeaderButton
          onClick={handleSubmit(onSubmit)}
          title="Save credential"
          iconType={HeaderIconType.SAVE}
        />
      </div>
    );

    setHeaderButtons(headerButtonsJSX);
    return () => {};
  }, [setHeaderButtons, handleSubmit, onSubmit, isEditMode, handleDelete]);

  // Clear header buttons on unmount
  useEffect((): (() => void) => {
    return () => setHeaderButtons(null);
  }, [setHeaderButtons]);

  if (!isEditMode && !watch('ServiceName')) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="fixed inset-0 flex flex-col justify-center items-center bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 z-50">
          <LoadingSpinner />
          <div className="text-sm text-gray-500 mt-2">
            {syncStatus}
          </div>
        </div>
      )}

      {!isEditMode && (
        <div className="flex space-x-2">
          <button
            onClick={() => setMode('random')}
            className={`flex-1 py-2 px-4 rounded ${
              mode === 'random' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Random Alias
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 px-4 rounded ${
              mode === 'manual' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Manual
          </button>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Service</h2>
          <div className="space-y-4">
            <FormInput
              id="serviceName"
              label="Service Name"
              value={watch('ServiceName')}
              onChange={(value) => setValue('ServiceName', value)}
              required
              error={errors.ServiceName?.message}
            />
            <FormInput
              id="serviceUrl"
              label="Service URL"
              value={watch('ServiceUrl')}
              onChange={(value) => setValue('ServiceUrl', value)}
              error={errors.ServiceUrl?.message}
            />
          </div>
        </div>

        {(mode === 'manual' || isEditMode) && (
          <>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Login Credentials</h2>
              <div className="space-y-4">
                <FormInput
                  id="username"
                  label="Username"
                  value={watch('Username')}
                  onChange={(value) => setValue('Username', value)}
                  error={errors.Username?.message}
                />
                <FormInput
                  id="password"
                  label="Password"
                  type="password"
                  value={watch('Password')}
                  onChange={(value) => setValue('Password', value)}
                  error={errors.Password?.message}
                />
                <button
                  onClick={() => {/* TODO: Implement generate random alias */}}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Generate Random Alias
                </button>
                <FormInput
                  id="email"
                  label="Email"
                  value={watch('Alias.Email')}
                  onChange={(value) => setValue('Alias.Email', value)}
                  error={errors.Alias?.Email?.message}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Alias</h2>
              <div className="space-y-4">
                <FormInput
                  id="firstName"
                  label="First Name"
                  value={watch('Alias.FirstName')}
                  onChange={(value) => setValue('Alias.FirstName', value)}
                  error={errors.Alias?.FirstName?.message}
                />
                <FormInput
                  id="lastName"
                  label="Last Name"
                  value={watch('Alias.LastName')}
                  onChange={(value) => setValue('Alias.LastName', value)}
                  error={errors.Alias?.LastName?.message}
                />
                <FormInput
                  id="nickName"
                  label="Nick Name"
                  value={watch('Alias.NickName')}
                  onChange={(value) => setValue('Alias.NickName', value)}
                  error={errors.Alias?.NickName?.message}
                />
                <FormInput
                  id="gender"
                  label="Gender"
                  value={watch('Alias.Gender')}
                  onChange={(value) => setValue('Alias.Gender', value)}
                  error={errors.Alias?.Gender?.message}
                />
                <FormInput
                  id="birthDate"
                  label="Birth Date"
                  placeholder="YYYY-MM-DD"
                  value={watch('Alias.BirthDate')}
                  onChange={(value) => setValue('Alias.BirthDate', value)}
                  error={errors.Alias?.BirthDate?.message}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Metadata</h2>
              <div className="space-y-4">
                <FormInput
                  id="notes"
                  label="Notes"
                  value={watch('Notes')}
                  onChange={(value) => setValue('Notes', value)}
                  multiline
                  rows={4}
                  error={errors.Notes?.message}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CredentialAddEdit;