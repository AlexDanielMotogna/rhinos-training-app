/**
 * Notification Service
 * Handles local notifications for PWA
 * Works on Android PWA and iOS 16.4+ (when installed)
 */

// Use extended type to include vibrate property
type RhinosNotificationOptions = NotificationOptions & {
  vibrate?: VibratePattern;
};

/**
 * Request permission for notifications
 * Returns true if permission granted
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // Check if browser supports notifications
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  // Already granted
  if (Notification.permission === 'granted') {
    return true;
  }

  // Permission denied
  if (Notification.permission === 'denied') {
    console.log('Notification permission was denied');
    return false;
  }

  // Ask for permission
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Send a local notification
 * Works when app is open
 */
export async function sendLocalNotification(
  title: string,
  options?: RhinosNotificationOptions
): Promise<boolean> {
  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    console.log('No permission to send notifications');
    return false;
  }

  try {
    // Try service worker first (required for Android PWA)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body: options?.body,
        icon: options?.icon || '/vite.svg',
        badge: options?.badge || '/vite.svg',
        vibrate: options?.vibrate || [200, 100, 200],
        tag: options?.tag || 'rhinos-notification',
        requireInteraction: options?.requireInteraction || false,
        data: options?.data,
      } as NotificationOptions);
      console.log('Notification sent via service worker (from local function)');
      return true;
    }

    // Fallback to new Notification (desktop browsers only)
    new Notification(title, {
      body: options?.body,
      icon: options?.icon || '/vite.svg',
      badge: options?.badge || '/vite.svg',
      vibrate: options?.vibrate || [200, 100, 200],
      tag: options?.tag || 'rhinos-notification',
      requireInteraction: options?.requireInteraction || false,
      data: options?.data,
    } as NotificationOptions);

    console.log('Local notification created successfully');
    return true;
  } catch (error) {
    console.error('Error sending local notification:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`Error details: ${errorMessage}`);
    return false;
  }
}

/**
 * Send notification via Service Worker
 * Better: works even when app is in background
 */
export async function sendServiceWorkerNotification(
  title: string,
  options?: RhinosNotificationOptions
): Promise<boolean> {
  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    console.log('No permission to send notifications');
    return false;
  }

  try {
    // Check if service worker is available
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported, falling back to local notification');
      return sendLocalNotification(title, options);
    }

    // Check if there's an active service worker
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Service worker timeout')), 2000)
      )
    ]) as ServiceWorkerRegistration | null;

    if (!registration) {
      console.log('No service worker registered, using local notification');
      return sendLocalNotification(title, options);
    }

    await registration.showNotification(title, {
      body: options?.body,
      icon: options?.icon || '/vite.svg',
      badge: options?.badge || '/vite.svg',
      vibrate: options?.vibrate || [200, 100, 200],
      tag: options?.tag || 'rhinos-notification',
      requireInteraction: options?.requireInteraction || false,
      data: options?.data,
    } as NotificationOptions);

    return true;
  } catch (error) {
    console.error('Error sending service worker notification:', error);
    console.log('Falling back to local notification');
    // Fallback to local notification
    return sendLocalNotification(title, options);
  }
}

/**
 * Check if notifications are supported and what permission status is
 */
export function getNotificationStatus(): {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  serviceWorkerSupported: boolean;
} {
  if (!('Notification' in window)) {
    return {
      supported: false,
      permission: 'unsupported',
      serviceWorkerSupported: false,
    };
  }

  return {
    supported: true,
    permission: Notification.permission,
    serviceWorkerSupported: 'serviceWorker' in navigator,
  };
}

/**
 * Notification templates for common use cases
 * Note: Pass translated strings from components using useI18n() hook
 */
export const NotificationTemplates = {
  newTeamSession: (title: string, body: string) =>
    sendServiceWorkerNotification(title, {
      body,
      vibrate: [300, 100, 300],
      tag: 'new-session',
      requireInteraction: true,
    }),

  sessionReminder: (title: string, body: string) =>
    sendServiceWorkerNotification(title, {
      body,
      vibrate: [200, 100, 200, 100, 200],
      tag: 'session-reminder',
      requireInteraction: true,
    }),

  coachComment: (title: string, message: string) =>
    sendServiceWorkerNotification(title, {
      body: message,
      vibrate: [200, 100, 200],
      tag: 'coach-comment',
    }),

  newVideo: (title: string, body: string) =>
    sendServiceWorkerNotification(title, {
      body,
      vibrate: [200, 100, 200],
      tag: 'new-video',
    }),

  testNotification: (title: string, body: string) =>
    sendServiceWorkerNotification(title, {
      body,
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      tag: 'test-notification',
      requireInteraction: false,
    }),
};
