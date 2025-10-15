import React from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useI18n, Locale } from '../i18n/I18nProvider';

export const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale, t } = useI18n();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (newLocale: Locale) => {
    setLocale(newLocale);
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{ color: 'inherit' }}
        aria-label={t('common.language')}
      >
        <LanguageIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem
          selected={locale === 'en'}
          onClick={() => handleSelect('en')}
        >
          English
        </MenuItem>
        <MenuItem
          selected={locale === 'de'}
          onClick={() => handleSelect('de')}
        >
          Deutsch
        </MenuItem>
      </Menu>
    </>
  );
};
