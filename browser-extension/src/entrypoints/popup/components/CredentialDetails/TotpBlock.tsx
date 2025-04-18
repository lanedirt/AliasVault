import React from 'react';
import { TotpViewer } from '../../components/TotpViewer';

type TotpBlockProps = {
  credentialId: string;
}

/**
 * Render the TOTP viewer block.
 */
const TotpBlock: React.FC<TotpBlockProps> = ({ credentialId }) => (
  <>
    <TotpViewer credentialId={credentialId} />
  </>
);

export default TotpBlock;