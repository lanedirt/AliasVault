import { Buffer } from 'buffer';

import { yupResolver } from '@hookform/resolvers/yup';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import * as Yup from 'yup';

import { FormInput } from '@/entrypoints/popup/components/FormInput';
import HeaderButton from '@/entrypoints/popup/components/HeaderButton';
import { HeaderIconType } from '@/entrypoints/popup/components/icons/HeaderIcons';
import { useDb } from '@/entrypoints/popup/context/DbContext';
import { useHeaderButtons } from '@/entrypoints/popup/context/HeaderButtonsContext';
import { useWebApi } from '@/entrypoints/popup/context/WebApiContext';
import { useVaultMutate } from '@/entrypoints/popup/hooks/useVaultMutate';

import { IdentityHelperUtils, CreateIdentityGenerator } from '@/utils/shared/identity-generator';
import type { Credential } from '@/utils/shared/models/vault';
import { CreatePasswordGenerator } from '@/utils/shared/password-generator';

import LoadingSpinner from '../components/LoadingSpinner';
import { useLoading } from '../context/LoadingContext';

type CredentialMode = 'random' | 'manual';

/**
 * Validation schema for the credential form.
 */
const credentialSchema = Yup.object().shape({
  Id: Yup.string(),
  ServiceName: Yup.string().required('Service name is required'),
  ServiceUrl: Yup.string().url('Invalid URL format').optional(),
  Alias: Yup.object().shape({
    FirstName: Yup.string().optional(),
    LastName: Yup.string().optional(),
    NickName: Yup.string().optional(),
    BirthDate: Yup.string()
      .optional()
      .test(
        'is-valid-date-format',
        'Date must be in YYYY-MM-DD format',
        value => {
          if (!value) {
            return true;
          }
          return /^\d{4}-\d{2}-\d{2}$/.test(value);
        },
      ),
    Gender: Yup.string().nullable().optional(),
    Email: Yup.string().email('Invalid email format').optional()
  }),
  Username: Yup.string().optional(),
  Password: Yup.string().nullable().optional(),
  Notes: Yup.string().optional()
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
  const [localLoading, setLocalLoading] = useState(false);
  const webApi = useWebApi();

  const serviceNameRef = useRef<HTMLInputElement>(null);

  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<Credential>({
    resolver: yupResolver(credentialSchema as Yup.ObjectSchema<Credential>),
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
      // On create mode, focus the service name field after a short delay to ensure the component is mounted.
      setTimeout(() => {
        serviceNameRef.current?.focus();
      }, 100);

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

        setMode('manual');

        // On create mode, focus the service name field after a short delay to ensure the component is mounted
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
   * Initialize the identity and password generators with settings from user's vault.
   */
  const initializeGenerators = useCallback(async () => {
    // Get default identity language from database
    const identityLanguage = dbContext.sqliteClient!.getDefaultIdentityLanguage();

    // Initialize identity generator based on language
    const identityGenerator = CreateIdentityGenerator(identityLanguage);

    // Initialize password generator with settings from vault
    const passwordSettings = dbContext.sqliteClient!.getPasswordSettings();
    const passwordGenerator = CreatePasswordGenerator(passwordSettings);

    return { identityGenerator, passwordGenerator };
  }, [dbContext.sqliteClient]);

  /**
   * Generate a random alias and password.
   */
  const generateRandomAlias = useCallback(async () => {
    const { identityGenerator, passwordGenerator } = await initializeGenerators();

    const identity = identityGenerator.generateRandomIdentity();
    const password = passwordGenerator.generateRandomPassword();

    const metadata = await dbContext!.getVaultMetadata();

    const privateEmailDomains = metadata?.privateEmailDomains ?? [];
    const publicEmailDomains = metadata?.publicEmailDomains ?? [];
    const defaultEmailDomain = dbContext.sqliteClient!.getDefaultEmailDomain(privateEmailDomains, publicEmailDomains);
    const email = defaultEmailDomain ? `${identity.emailPrefix}@${defaultEmailDomain}` : identity.emailPrefix;

    setValue('Alias.Email', email);
    setValue('Alias.FirstName', identity.firstName);
    setValue('Alias.LastName', identity.lastName);
    setValue('Alias.NickName', identity.nickName);
    setValue('Alias.Gender', identity.gender);
    setValue('Alias.BirthDate', IdentityHelperUtils.normalizeBirthDateForDisplay(identity.birthDate.toISOString()));

    // In edit mode, preserve existing username and password if they exist
    if (isEditMode && watch('Username')) {
      // Keep the existing username in edit mode, so don't do anything here.
    } else {
      // Use the newly generated username
      setValue('Username', identity.nickName);
    }

    if (isEditMode && watch('Password')) {
      // Keep the existing password in edit mode, so don't do anything here.
    } else {
      // Use the newly generated password
      setValue('Password', password);
    }
  }, [isEditMode, watch, setValue, initializeGenerators, dbContext]);

  /**
   * Handle the generate random alias button press.
   */
  const handleGenerateRandomAlias = useCallback(() => {
    void generateRandomAlias();
  }, [generateRandomAlias]);

  /**
   * Handle form submission.
   */
  const onSubmit = useCallback(async (data: Credential): Promise<void> => {
    // Normalize the birth date for database entry.
    if (data?.Alias?.BirthDate) {
      data.Alias.BirthDate = IdentityHelperUtils.normalizeBirthDateForDb(data.Alias.BirthDate);
    }

    // If we're creating a new credential and mode is random, generate random values here
    if (!isEditMode && mode === 'random') {
      // Generate random values now and then read them from the form fields to manually assign to the credentialToSave object
      await generateRandomAlias();
      data.Username = watch('Username');
      data.Password = watch('Password');
      data.Alias.FirstName = watch('Alias.FirstName');
      data.Alias.LastName = watch('Alias.LastName');
      data.Alias.NickName = watch('Alias.NickName');
      data.Alias.BirthDate = watch('Alias.BirthDate');
      data.Alias.Gender = watch('Alias.Gender');
      data.Alias.Email = watch('Alias.Email');
    }

    // Extract favicon from service URL if the credential has one
    if (data.ServiceUrl) {
      setLocalLoading(true);
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Favicon extraction timed out')), 5000)
        );

        const faviconPromise = webApi.get<{ image: string }>('Favicon/Extract?url=' + data.ServiceUrl);
        const faviconResponse = await Promise.race([faviconPromise, timeoutPromise]) as { image: string };

        if (faviconResponse?.image) {
          const decodedImage = Uint8Array.from(Buffer.from(faviconResponse.image, 'base64'));
          data.Logo = decodedImage;
        }
      } catch {
        // Favicon extraction failed or timed out, this is not a critical error so we can ignore it.
      }
    }

    executeVaultMutation(async () => {
      setLocalLoading(false);

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
        // If in add mode, navigate to the credential details page.
        if (!isEditMode) {
          // Navigate to the credential details page.
          navigate(`/credentials/${data.Id}`, { replace: true });
        } else {
          // If in edit mode, pop the current page from the history stack to end up on details page as well.
          navigate(-1);
        }
      },
    });
  }, [isEditMode, dbContext.sqliteClient, executeVaultMutation, navigate, mode, watch, generateRandomAlias, webApi]);

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

  if (isEditMode && !watch('ServiceName')) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <button type="submit" style={{ display: 'none' }} />
      {(localLoading || isLoading) && (
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
            type="button"
            onClick={() => setMode('random')}
            className={`flex-1 py-2 px-4 rounded ${
              mode === 'random' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Random Alias
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 px-4 rounded ${
              mode === 'manual' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
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
              ref={serviceNameRef}
              value={watch('ServiceName') ?? ''}
              onChange={(value) => setValue('ServiceName', value)}
              required
              error={errors.ServiceName?.message}
            />
            <FormInput
              id="serviceUrl"
              label="Service URL"
              value={watch('ServiceUrl') ?? ''}
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
                  value={watch('Username') ?? ''}
                  onChange={(value) => setValue('Username', value)}
                  error={errors.Username?.message}
                />
                <FormInput
                  id="password"
                  label="Password"
                  type="password"
                  value={watch('Password') ?? ''}
                  onChange={(value) => setValue('Password', value)}
                  error={errors.Password?.message}
                />
                <button
                  type="button"
                  onClick={handleGenerateRandomAlias}
                  className="w-full bg-primary-500 text-white py-2 px-4 rounded hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Generate Random Alias
                </button>
                <FormInput
                  id="email"
                  label="Email"
                  value={watch('Alias.Email') ?? ''}
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
                  value={watch('Alias.FirstName') ?? ''}
                  onChange={(value) => setValue('Alias.FirstName', value)}
                  error={errors.Alias?.FirstName?.message}
                />
                <FormInput
                  id="lastName"
                  label="Last Name"
                  value={watch('Alias.LastName') ?? ''}
                  onChange={(value) => setValue('Alias.LastName', value)}
                  error={errors.Alias?.LastName?.message}
                />
                <FormInput
                  id="nickName"
                  label="Nick Name"
                  value={watch('Alias.NickName') ?? ''}
                  onChange={(value) => setValue('Alias.NickName', value)}
                  error={errors.Alias?.NickName?.message}
                />
                <FormInput
                  id="gender"
                  label="Gender"
                  value={watch('Alias.Gender') ?? ''}
                  onChange={(value) => setValue('Alias.Gender', value)}
                  error={errors.Alias?.Gender?.message}
                />
                <FormInput
                  id="birthDate"
                  label="Birth Date"
                  placeholder="YYYY-MM-DD"
                  value={watch('Alias.BirthDate') ?? ''}
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
                  value={watch('Notes') ?? ''}
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
    </form>
  );
};

export default CredentialAddEdit;