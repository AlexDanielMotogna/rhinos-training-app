import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SpeedWizard } from '../components/tests/SpeedWizard';
import { SpeedSummary } from '../components/tests/SpeedSummary';
import { useI18n } from '../i18n/I18nProvider';
import type { SpeedResult, SpeedSummary as SpeedSummaryType, Tier, SpeedTestKey } from '../types/testing';
import { speedScore, speedIndex, labelFromSpeedIndex } from '../services/speedCalc';
import { getSpeedBenchmarks } from '../services/speedBenchmarks';
import { getUser } from '../services/userProfile';
import { saveTestResult, syncTestResultsFromBackend } from '../services/testResults';

export const TestsSpeed: React.FC = () => {
  const { t } = useI18n();
  const [testResults, setTestResults] = useState<SpeedResult[] | null>(null);
  const [summary, setSummary] = useState<SpeedSummaryType | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier>('semi');

  const user = getUser()!;
  const position = user.position;

  // Sync test results from backend on mount
  useEffect(() => {
    syncTestResultsFromBackend();
  }, []);

  const handleWizardFinish = (results: SpeedResult[]) => {
    setTestResults(results);
    computeSummary(results, selectedTier);
  };

  const computeSummary = async (results: SpeedResult[], tier: Tier) => {
    const benchmarks = getSpeedBenchmarks(position);
    const scores: Record<SpeedTestKey, number> = {} as any;

    results.forEach(result => {
      if (result.skipped || !result.timeSeconds) {
        scores[result.key] = 0;
      } else {
        const benchmark = benchmarks[result.key];
        const targetTime = benchmark.tierTargets[tier].value;
        scores[result.key] = speedScore(result.timeSeconds, targetTime);
      }
    });

    const index = speedIndex(scores);
    const label = labelFromSpeedIndex(index);

    const newSummary: SpeedSummaryType = {
      byTest: results,
      speedScore: index,
      label,
      tier,
      dateISO: new Date().toISOString(),
    };

    setSummary(newSummary);

    // Use the new sync service that handles backend sync
    await saveTestResult('speed', newSummary, index, label);
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
        {t('tests.speed.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t('tests.speed.description')}
      </Typography>

      {!summary ? (
        <SpeedWizard onFinish={handleWizardFinish} />
      ) : (
        <>
          <SpeedSummary summary={summary} onTierChange={handleTierChange} />
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
