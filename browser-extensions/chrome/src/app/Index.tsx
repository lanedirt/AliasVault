import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { WebApiProvider } from './context/WebApiContext';
import { DbProvider } from './context/DbContext';
import { LoadingProvider } from './context/LoadingContext';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <DbProvider>
    <AuthProvider>
      <WebApiProvider>
        <LoadingProvider>
          <App />
        </LoadingProvider>
      </WebApiProvider>
    </AuthProvider>
  </DbProvider>
);
