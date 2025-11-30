import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { messagesEN, MessageKey } from './messages/en';
import { messagesDE } from './messages/de';
import { userService } from '../services/api';

export type Locale = 'en' | 'de';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const messages: Record<Locale, Record<string, string>> = {
  en: messagesEN,
  de: messagesDE,
};

interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  defaultLocale = 'en'
}) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('locale');
    return (saved === 'en' || saved === 'de') ? saved : defaultLocale;
  });

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);

    // Sync with backend
    try {
      await userService.updateProfile({ preferredLanguage: newLocale });
      console.log(`[i18n] Language preference synced to backend: ${newLocale}`);
    } catch (error) {
      console.warn('[i18n] Failed to sync language preference to backend:', error);
    }
  }, []);

  const t = useCallback(
    (key: MessageKey, params?: Record<string, string | number>): string => {
      let message = messages[locale][key] || key;

      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          message = message.replace(`{${paramKey}}`, String(value));
        });
      }

      return message;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};
