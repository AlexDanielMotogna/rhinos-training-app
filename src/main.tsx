import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerServiceWorker } from './services/serviceWorkerRegistration';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA notifications
if (import.meta.env.PROD) {
  // Only in production (Vercel)
  registerServiceWorker();
} else {
  // In development, also register for testing
  console.log('Development mode: registering service worker for testing...');
  registerServiceWorker();
}
