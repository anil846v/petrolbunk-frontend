import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toaster';
import ErrorBoundary from './components/common/ErrorBoundary';
import App from './App.jsx';

import './index.css';                       // Tailwind base/components/utilities
import './assets/styles/layout.css';        // Sidebar + header + page layout

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
