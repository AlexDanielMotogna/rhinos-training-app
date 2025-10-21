import React from 'react';
import { Container } from '@mui/material';
import { BrandingManager } from '../components/admin/BrandingManager';

export const Configuration: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <BrandingManager />
    </Container>
  );
};
