import React from 'react';

import type { Credential } from '@/utils/shared/models/vault';
import SqliteClient from '@/utils/SqliteClient';

type HeaderBlockProps = {
  credential: Credential;
  onOpenNewPopup: () => void;
}

/**
 * Render the header block.
 */
const HeaderBlock: React.FC<HeaderBlockProps> = ({ credential, onOpenNewPopup }) => (
  <div className="mb-6">
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
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 break-all"
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
  </div>
);

export default HeaderBlock;