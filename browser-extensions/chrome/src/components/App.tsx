import React from 'react';
import '../styles/tailwind.css';
import { DbProvider } from '../context/DbContext';
import { WebApiProvider } from '../context/WebApiContext';
import AppContent from './AppContent';

const App: React.FC = () => {
  return (
    <DbProvider>
      <WebApiProvider>
        <AppContent />
      </WebApiProvider>
    </DbProvider>
  );
};

export default App;
