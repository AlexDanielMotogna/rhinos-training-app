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
  Slider,
  Tooltip,
  IconButton,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useI18n } from '../../i18n/I18nProvider';
import type { TestKey, StrengthInput, StrengthResult } from '../../types/testing';
import { epley1RM, relative, testToSegment } from '../../services/strengthCalc';

interface StrengthWizardProps {
  bodyWeightKg: number;
  onFinish: (results: StrengthResult[]) => void;
}

const testOrder: TestKey[] = ['bench', 'row', 'ohp', 'squat', 'trapbar', 'plank'];

export const StrengthWizard: React.FC<StrengthWizardProps> = ({ bodyWeightKg, onFinish }) => {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [inputs, setInputs] = useState<Record<TestKey, StrengthInput>>({
    bench: {},
    row: {},
    ohp: {},
    squat: {},
    trapbar: {},
    plank: {},
  });
  const [skipped, setSkipped] = useState<Set<TestKey>>(new Set());

  const currentTest = testOrder[currentStep];
  const currentInput = inputs[currentTest];

  const isPlank = currentTest === 'plank';
  const canSave = isPlank
    ? currentInput.seconds !== undefined && currentInput.seconds > 0
    : currentInput.weightKg !== undefined &&
      currentInput.reps !== undefined &&
      currentInput.weightKg > 0 &&
      currentInput.reps > 0;

  const repsValid = !currentInput.reps || (currentInput.reps >= 1 && currentInput.reps <= 10);

  const handleInputChange = (field: keyof StrengthInput, value: number | undefined) => {
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
      const results: StrengthResult[] = testOrder.map(key => {
        if (skipped.has(key)) {
          return {
            key,
            segment: testToSegment(key),
            skipped: true,
          };
        }

        const input = inputs[key];
        if (key === 'plank') {
          return {
            key,
            segment: 'core',
            seconds: input.seconds || 0,
          };
        }

        const oneRmEstKg = epley1RM(input.weightKg || 0, input.reps || 1);
        const oneRmRel = relative(oneRmEstKg, bodyWeightKg);

        return {
          key,
          segment: testToSegment(key),
          oneRmEstKg,
          oneRmRel,
          weightKg: input.weightKg,
          reps: input.reps,
        };
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

  const estimated1RM = !isPlank && currentInput.weightKg && currentInput.reps
    ? epley1RM(currentInput.weightKg, currentInput.reps)
    : null;

  const relativeValue = estimated1RM ? relative(estimated1RM, bodyWeightKg) : null;

  return (
    <Box>
      <Box sx={{ overflowX: 'auto', mb: 3 }}>
        <Stepper
          activeStep={currentStep}
          sx={{
            minWidth: 'max-content',
            pb: 1
          }}
        >
          {testOrder.map(key => (
            <Step key={key}>
              <StepLabel>{t(`tests.${key}`)}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t(`tests.${currentTest}`)}
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom fontWeight={600}>
            {t('tests.howItWorks')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {t('tests.warmup.tip')}
          </Typography>
          <Typography variant="body2">
            {isPlank ? t('tests.plankInstructions') : t('tests.instructions')}
          </Typography>
        </Alert>

        {isPlank ? (
          <TextField
            label={t('tests.seconds')}
            type="number"
            value={currentInput.seconds || ''}
            onChange={e =>
              handleInputChange('seconds', e.target.value ? Number(e.target.value) : undefined)
            }
            fullWidth
            sx={{ mb: 2 }}
            inputProps={{ min: 0 }}
          />
        ) : (
          <>
            <TextField
              label={t('tests.weightKg')}
              type="number"
              value={currentInput.weightKg || ''}
              onChange={e =>
                handleInputChange('weightKg', e.target.value ? Number(e.target.value) : undefined)
              }
              fullWidth
              sx={{ mb: 2 }}
              inputProps={{ min: 0, step: 0.5 }}
            />

            <TextField
              label={t('tests.reps')}
              type="number"
              value={currentInput.reps || ''}
              onChange={e =>
                handleInputChange('reps', e.target.value ? Number(e.target.value) : undefined)
              }
              fullWidth
              sx={{ mb: 2 }}
              inputProps={{ min: 1, max: 10 }}
              error={!repsValid}
              helperText={!repsValid ? 'Reps should be 1-10 for accurate 1RM estimation' : ''}
            />

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                {t('tests.rpe')} {currentInput.rpe ? `(${currentInput.rpe}/10)` : ''}
              </Typography>
              <Slider
                value={currentInput.rpe || 5}
                onChange={(_e, value) => handleInputChange('rpe', value as number)}
                min={1}
                max={10}
                step={0.5}
                marks
                valueLabelDisplay="auto"
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('workout.rpeEasy')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('workout.rpeMaxEffort')}
                </Typography>
              </Box>
            </Box>

            {estimated1RM !== null && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <Typography variant="body2">
                    {t('tests.estimated1RM')}: <strong>{estimated1RM.toFixed(1)} kg</strong>
                  </Typography>
                  <Tooltip title={t('tests.oneRmExplained')} arrow>
                    <IconButton size="small">
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2">
                    {t('tests.relativeToBW')}: <strong>{relativeValue?.toFixed(2)}× BW</strong>
                  </Typography>
                  <Tooltip title={t('tests.relativeExplained')} arrow>
                    <IconButton size="small">
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Alert>
            )}
          </>
        )}

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
