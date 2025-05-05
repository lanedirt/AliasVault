import ReactDOM from 'react-dom/client';
import App from '@/entrypoints/popup/App';
import { AuthProvider } from '@/entrypoints/popup/context/AuthContext';
import { WebApiProvider } from '@/entrypoints/popup/context/WebApiContext';
import { DbProvider } from '@/entrypoints/popup/context/DbContext';
import { LoadingProvider } from '@/entrypoints/popup/context/LoadingContext';
import { ThemeProvider } from '@/entrypoints/popup/context/ThemeContext';
import { setupExpandedMode } from '@/utils/ExpandedMode';

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
