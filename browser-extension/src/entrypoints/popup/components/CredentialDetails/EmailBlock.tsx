import React from 'react';
import { EmailPreview } from '../../components/EmailPreview';

type EmailBlockProps = {
  email: string;
  isSupported: boolean;
}

/**
 * Render the email block.
 */
const EmailBlock: React.FC<EmailBlockProps> = ({ email, isSupported }) => (
  <>
    {isSupported && <EmailPreview email={email} />}
  </>
);

export default EmailBlock;