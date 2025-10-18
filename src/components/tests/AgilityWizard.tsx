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
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { useI18n } from '../../i18n/I18nProvider';
import type { AgilityTestKey, AgilityInput, AgilityResult } from '../../types/testing';
import { VideoModal } from './VideoModal';

interface AgilityWizardProps {
  onFinish: (results: AgilityResult[]) => void;
}

const testOrder: AgilityTestKey[] = ['proAgility', 'threeCone'];

// Map agility tests to YouTube URLs
const exerciseVideos: Record<AgilityTestKey, string> = {
  proAgility: 'https://www.youtube.com/watch?v=brFHyOtTwH4',
  threeCone: 'https://www.youtube.com/watch?v=VNbZXU5fRfE',
};

export const AgilityWizard: React.FC<AgilityWizardProps> = ({ onFinish }) => {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [inputs, setInputs] = useState<Record<AgilityTestKey, AgilityInput>>({
    proAgility: {},
    threeCone: {},
  });
  const [skipped, setSkipped] = useState<Set<AgilityTestKey>>(new Set());

  const currentTest = testOrder[currentStep];
  const currentInput = inputs[currentTest];

  const canSave = currentInput.timeSeconds !== undefined && currentInput.timeSeconds > 0;

  const handleInputChange = (field: keyof AgilityInput, value: number | undefined) => {
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
      const results: AgilityResult[] = testOrder.map(key => {
        if (skipped.has(key)) {
          return {
            key,
            skipped: true,
          };
        }

        const input = inputs[key];
        return {
          key,
          timeSeconds: input.timeSeconds || 0,
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
              <StepLabel>{t(`tests.agility.${key}`)}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">
            {t(`tests.agility.${currentTest}`)}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<PlayCircleOutlineIcon />}
            onClick={() => setShowVideo(true)}
            size="small"
          >
            {t('tests.watchExercise')}
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom fontWeight={600}>
            {t('tests.howItWorks')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {t('tests.warmup.tip')}
          </Typography>
          <Typography variant="body2">
            {t(`tests.agility.${currentTest}.instructions`)}
          </Typography>
        </Alert>

        <TextField
          label={t('tests.timeSeconds')}
          type="number"
          value={currentInput.timeSeconds || ''}
          onChange={e =>
            handleInputChange('timeSeconds', e.target.value ? Number(e.target.value) : undefined)
          }
          fullWidth
          sx={{ mb: 2 }}
          inputProps={{ min: 0, step: 0.01 }}
          helperText={t(`tests.agility.${currentTest}.helper`)}
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

      <VideoModal
        open={showVideo}
        onClose={() => setShowVideo(false)}
        videoUrl={exerciseVideos[currentTest]}
        title={t(`tests.agility.${currentTest}`)}
      />
    </Box>
  );
};
