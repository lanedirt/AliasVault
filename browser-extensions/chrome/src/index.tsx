import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import { AuthProvider } from './context/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
