import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './app/context/AuthContext';
import { WebApiProvider } from './app/context/WebApiContext';
import { DbProvider } from './app/context/DbContext';
import { LoadingProvider } from './app/context/LoadingContext';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <AuthProvider>
    <DbProvider>
      <WebApiProvider>
        <LoadingProvider>
          <App />
        </LoadingProvider>
      </WebApiProvider>
    </DbProvider>
  </AuthProvider>
);
