import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  HeaderBlock,
  EmailBlock,
  TotpBlock,
  LoginCredentialsBlock,
  AliasBlock,
  NotesBlock
} from '@/entrypoints/popup/components/CredentialDetails';
import HeaderButton from '@/entrypoints/popup/components/HeaderButton';
import { HeaderIconType } from '@/entrypoints/popup/components/icons/HeaderIcons';
import { useDb } from '@/entrypoints/popup/context/DbContext';
import { useHeaderButtons } from '@/entrypoints/popup/context/HeaderButtonsContext';
import { useLoading } from '@/entrypoints/popup/context/LoadingContext';

import type { Credential } from '@/utils/shared/models/vault';

/**
 * Credential details page.
 */
const CredentialDetails: React.FC = (): React.ReactElement => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dbContext = useDb();
  const [credential, setCredential] = useState<Credential | null>(null);
  const { setIsInitialLoading } = useLoading();
  const { setHeaderButtons } = useHeaderButtons();

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
  const openInNewPopup = useCallback((): void => {
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
  }, [id]);

  /**
   * Navigate to the edit page for this credential.
   */
  const handleEdit = useCallback((): void => {
    if (isPopup()) {
      window.close();
      const width = 380;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      window.open(
        `popup.html?expanded=true#/credentials/${id}/edit`,
        'CredentialAddEdit',
        `width=${width},height=${height},left=${left},top=${top},popup=true`
      );
    } else {
      navigate(`/credentials/${id}/edit`);
    }
  }, [id, navigate]);

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

  // Set header buttons on mount and clear on unmount
  useEffect((): (() => void) => {
    const headerButtonsJSX = (
      <div className="flex items-center gap-2">
        <HeaderButton
          onClick={openInNewPopup}
          title="Open in new window"
          iconType={HeaderIconType.EXPAND}
        />
        <HeaderButton
          onClick={handleEdit}
          title="Edit credential"
          iconType={HeaderIconType.EDIT}
        />
      </div>
    );
    setHeaderButtons(headerButtonsJSX);
    return () => {};
  }, [setHeaderButtons, handleEdit, openInNewPopup]);

  // Clear header buttons on unmount
  useEffect((): (() => void) => {
    return () => setHeaderButtons(null);
  }, [setHeaderButtons]);

  if (!credential) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <HeaderBlock credential={credential} />
      </div>
      {credential.Alias?.Email && (
        <EmailBlock
          email={credential.Alias.Email}
        />
      )}
      <NotesBlock notes={credential.Notes} />
      <TotpBlock credentialId={credential.Id} />
      <LoginCredentialsBlock credential={credential} />
      <AliasBlock credential={credential} />
    </div>
  );
};

export default CredentialDetails;