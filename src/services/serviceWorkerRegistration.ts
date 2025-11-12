/**
 * Service Worker Registration
 * Registers the service worker for PWA capabilities
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered successfully:', registration);

    // Check for updates and notify user
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('Service Worker update found:', newWorker);

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available, notify user
            console.log('New version available! Please reload to update.');

            // Show update notification
            const shouldReload = confirm(
              'A new version of the app is available. Reload to update?'
            );

            if (shouldReload) {
              // Tell the new service worker to skip waiting
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              // Reload the page
              window.location.reload();
            }
          }
        });
      }
    });

    // Handle controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed - reloading page');
      window.location.reload();
    });

    // Check for updates every hour
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Check every hour

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      console.log('Service Worker unregistered:', success);
      return success;
    }
    return false;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
}
