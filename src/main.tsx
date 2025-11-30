import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerServiceWorker } from './services/serviceWorkerRegistration';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);

// Register service worker for PWA notifications (PRODUCTION ONLY)
// Service worker is disabled in development to prevent caching issues
if (import.meta.env.PROD) {
  console.log('Production mode: registering service worker...');
  registerServiceWorker();
} else {
  console.log('Development mode: service worker disabled to prevent caching issues');
}
