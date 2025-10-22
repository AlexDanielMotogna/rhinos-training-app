import React from 'react';
import Icon from '@mdi/react';
import {
  // Strength/Weights
  mdiDumbbell,
  mdiWeight,
  mdiWeightLifter,
  // Cardio/Running
  mdiRun,
  mdiRunFast,
  mdiWalk,
  mdiHiking,
  // Cycling
  mdiBike,
  // Swimming
  mdiSwim,
  mdiPool,
  // Sports/Activities
  mdiYoga,
  mdiMeditation,
  mdiJumpRope,
  // Body parts/exercises
  mdiHumanHandsup,
  mdiHumanHandsdown,
  mdiKarate,
  // General fitness
  mdiHeartPulse,
  mdiStairs,
  mdiHumanMale,
} from '@mdi/js';
import type { ExerciseCategory } from '../types/exercise';
import { packersColors } from '../theme';

/**
 * Get icon path for exercise based on name and category
 * Using Material Design Icons for better exercise representation
 */
export function getExerciseIcon(exerciseName: string, category: ExerciseCategory, color?: string): React.ReactNode {
  const name = exerciseName.toLowerCase();
  const iconSize = 1.2; // MDI uses size in rem units
  const iconColor = color || 'currentColor'; // Use provided color or inherit from parent

  // Strength exercises - specific icon matching
  if (category === 'Strength') {
    if (name.includes('squat')) return <Icon path={mdiWeightLifter} size={iconSize} color={iconColor} />;
    if (name.includes('bench')) return <Icon path={mdiWeight} size={iconSize} color={iconColor} />;
    if (name.includes('press') && !name.includes('bench')) return <Icon path={mdiWeight} size={iconSize} color={iconColor} />;
    if (name.includes('deadlift')) return <Icon path={mdiWeightLifter} size={iconSize} color={iconColor} />;
    if (name.includes('pull') || name.includes('row') || name.includes('lat')) return <Icon path={mdiWeight} size={iconSize} color={iconColor} />;
    if (name.includes('curl') || name.includes('bicep') || name.includes('tricep')) return <Icon path={mdiDumbbell} size={iconSize} color={iconColor} />;
    if (name.includes('leg') || name.includes('calf') || name.includes('lunge')) return <Icon path={mdiWeightLifter} size={iconSize} color={iconColor} />;
    if (name.includes('cable')) return <Icon path={mdiWeight} size={iconSize} color={iconColor} />;
    if (name.includes('dumbbell')) return <Icon path={mdiDumbbell} size={iconSize} color={iconColor} />;
    return <Icon path={mdiWeight} size={iconSize} color={iconColor} />; // Default strength
  }

  // Conditioning / Cardio
  if (category === 'Conditioning') {
    if (name.includes('swim')) return <Icon path={mdiSwim} size={iconSize} color={iconColor} />;
    if (name.includes('pool')) return <Icon path={mdiPool} size={iconSize} color={iconColor} />;
    if (name.includes('run') || name.includes('jog')) return <Icon path={mdiRun} size={iconSize} color={iconColor} />;
    if (name.includes('sprint')) return <Icon path={mdiRunFast} size={iconSize} color={iconColor} />;
    if (name.includes('walk')) return <Icon path={mdiWalk} size={iconSize} color={iconColor} />;
    if (name.includes('hik')) return <Icon path={mdiHiking} size={iconSize} color={iconColor} />;
    if (name.includes('cycl') || name.includes('bike') || name.includes('biking')) return <Icon path={mdiBike} size={iconSize} color={iconColor} />;
    if (name.includes('jump') || name.includes('rope')) return <Icon path={mdiJumpRope} size={iconSize} color={iconColor} />;
    if (name.includes('row') && !name.includes('barbell')) return <Icon path={mdiHeartPulse} size={iconSize} color={iconColor} />;
    if (name.includes('elliptical') || name.includes('stair')) return <Icon path={mdiStairs} size={iconSize} color={iconColor} />;
    return <Icon path={mdiHeartPulse} size={iconSize} color={iconColor} />; // Default cardio
  }

  // Speed
  if (category === 'Speed') {
    if (name.includes('sprint')) return <Icon path={mdiRunFast} size={iconSize} color={iconColor} />;
    if (name.includes('dash') || name.includes('fly')) return <Icon path={mdiRunFast} size={iconSize} color={iconColor} />;
    return <Icon path={mdiRun} size={iconSize} color={iconColor} />;
  }

  // Plyometrics
  if (category === 'Plyometrics') {
    if (name.includes('jump')) return <Icon path={mdiJumpRope} size={iconSize} color={iconColor} />;
    if (name.includes('box')) return <Icon path={mdiHumanHandsup} size={iconSize} color={iconColor} />;
    return <Icon path={mdiHumanHandsup} size={iconSize} color={iconColor} />;
  }

  // Mobility
  if (category === 'Mobility') {
    if (name.includes('yoga')) return <Icon path={mdiYoga} size={iconSize} color={iconColor} />;
    if (name.includes('pilates')) return <Icon path={mdiHumanHandsup} size={iconSize} color={iconColor} />;
    if (name.includes('stretch')) return <Icon path={mdiHumanHandsup} size={iconSize} color={iconColor} />;
    return <Icon path={mdiYoga} size={iconSize} color={iconColor} />;
  }

  // Recovery
  if (category === 'Recovery') {
    if (name.includes('meditat') || name.includes('breath')) return <Icon path={mdiMeditation} size={iconSize} color={iconColor} />;
    if (name.includes('foam') || name.includes('massage')) return <Icon path={mdiHumanHandsdown} size={iconSize} color={iconColor} />;
    if (name.includes('walk')) return <Icon path={mdiWalk} size={iconSize} color={iconColor} />;
    return <Icon path={mdiMeditation} size={iconSize} color={iconColor} />;
  }

  // COD (Change of Direction)
  if (category === 'COD') {
    return <Icon path={mdiKarate} size={iconSize} color={iconColor} />;
  }

  // Technique
  if (category === 'Technique') {
    return <Icon path={mdiHumanHandsdown} size={iconSize} color={iconColor} />;
  }

  // Default fallback
  return <Icon path={mdiHumanMale} size={iconSize} color={iconColor} />;
}

/**
 * Get category icon for workout plans
 */
export function getCategoryIcon(category: ExerciseCategory, size: number = 1): React.ReactNode {
  switch (category) {
    case 'Strength':
      return <Icon path={mdiWeightLifter} size={size} />;
    case 'Conditioning':
      return <Icon path={mdiHeartPulse} size={size} />;
    case 'Speed':
      return <Icon path={mdiRunFast} size={size} />;
    case 'Plyometrics':
      return <Icon path={mdiJumpRope} size={size} />;
    case 'Mobility':
      return <Icon path={mdiYoga} size={size} />;
    case 'Recovery':
      return <Icon path={mdiMeditation} size={size} />;
    case 'COD':
      return <Icon path={mdiKarate} size={size} />;
    case 'Technique':
      return <Icon path={mdiHumanHandsdown} size={size} />;
    default:
      return <Icon path={mdiWeight} size={size} />;
  }
}

/**
 * Get background gradient for category
 * Using centralized Green Bay Packers Gold colors from theme
 */
export function getCategoryGradient(category: ExerciseCategory): string {
  const { gold } = packersColors;

  switch (category) {
    case 'Strength':
      return `linear-gradient(135deg, ${gold.main} 0%, ${gold.dark} 100%)`; // Classic Gold
    case 'Conditioning':
      return `linear-gradient(135deg, ${gold.light} 0%, ${gold.main} 100%)`; // Light Gold
    case 'Speed':
      return `linear-gradient(135deg, ${gold.bright} 0%, ${gold.light} 100%)`; // Bright Gold
    case 'Plyometrics':
      return `linear-gradient(135deg, ${gold.dark} 0%, ${gold.darker} 100%)`; // Dark Gold
    case 'Mobility':
      return `linear-gradient(135deg, ${gold.main} 0%, ${gold.bright} 100%)`; // Gold to Light
    case 'Recovery':
      return `linear-gradient(135deg, ${gold.darker} 0%, ${gold.bronze} 100%)`; // Bronze Gold
    case 'COD':
      return `linear-gradient(135deg, ${gold.light} 0%, ${gold.dark} 100%)`; // Medium Gold
    case 'Technique':
      return `linear-gradient(135deg, ${gold.bright} 0%, ${gold.main} 100%)`; // Bright to Classic
    default:
      return `linear-gradient(135deg, ${gold.main} 0%, ${gold.dark} 100%)`;
  }
}
