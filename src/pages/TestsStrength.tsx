import React, { useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useI18n } from '../i18n/I18nProvider';
import { StrengthWizard } from '../components/tests/StrengthWizard';
import { StrengthSummary as StrengthSummaryComponent } from '../components/tests/StrengthSummary';
import { getUser } from '../services/mock';
import { getBenchmarks } from '../services/benchmarks';
import {
  getSegmentMetric,
  segmentScore,
  strengthIndex,
  labelFromIndex,
} from '../services/strengthCalc';
import type {
  StrengthResult,
  StrengthSummary,
  Tier,
  Segment,
  Sex,
} from '../types/testing';

const segments: Segment[] = ['legs', 'arms', 'back', 'shoulders', 'core'];

export const TestsStrength: React.FC = () => {
  const { t } = useI18n();
  const user = getUser();
  const [testResults, setTestResults] = useState<StrengthResult[] | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier>('semi');
  const [summary, setSummary] = useState<StrengthSummary | null>(null);
  const [saved, setSaved] = useState(false);

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">User not found</Alert>
      </Box>
    );
  }

  const bodyWeightKg = user.weightKg || 75;
  const position = (user.position || 'RB') as any;
  const sex = (user.sex || 'male') as Sex;

  const handleWizardFinish = (results: StrengthResult[]) => {
    setTestResults(results);
    computeSummary(results, selectedTier);
  };

  const computeSummary = (results: StrengthResult[], tier: Tier) => {
    const benchmarks = getBenchmarks(position, sex);

    const bySegment: Record<Segment, { score: number; detail: string }> = {} as any;

    segments.forEach(segment => {
      const metric = getSegmentMetric(segment, results);
      const benchmark = benchmarks[segment];
      const target = benchmark.tierTargets[tier];

      if (metric === undefined) {
        bySegment[segment] = { score: 0, detail: t('tests.notTested') };
        return;
      }

      const score = segmentScore(segment, metric, target.value, target.unit);
      const detailValue =
        target.unit === 's'
          ? `${metric.toFixed(0)}s / ${target.value}s`
          : `${metric.toFixed(2)}× BW / ${target.value.toFixed(2)}× BW`;

      bySegment[segment] = { score, detail: detailValue };
    });

    const scores: Record<Segment, number> = {
      legs: bySegment.legs.score,
      arms: bySegment.arms.score,
      back: bySegment.back.score,
      shoulders: bySegment.shoulders.score,
      core: bySegment.core.score,
    };

    const index = strengthIndex(scores);
    const label = labelFromIndex(index);

    const newSummary: StrengthSummary = {
      byTest: results,
      bySegment,
      strengthIndex: index,
      label,
      tier,
      dateISO: new Date().toISOString(),
    };

    setSummary(newSummary);
  };

  const handleTierChange = (tier: Tier) => {
    setSelectedTier(tier);
    if (testResults) {
      computeSummary(testResults, tier);
    }
  };

  const handleSave = () => {
    if (summary) {
      // Save previous test before overwriting
      const previousTest = localStorage.getItem('lastStrengthTest');
      if (previousTest) {
        localStorage.setItem('lastStrengthTest_previous', previousTest);
      }

      // Save new test
      localStorage.setItem('lastStrengthTest', JSON.stringify(summary));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom>
        {t('tests.strengthSolo')}
      </Typography>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t('tests.resultsSaved')}
        </Alert>
      )}

      {!summary ? (
        <StrengthWizard bodyWeightKg={bodyWeightKg} onFinish={handleWizardFinish} />
      ) : (
        <StrengthSummaryComponent
          summary={summary}
          onTierChange={handleTierChange}
          onSave={handleSave}
        />
      )}
    </Box>
  );
};
