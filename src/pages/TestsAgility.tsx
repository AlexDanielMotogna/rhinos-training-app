import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { AgilityWizard } from '../components/tests/AgilityWizard';
import { AgilitySummary } from '../components/tests/AgilitySummary';
import { useI18n } from '../i18n/I18nProvider';
import type { AgilityResult, AgilitySummary as AgilitySummaryType, Tier, AgilityTestKey } from '../types/testing';
import { agilityScore, agilityIndex, labelFromAgilityIndex } from '../services/agilityCalc';
import { getAgilityBenchmarks } from '../services/agilityBenchmarks';
import { getUser } from '../services/userProfile';

export const TestsAgility: React.FC = () => {
  const { t } = useI18n();
  const [testResults, setTestResults] = useState<AgilityResult[] | null>(null);
  const [summary, setSummary] = useState<AgilitySummaryType | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier>('semi');

  const user = getUser()!;
  const position = user.position;

  const handleWizardFinish = (results: AgilityResult[]) => {
    setTestResults(results);
    computeSummary(results, selectedTier);
  };

  const computeSummary = (results: AgilityResult[], tier: Tier) => {
    const benchmarks = getAgilityBenchmarks(position);
    const scores: Record<AgilityTestKey, number> = {} as any;

    results.forEach(result => {
      if (result.skipped || !result.timeSeconds) {
        scores[result.key] = 0;
      } else {
        const benchmark = benchmarks[result.key];
        const targetTime = benchmark.tierTargets[tier].value;
        scores[result.key] = agilityScore(result.timeSeconds, targetTime);
      }
    });

    const index = agilityIndex(scores);
    const label = labelFromAgilityIndex(index);

    const newSummary: AgilitySummaryType = {
      byTest: results,
      agilityScore: index,
      label,
      tier,
      dateISO: new Date().toISOString(),
    };

    setSummary(newSummary);

    // Save previous test before overwriting
    const previousTest = localStorage.getItem('lastAgilityTest');
    if (previousTest) {
      localStorage.setItem('lastAgilityTest_previous', previousTest);
    }

    // Save to localStorage
    localStorage.setItem('lastAgilityTest', JSON.stringify(newSummary));
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
        {t('tests.agility.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t('tests.agility.description')}
      </Typography>

      {!summary ? (
        <AgilityWizard onFinish={handleWizardFinish} />
      ) : (
        <>
          <AgilitySummary summary={summary} onTierChange={handleTierChange} />
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
