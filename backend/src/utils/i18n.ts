/**
 * Backend i18n helper for notifications
 * Provides translations for notification messages in German and English
 */

type Language = 'de' | 'en';

interface Translations {
  [key: string]: {
    de: string;
    en: string;
  };
}

const translations: Translations = {
  // Training Session Notifications
  'notification.newSession.title': {
    de: 'Neue Trainingssitzung',
    en: 'New Training Session',
  },
  'notification.privateSession.title': {
    de: 'Private Trainingssitzung',
    en: 'Private Training Session',
  },
  'notification.newSession.createdBy': {
    de: 'erstellt eine private Sitzung',
    en: 'created a private session',
  },
  'notification.session.at': {
    de: 'um',
    en: 'at',
  },
  'notification.session.in': {
    de: 'in',
    en: 'at',
  },

  // Attendance Poll Notifications
  'notification.attendancePoll.title': {
    de: 'Anwesenheitsumfrage',
    en: 'Attendance Poll',
  },
  'notification.attendancePoll.message': {
    de: 'Stimme über deine Verfügbarkeit für',
    en: 'Vote your availability for',
  },
  'notification.attendancePoll.on': {
    de: 'am',
    en: 'on',
  },

  // Training Plan Notifications
  'notification.newPlan.title': {
    de: 'Neuer Trainingsplan',
    en: 'New Training Plan',
  },
  'notification.newPlan.message': {
    de: 'Der Coach hat dir den Plan zugewiesen:',
    en: 'The coach has assigned you the plan:',
  },
};

/**
 * Get translation for a key in the specified language
 */
export function t(key: string, language: Language = 'de'): string {
  const translation = translations[key];
  if (!translation) {
    console.warn(`[i18n] Missing translation for key: ${key}`);
    return key;
  }
  return translation[language] || translation.de;
}

/**
 * Format training session notification message
 */
export function formatSessionMessage(
  title: string,
  date: string,
  time: string,
  location: string,
  language: Language = 'de'
): string {
  const at = t('notification.session.at', language);
  const inLocation = t('notification.session.in', language);
  return `${title} - ${date} ${at} ${time} ${inLocation} ${location}`;
}

/**
 * Format attendance poll notification message
 */
export function formatPollMessage(
  sessionName: string,
  sessionDate: string,
  language: Language = 'de'
): string {
  const voteText = t('notification.attendancePoll.message', language);
  const on = t('notification.attendancePoll.on', language);
  return `${voteText} ${sessionName} ${on} ${sessionDate}`;
}

/**
 * Format private session title
 */
export function formatPrivateSessionTitle(
  creatorName: string,
  language: Language = 'de'
): string {
  const createdText = t('notification.newSession.createdBy', language);
  return `${creatorName} ${createdText}`;
}

/**
 * Format new plan message
 */
export function formatNewPlanMessage(
  planName: string,
  language: Language = 'de'
): string {
  const message = t('notification.newPlan.message', language);
  return `${message} ${planName}`;
}
