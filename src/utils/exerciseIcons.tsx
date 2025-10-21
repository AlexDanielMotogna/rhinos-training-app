import React from 'react';
import {
  GiWeightLiftingUp,
  GiRun,
  GiJumpingRope,
  GiMeditation,
  GiBiceps,
  GiStrongMan,
} from 'react-icons/gi';
import {
  MdDirectionsRun,
  MdPool,
  MdDirectionsBike,
  MdSportsGymnastics,
  MdSelfImprovement,
  MdHiking,
} from 'react-icons/md';
import {
  FaDumbbell,
  FaRunning,
  FaWalking,
  FaHeartbeat,
} from 'react-icons/fa';
import {
  IoMdFitness,
} from 'react-icons/io';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import type { ExerciseCategory } from '../types/exercise';

/**
 * Get icon component for exercise based on name and category
 */
export function getExerciseIcon(exerciseName: string, category: ExerciseCategory): React.ReactNode {
  const name = exerciseName.toLowerCase();

  // Strength exercises
  if (category === 'Strength') {
    if (name.includes('squat')) return <GiStrongMan size={24} />;
    if (name.includes('bench') || name.includes('press')) return <GiBiceps size={24} />;
    if (name.includes('deadlift')) return <GiWeightLiftingUp size={24} />;
    if (name.includes('pull') || name.includes('row')) return <FaDumbbell size={24} />;
    if (name.includes('curl') || name.includes('tricep') || name.includes('bicep')) return <GiBiceps size={24} />;
    if (name.includes('leg') || name.includes('calf')) return <IoMdFitness size={24} />;
    return <FitnessCenterIcon style={{ fontSize: 24 }} />;
  }

  // Conditioning / Cardio
  if (category === 'Conditioning') {
    if (name.includes('swim')) return <MdPool size={24} />;
    if (name.includes('run') || name.includes('jog')) return <MdDirectionsRun size={24} />;
    if (name.includes('cycl') || name.includes('bike') || name.includes('biking')) return <MdDirectionsBike size={24} />;
    if (name.includes('walk')) return <FaWalking size={24} />;
    if (name.includes('hik')) return <MdHiking size={24} />;
    if (name.includes('jump') || name.includes('rope')) return <GiJumpingRope size={24} />;
    if (name.includes('row')) return <FaHeartbeat size={24} />;
    if (name.includes('elliptical') || name.includes('stair')) return <FaRunning size={24} />;
    return <MdDirectionsRun size={24} />;
  }

  // Speed
  if (category === 'Speed') {
    if (name.includes('sprint')) return <GiRun size={24} />;
    if (name.includes('dash') || name.includes('fly')) return <MdDirectionsRun size={24} />;
    return <FaRunning size={24} />;
  }

  // Plyometrics
  if (category === 'Plyometrics') {
    if (name.includes('jump')) return <GiJumpingRope size={24} />;
    if (name.includes('box')) return <IoMdFitness size={24} />;
    return <MdSportsGymnastics size={24} />;
  }

  // Mobility
  if (category === 'Mobility') {
    if (name.includes('yoga') || name.includes('pilates')) return <MdSelfImprovement size={24} />;
    if (name.includes('stretch')) return <MdSportsGymnastics size={24} />;
    return <MdSelfImprovement size={24} />;
  }

  // Recovery
  if (category === 'Recovery') {
    if (name.includes('meditat') || name.includes('breath')) return <GiMeditation size={24} />;
    if (name.includes('foam') || name.includes('massage')) return <MdSelfImprovement size={24} />;
    if (name.includes('walk')) return <FaWalking size={24} />;
    return <MdSelfImprovement size={24} />;
  }

  // COD (Change of Direction)
  if (category === 'COD') {
    return <FaRunning size={24} />;
  }

  // Technique
  if (category === 'Technique') {
    return <MdSportsGymnastics size={24} />;
  }

  // Default fallback
  return <FitnessCenterIcon style={{ fontSize: 24 }} />;
}

/**
 * Get category icon for workout plans
 */
export function getCategoryIcon(category: ExerciseCategory, size: number = 40): React.ReactNode {
  switch (category) {
    case 'Strength':
      return <GiWeightLiftingUp size={size} />;
    case 'Conditioning':
      return <MdDirectionsRun size={size} />;
    case 'Speed':
      return <FaRunning size={size} />;
    case 'Plyometrics':
      return <GiJumpingRope size={size} />;
    case 'Mobility':
      return <MdSelfImprovement size={size} />;
    case 'Recovery':
      return <GiMeditation size={size} />;
    case 'COD':
      return <MdDirectionsRun size={size} />;
    case 'Technique':
      return <MdSportsGymnastics size={size} />;
    default:
      return <FitnessCenterIcon style={{ fontSize: size }} />;
  }
}

/**
 * Get background gradient for category
 */
export function getCategoryGradient(category: ExerciseCategory): string {
  switch (category) {
    case 'Strength':
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    case 'Conditioning':
      return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    case 'Speed':
      return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    case 'Plyometrics':
      return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
    case 'Mobility':
      return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
    case 'Recovery':
      return 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)';
    case 'COD':
      return 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    case 'Technique':
      return 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)';
    default:
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }
}
