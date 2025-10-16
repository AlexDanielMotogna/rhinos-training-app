import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { PowerWizard } from '../components/tests/PowerWizard';
import { PowerSummary } from '../components/tests/PowerSummary';
import { useI18n } from '../i18n/I18nProvider';
import type { PowerResult, PowerSummary as PowerSummaryType, Tier, PowerTestKey } from '../types/testing';
import { powerScore, powerIndex, labelFromPowerIndex } from '../services/powerCalc';
import { getPowerBenchmarks } from '../services/powerBenchmarks';
import { getUser } from '../services/mock';

export const TestsPower: React.FC = () => {
  const { t } = useI18n();
  const [testResults, setTestResults] = useState<PowerResult[] | null>(null);
  const [summary, setSummary] = useState<PowerSummaryType | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier>('semi');

  const user = getUser()!;
  const position = user.position;

  const handleWizardFinish = (results: PowerResult[]) => {
    setTestResults(results);
    computeSummary(results, selectedTier);
  };

  const computeSummary = (results: PowerResult[], tier: Tier) => {
    const benchmarks = getPowerBenchmarks(position);
    const scores: Record<PowerTestKey, number> = {} as any;

    results.forEach(result => {
      if (result.skipped) {
        scores[result.key] = 0;
      } else {
        const benchmark = benchmarks[result.key];
        const targetValue = benchmark.tierTargets[tier].value;

        let actualValue = 0;
        if (result.key === 'verticalJump' && result.heightCm) {
          actualValue = result.heightCm;
        } else if (result.key === 'broadJump' && result.distanceCm) {
          actualValue = result.distanceCm;
        }

        scores[result.key] = powerScore(actualValue, targetValue);
      }
    });

    const index = powerIndex(scores);
    const label = labelFromPowerIndex(index);

    const newSummary: PowerSummaryType = {
      byTest: results,
      powerScore: index,
      label,
      tier,
      dateISO: new Date().toISOString(),
    };

    setSummary(newSummary);

    // Save to localStorage
    localStorage.setItem('lastPowerTest', JSON.stringify(newSummary));
  };

  const handleTierChange = (tier: Tier) => {
    setSelectedTier(tier);
    if (testResults) {
      computeSummary(testResults, tier);
    }
  };

  const handleReset = () => {
    setTestResults(null);
    setSummary(null);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('tests.power.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t('tests.power.description')}
      </Typography>

      {!summary ? (
        <PowerWizard onFinish={handleWizardFinish} />
      ) : (
        <>
          <PowerSummary summary={summary} onTierChange={handleTierChange} />
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button variant="outlined" onClick={handleReset}>
              {t('tests.retake')}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};
