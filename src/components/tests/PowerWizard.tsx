import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useI18n } from '../../i18n/I18nProvider';
import type { PowerTestKey, PowerInput, PowerResult } from '../../types/testing';
import { cmToInches } from '../../services/powerCalc';

interface PowerWizardProps {
  onFinish: (results: PowerResult[]) => void;
}

const testOrder: PowerTestKey[] = ['verticalJump', 'broadJump'];

export const PowerWizard: React.FC<PowerWizardProps> = ({ onFinish }) => {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [inputs, setInputs] = useState<Record<PowerTestKey, PowerInput>>({
    verticalJump: {},
    broadJump: {},
  });
  const [skipped, setSkipped] = useState<Set<PowerTestKey>>(new Set());

  const currentTest = testOrder[currentStep];
  const currentInput = inputs[currentTest];

  const isVertical = currentTest === 'verticalJump';

  const canSave = isVertical
    ? currentInput.heightCm !== undefined && currentInput.heightCm > 0
    : currentInput.distanceCm !== undefined && currentInput.distanceCm > 0;

  const handleInputChange = (field: keyof PowerInput, value: number | undefined) => {
    setInputs(prev => ({
      ...prev,
      [currentTest]: {
        ...prev[currentTest],
        [field]: value,
      },
    }));
  };

  const handleNext = () => {
    if (currentStep === testOrder.length - 1) {
      // Finish - compute results
      const results: PowerResult[] = testOrder.map(key => {
        if (skipped.has(key)) {
          return {
            key,
            skipped: true,
          };
        }

        const input = inputs[key];
        if (key === 'verticalJump') {
          return {
            key,
            heightCm: input.heightCm || 0,
          };
        } else {
          return {
            key,
            distanceCm: input.distanceCm || 0,
          };
        }
      });

      onFinish(results);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    setSkipped(prev => new Set(prev).add(currentTest));
    handleNext();
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const currentValue = isVertical ? currentInput.heightCm : currentInput.distanceCm;
  const inchesValue = currentValue ? cmToInches(currentValue) : null;

  return (
    <Box>
      <Stepper activeStep={currentStep} sx={{ mb: 3 }}>
        {testOrder.map(key => (
          <Step key={key}>
            <StepLabel>{t(`tests.power.${key}`)}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t(`tests.power.${currentTest}`)}
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom fontWeight={600}>
            {t('tests.howItWorks')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {t('tests.warmup.tip')}
          </Typography>
          <Typography variant="body2">
            {t(`tests.power.${currentTest}.instructions`)}
          </Typography>
        </Alert>

        <TextField
          label={isVertical ? t('tests.heightCm') : t('tests.distanceCm')}
          type="number"
          value={currentValue || ''}
          onChange={e =>
            handleInputChange(
              isVertical ? 'heightCm' : 'distanceCm',
              e.target.value ? Number(e.target.value) : undefined
            )
          }
          fullWidth
          sx={{ mb: 2 }}
          inputProps={{ min: 0, step: 1 }}
          helperText={
            inchesValue
              ? `${inchesValue.toFixed(1)} inches | ${t(`tests.power.${currentTest}.helper`)}`
              : t(`tests.power.${currentTest}.helper`)
          }
        />

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button onClick={handlePrev} disabled={currentStep === 0}>
            {t('tests.prev')}
          </Button>

          <Button variant="outlined" onClick={handleSkip}>
            {t('tests.skip')}
          </Button>

          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canSave}
            sx={{ ml: 'auto' }}
          >
            {currentStep === testOrder.length - 1 ? t('tests.summary') : t('tests.next')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
