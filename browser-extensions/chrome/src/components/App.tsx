import React from 'react';
import '../styles/tailwind.css';
import { DbProvider } from '../context/DbContext';
import AppContent from './AppContent';

const App: React.FC = () => {
  return (
    <DbProvider>
      <AppContent />
    </DbProvider>
  );
};

export default App;
