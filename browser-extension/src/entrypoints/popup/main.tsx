import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { WebApiProvider } from './context/WebApiContext';
import { DbProvider } from './context/DbContext';
import { LoadingProvider } from './context/LoadingContext';
import { ThemeProvider } from './context/ThemeContext';
import { setupExpandedMode } from '../../utils/ExpandedMode';

// Run before React initializes to ensure the popup is always a fixed width except for when explicitly expanded.
setupExpandedMode();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <DbProvider>
    <AuthProvider>
      <WebApiProvider>
        <LoadingProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </LoadingProvider>
      </WebApiProvider>
    </AuthProvider>
  </DbProvider>
);
