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
import { packersColors } from '../theme';

/**
 * Get icon component for exercise based on name and category
 */
export function getExerciseIcon(exerciseName: string, category: ExerciseCategory): React.ReactNode {
  const name = exerciseName.toLowerCase();

  // Strength exercises - More specific icon matching
  if (category === 'Strength') {
    if (name.includes('squat')) return <GiWeightLiftingUp size={24} />; // Barbell squat
    if (name.includes('bench')) return <GiBiceps size={24} />; // Bench press
    if (name.includes('press') && !name.includes('bench')) return <GiStrongMan size={24} />; // Overhead/shoulder press
    if (name.includes('deadlift')) return <GiWeightLiftingUp size={24} />; // Deadlift
    if (name.includes('pull') || name.includes('row')) return <FaDumbbell size={24} />; // Back exercises
    if (name.includes('curl')) return <GiBiceps size={24} />; // Arm curls
    if (name.includes('tricep')) return <FaDumbbell size={24} />; // Tricep work
    if (name.includes('leg') || name.includes('calf')) return <GiStrongMan size={24} />; // Leg exercises
    if (name.includes('lunge')) return <IoMdFitness size={24} />; // Lunges
    if (name.includes('cable') || name.includes('lat')) return <FaDumbbell size={24} />; // Cable/lat exercises
    return <FitnessCenterIcon style={{ fontSize: 24 }} />; // Default strength
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
