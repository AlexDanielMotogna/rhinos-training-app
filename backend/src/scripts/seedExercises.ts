import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

const standardExercises = [
  // STRENGTH - Compound Lifts
  {
    name: 'Barbell Back Squat',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8',
    muscleGroups: ['legs', 'core'],
    descriptionEN: 'King of lower body exercises. Builds overall leg strength and power.',
    descriptionDE: 'König der Unterkörperübungen. Baut allgemeine Beinkraft und Kraft auf.',
  },
  {
    name: 'Barbell Front Squat',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=uYumuL_G_V0',
    muscleGroups: ['legs', 'core'],
    descriptionEN: 'Front-loaded squat variation that emphasizes quads and core stability.',
    descriptionDE: 'Frontal belastete Kniebeuge-Variante, die Quadrizeps und Rumpfstabilität betont.',
  },
  {
    name: 'Deadlift',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q',
    muscleGroups: ['legs', 'back', 'core'],
    descriptionEN: 'Essential posterior chain exercise. Builds total body strength.',
    descriptionDE: 'Wesentliche hintere Kettenübung. Baut Ganzkörperkraft auf.',
  },
  {
    name: 'Romanian Deadlift',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=2SHsk9AzdjA',
    muscleGroups: ['legs', 'back'],
    descriptionEN: 'Targets hamstrings and glutes with controlled hip hinge movement.',
    descriptionDE: 'Zielt auf Oberschenkelrückseite und Gesäß mit kontrollierter Hüftbewegung.',
  },
  {
    name: 'Barbell Bench Press',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
    muscleGroups: ['chest', 'shoulders', 'arms'],
    descriptionEN: 'Primary upper body pushing exercise for chest development.',
    descriptionDE: 'Primäre Oberkörper-Drückübung für Brustentwicklung.',
  },
  {
    name: 'Incline Barbell Bench Press',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=SrqOu55lrYU',
    muscleGroups: ['chest', 'shoulders', 'arms'],
    descriptionEN: 'Targets upper chest with angled pressing movement.',
    descriptionDE: 'Zielt auf obere Brust mit abgewinkelter Drückbewegung.',
  },
  {
    name: 'Barbell Overhead Press',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
    muscleGroups: ['shoulders', 'arms', 'core'],
    descriptionEN: 'Fundamental overhead pressing movement for shoulder strength.',
    descriptionDE: 'Grundlegende Überkopf-Drückbewegung für Schulterkraft.',
  },
  {
    name: 'Barbell Row',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=FWJR5Ve8bnQ',
    muscleGroups: ['back', 'arms'],
    descriptionEN: 'Key horizontal pulling exercise for back thickness.',
    descriptionDE: 'Wichtige horizontale Zugübung für Rückendicke.',
  },
  {
    name: 'Pull-ups',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
    muscleGroups: ['back', 'arms'],
    descriptionEN: 'Vertical pulling exercise using bodyweight for back and arm strength.',
    descriptionDE: 'Vertikale Zugübung mit Körpergewicht für Rücken- und Armkraft.',
  },
  {
    name: 'Chin-ups',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=brhRXlOhkAM',
    muscleGroups: ['back', 'arms'],
    descriptionEN: 'Underhand grip pull-up variation emphasizing biceps.',
    descriptionDE: 'Untergriff-Klimmzug-Variante mit Betonung auf Bizeps.',
  },

  // STRENGTH - Accessory Work
  {
    name: 'Dumbbell Bench Press',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=VmB1G1K7v94',
    muscleGroups: ['chest', 'shoulders', 'arms'],
    descriptionEN: 'Allows greater range of motion than barbell for chest development.',
    descriptionDE: 'Ermöglicht größeren Bewegungsumfang als Langhantel für Brustentwicklung.',
  },
  {
    name: 'Dumbbell Shoulder Press',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=qEwKCR5JCog',
    muscleGroups: ['shoulders', 'arms'],
    descriptionEN: 'Unilateral shoulder pressing for balanced development.',
    descriptionDE: 'Einseitiges Schulterdrücken für ausgeglichene Entwicklung.',
  },
  {
    name: 'Dumbbell Row',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=roCP6wCXPqo',
    muscleGroups: ['back', 'arms'],
    descriptionEN: 'Single-arm rowing movement for back development.',
    descriptionDE: 'Einarmige Ruderbewegung für Rückenentwicklung.',
  },
  {
    name: 'Lunges',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
    muscleGroups: ['legs', 'core'],
    descriptionEN: 'Unilateral leg exercise for balance and strength.',
    descriptionDE: 'Einseitige Beinübung für Balance und Kraft.',
  },
  {
    name: 'Bulgarian Split Squat',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=2C-uNgKwPLE',
    muscleGroups: ['legs', 'core'],
    descriptionEN: 'Advanced single-leg squat variation for leg strength.',
    descriptionDE: 'Fortgeschrittene Einbein-Kniebeuge-Variante für Beinkraft.',
  },
  {
    name: 'Leg Press',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
    muscleGroups: ['legs'],
    descriptionEN: 'Machine-based leg exercise for quad and glute development.',
    descriptionDE: 'Maschinenbasierte Beinübung für Quadrizeps- und Gesäßentwicklung.',
  },
  {
    name: 'Leg Curl',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=ELOCsoDSmrg',
    muscleGroups: ['legs'],
    descriptionEN: 'Isolation exercise for hamstring development.',
    descriptionDE: 'Isolationsübung für Oberschenkelrückseitenentwicklung.',
  },
  {
    name: 'Leg Extension',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=YyvSfVjQeL0',
    muscleGroups: ['legs'],
    descriptionEN: 'Isolation exercise for quadriceps development.',
    descriptionDE: 'Isolationsübung für Quadrizepsentwicklung.',
  },
  {
    name: 'Hip Thrust',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=SEdqd1n0cvg',
    muscleGroups: ['legs', 'core'],
    descriptionEN: 'Glute-focused exercise for hip extension power.',
    descriptionDE: 'Gesäß-fokussierte Übung für Hüftstreckungskraft.',
  },
  {
    name: 'Cable Row',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=GZbfZ033f74',
    muscleGroups: ['back', 'arms'],
    descriptionEN: 'Seated rowing exercise for mid-back development.',
    descriptionDE: 'Sitzende Ruderübung für mittlere Rückenentwicklung.',
  },
  {
    name: 'Lat Pulldown',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
    muscleGroups: ['back', 'arms'],
    descriptionEN: 'Machine-based vertical pulling for lat development.',
    descriptionDE: 'Maschinenbasiertes vertikales Ziehen für Latentwicklung.',
  },
  {
    name: 'Face Pulls',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk',
    muscleGroups: ['shoulders', 'back'],
    descriptionEN: 'Cable exercise for rear deltoid and upper back health.',
    descriptionDE: 'Kabelübung für hintere Schulter und oberen Rücken.',
  },
  {
    name: 'Bicep Curls',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
    muscleGroups: ['arms'],
    descriptionEN: 'Isolation exercise for bicep development.',
    descriptionDE: 'Isolationsübung für Bizepsentwicklung.',
  },
  {
    name: 'Tricep Dips',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=6kALZikXxLc',
    muscleGroups: ['arms', 'chest'],
    descriptionEN: 'Bodyweight exercise for tricep and chest development.',
    descriptionDE: 'Körpergewichtsübung für Trizeps- und Brustentwicklung.',
  },
  {
    name: 'Skull Crushers',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=d_KZxkY_0cM',
    muscleGroups: ['arms'],
    descriptionEN: 'Lying tricep extension for arm strength.',
    descriptionDE: 'Liegende Trizepsstreckung für Armkraft.',
  },

  // PLYOMETRICS & POWER
  {
    name: 'Box Jumps',
    category: 'Plyometrics',
    youtubeUrl: 'https://www.youtube.com/watch?v=NBY9-kTuHEk',
    muscleGroups: ['legs', 'core'],
    descriptionEN: 'Explosive jumping exercise for lower body power.',
    descriptionDE: 'Explosive Sprungübung für Unterkörperkraft.',
  },
  {
    name: 'Depth Jumps',
    category: 'Plyometrics',
    youtubeUrl: 'https://www.youtube.com/watch?v=qU35AOa_Gk0',
    muscleGroups: ['legs', 'core'],
    descriptionEN: 'Advanced plyometric for reactive strength development.',
    descriptionDE: 'Fortgeschrittene Plyometrie für reaktive Kraftentwicklung.',
  },
  {
    name: 'Broad Jumps',
    category: 'Plyometrics',
    youtubeUrl: 'https://www.youtube.com/watch?v=MyvbIFToQHI',
    muscleGroups: ['legs', 'core'],
    descriptionEN: 'Horizontal jumping for explosive power.',
    descriptionDE: 'Horizontales Springen für explosive Kraft.',
  },
  {
    name: 'Medicine Ball Slams',
    category: 'Plyometrics',
    youtubeUrl: 'https://www.youtube.com/watch?v=EXaYr1Ae8fk',
    muscleGroups: ['full-body', 'core'],
    descriptionEN: 'Full body explosive exercise for power and conditioning.',
    descriptionDE: 'Ganzkörper-explosive Übung für Kraft und Konditionierung.',
  },
  {
    name: 'Clap Push-ups',
    category: 'Plyometrics',
    youtubeUrl: 'https://www.youtube.com/watch?v=uJ6HPU7Qosk',
    muscleGroups: ['chest', 'arms', 'core'],
    descriptionEN: 'Explosive upper body plyometric exercise.',
    descriptionDE: 'Explosive Oberkörper-Plyometrie-Übung.',
  },

  // SPEED & CONDITIONING
  {
    name: 'Sprint Training',
    category: 'Speed',
    youtubeUrl: 'https://www.youtube.com/watch?v=VrwnxX5wgqE',
    muscleGroups: ['legs', 'full-body'],
    descriptionEN: 'Maximum velocity running for speed development.',
    descriptionDE: 'Maximales Geschwindigkeitslaufen für Geschwindigkeitsentwicklung.',
  },
  {
    name: 'Hill Sprints',
    category: 'Speed',
    youtubeUrl: 'https://www.youtube.com/watch?v=CTPYJJGzlem',
    muscleGroups: ['legs', 'core'],
    descriptionEN: 'Uphill sprinting for power and conditioning.',
    descriptionDE: 'Bergauf-Sprint für Kraft und Konditionierung.',
  },
  {
    name: 'Sled Push',
    category: 'Conditioning',
    youtubeUrl: 'https://www.youtube.com/watch?v=rvSzQSP-bd0',
    muscleGroups: ['legs', 'full-body'],
    descriptionEN: 'Weighted sled pushing for strength and conditioning.',
    descriptionDE: 'Gewichteter Schlittenschub für Kraft und Konditionierung.',
  },
  {
    name: 'Sled Pull',
    category: 'Conditioning',
    youtubeUrl: 'https://www.youtube.com/watch?v=eQh0Dit-Ul4',
    muscleGroups: ['legs', 'back', 'full-body'],
    descriptionEN: 'Backward sled pulling for posterior chain and conditioning.',
    descriptionDE: 'Rückwärts Schlittenziehen für hintere Kette und Konditionierung.',
  },
  {
    name: 'Prowler Push',
    category: 'Conditioning',
    youtubeUrl: 'https://www.youtube.com/watch?v=4M32hZ3ogXk',
    muscleGroups: ['legs', 'full-body'],
    descriptionEN: 'Heavy prowler pushing for power and work capacity.',
    descriptionDE: 'Schweres Prowler-Schieben für Kraft und Arbeitskapazität.',
  },
  {
    name: 'Battle Ropes',
    category: 'Conditioning',
    youtubeUrl: 'https://www.youtube.com/watch?v=u0MAvLLmB7A',
    muscleGroups: ['arms', 'shoulders', 'core'],
    descriptionEN: 'Wave exercises with heavy ropes for conditioning.',
    descriptionDE: 'Wellenübungen mit schweren Seilen für Konditionierung.',
  },
  {
    name: 'Rowing Machine',
    category: 'Conditioning',
    youtubeUrl: 'https://www.youtube.com/watch?v=zQ82RYIFLN8',
    muscleGroups: ['full-body'],
    descriptionEN: 'Full body cardio machine for endurance.',
    descriptionDE: 'Ganzkörper-Cardio-Gerät für Ausdauer.',
  },
  {
    name: 'Assault Bike',
    category: 'Conditioning',
    youtubeUrl: 'https://www.youtube.com/watch?v=5nchdFCF_P8',
    muscleGroups: ['full-body'],
    descriptionEN: 'Air bike for high-intensity interval training.',
    descriptionDE: 'Luftfahrrad für hochintensives Intervalltraining.',
  },
  {
    name: 'Running (Steady State)',
    category: 'Conditioning',
    youtubeUrl: 'https://www.youtube.com/watch?v=brFHyOtTwH4',
    muscleGroups: ['legs', 'full-body'],
    descriptionEN: 'Continuous running at moderate pace for aerobic conditioning.',
    descriptionDE: 'Kontinuierliches Laufen in moderatem Tempo für aerobe Konditionierung.',
  },
  {
    name: 'Cycling',
    category: 'Conditioning',
    youtubeUrl: 'https://www.youtube.com/watch?v=zy5K8ApSGf4',
    muscleGroups: ['legs'],
    descriptionEN: 'Low-impact cardio exercise on bicycle.',
    descriptionDE: 'Gelenkschonendes Cardio-Training auf dem Fahrrad.',
  },
  {
    name: 'Swimming',
    category: 'Conditioning',
    youtubeUrl: 'https://www.youtube.com/watch?v=5HLW2AI1Ink',
    muscleGroups: ['full-body'],
    descriptionEN: 'Full body low-impact cardio in water.',
    descriptionDE: 'Ganzkörper-gelenkschonendes Cardio im Wasser.',
  },

  // CHANGE OF DIRECTION (COD)
  {
    name: 'Pro Agility Drill (5-10-5)',
    category: 'COD',
    youtubeUrl: 'https://www.youtube.com/watch?v=jnBDGo0C5Vs',
    muscleGroups: ['legs', 'core'],
    descriptionEN: 'Standard agility test with direction changes.',
    descriptionDE: 'Standard-Agilitätstest mit Richtungswechseln.',
  },
  {
    name: 'L-Drill (3-Cone Drill)',
    category: 'COD',
    youtubeUrl: 'https://www.youtube.com/watch?v=jmw84mfhCLE',
    muscleGroups: ['legs', 'core'],
    descriptionEN: 'Cone drill for agility and change of direction.',
    descriptionDE: 'Hütchenübung für Agilität und Richtungswechsel.',
  },
  {
    name: 'Shuttle Runs',
    category: 'COD',
    youtubeUrl: 'https://www.youtube.com/watch?v=TUpCKBjA7X8',
    muscleGroups: ['legs', 'full-body'],
    descriptionEN: 'Back and forth sprinting for agility.',
    descriptionDE: 'Hin- und Hersprint für Agilität.',
  },
  {
    name: 'Lateral Shuffle',
    category: 'COD',
    youtubeUrl: 'https://www.youtube.com/watch?v=gj7M9wog4fM',
    muscleGroups: ['legs', 'core'],
    descriptionEN: 'Side-to-side movement for lateral quickness.',
    descriptionDE: 'Seitwärtsbewegung für seitliche Schnelligkeit.',
  },
  {
    name: 'Carioca Drill',
    category: 'COD',
    youtubeUrl: 'https://www.youtube.com/watch?v=mmjQlKXqMBQ',
    muscleGroups: ['legs', 'core'],
    descriptionEN: 'Crossover running drill for hip mobility and coordination.',
    descriptionDE: 'Überkreuz-Laufübung für Hüftmobilität und Koordination.',
  },

  // MOBILITY & FLEXIBILITY
  {
    name: 'Dynamic Stretching Routine',
    category: 'Mobility',
    youtubeUrl: 'https://www.youtube.com/watch?v=FSSDLDhbacc',
    muscleGroups: ['full-body'],
    descriptionEN: 'Full body dynamic stretches for warm-up.',
    descriptionDE: 'Ganzkörper-dynamisches Dehnen für Aufwärmen.',
  },
  {
    name: 'Leg Swings',
    category: 'Mobility',
    youtubeUrl: 'https://www.youtube.com/watch?v=2aL_5lNZQhY',
    muscleGroups: ['legs'],
    descriptionEN: 'Dynamic hip mobility exercise.',
    descriptionDE: 'Dynamische Hüftmobilitätsübung.',
  },
  {
    name: 'Hip Circles',
    category: 'Mobility',
    youtubeUrl: 'https://www.youtube.com/watch?v=WC4mzWSc_bs',
    muscleGroups: ['legs', 'core'],
    descriptionEN: 'Hip mobility and activation exercise.',
    descriptionDE: 'Hüftmobilität und Aktivierungsübung.',
  },
  {
    name: 'Foam Rolling',
    category: 'Recovery',
    youtubeUrl: 'https://www.youtube.com/watch?v=vc7HPffJKkw',
    muscleGroups: ['full-body'],
    descriptionEN: 'Self-myofascial release for recovery.',
    descriptionDE: 'Selbst-myofasziale Entspannung für Erholung.',
  },
  {
    name: 'Yoga Flow',
    category: 'Mobility',
    youtubeUrl: 'https://www.youtube.com/watch?v=v7AYKMP6rOE',
    muscleGroups: ['full-body'],
    descriptionEN: 'Flowing yoga sequence for flexibility and mobility.',
    descriptionDE: 'Fließende Yoga-Sequenz für Flexibilität und Mobilität.',
  },
  {
    name: 'Static Stretching',
    category: 'Recovery',
    youtubeUrl: 'https://www.youtube.com/watch?v=g_tea8ZNk5A',
    muscleGroups: ['full-body'],
    descriptionEN: 'Post-workout static stretches for flexibility.',
    descriptionDE: 'Statisches Dehnen nach dem Training für Flexibilität.',
  },

  // CORE
  {
    name: 'Plank',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
    muscleGroups: ['core'],
    descriptionEN: 'Isometric core exercise for stability.',
    descriptionDE: 'Isometrische Rumpfübung für Stabilität.',
  },
  {
    name: 'Side Plank',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=K2VljzCC16g',
    muscleGroups: ['core'],
    descriptionEN: 'Lateral core stability exercise.',
    descriptionDE: 'Seitliche Rumpfstabilitätsübung.',
  },
  {
    name: 'Hanging Leg Raises',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=Pr1ieGZ5atk',
    muscleGroups: ['core', 'arms'],
    descriptionEN: 'Advanced core exercise for lower abs.',
    descriptionDE: 'Fortgeschrittene Rumpfübung für untere Bauchmuskeln.',
  },
  {
    name: 'Russian Twists',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=wkD8rjkodUI',
    muscleGroups: ['core'],
    descriptionEN: 'Rotational core exercise for obliques.',
    descriptionDE: 'Rotationsübung für seitliche Bauchmuskeln.',
  },
  {
    name: 'Ab Wheel Rollout',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=EaByv-aKVQg',
    muscleGroups: ['core', 'arms'],
    descriptionEN: 'Advanced core stability and strength exercise.',
    descriptionDE: 'Fortgeschrittene Rumpfstabilität und Kraftübung.',
  },
  {
    name: 'Cable Woodchops',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=pAplQXk3dkU',
    muscleGroups: ['core', 'shoulders'],
    descriptionEN: 'Rotational power exercise for core.',
    descriptionDE: 'Rotationskraftübung für den Rumpf.',
  },
  {
    name: 'Pallof Press',
    category: 'Strength',
    youtubeUrl: 'https://www.youtube.com/watch?v=AH_QZLm_0-s',
    muscleGroups: ['core'],
    descriptionEN: 'Anti-rotation core stability exercise.',
    descriptionDE: 'Anti-Rotations-Rumpfstabilitätsübung.',
  },

  // TECHNIQUE (Football-specific)
  {
    name: 'Sled Blocking Technique',
    category: 'Technique',
    youtubeUrl: 'https://www.youtube.com/watch?v=X_RThGjk7uA',
    muscleGroups: ['full-body'],
    descriptionEN: 'Football-specific blocking technique with sled.',
    descriptionDE: 'Football-spezifische Blocktechnik mit Schlitten.',
  },
  {
    name: 'Tackling Technique',
    category: 'Technique',
    youtubeUrl: 'https://www.youtube.com/watch?v=QNDxGDx6X_Y',
    muscleGroups: ['full-body'],
    descriptionEN: 'Proper tackling form and technique.',
    descriptionDE: 'Richtige Tackling-Form und Technik.',
  },
  {
    name: 'Ball Security Drills',
    category: 'Technique',
    youtubeUrl: 'https://www.youtube.com/watch?v=rPx4YKkr0wg',
    muscleGroups: ['arms', 'core'],
    descriptionEN: 'Ball carrying and protection techniques.',
    descriptionDE: 'Balltrage- und Schutztechniken.',
  },
  {
    name: 'Footwork Ladder Drills',
    category: 'Technique',
    youtubeUrl: 'https://www.youtube.com/watch?v=f5_NvcCL5s4',
    muscleGroups: ['legs'],
    descriptionEN: 'Agility ladder for footwork and coordination.',
    descriptionDE: 'Koordinationsleiter für Fußarbeit und Koordination.',
  },
];

async function seedExercises() {
  console.log('[SEED] Starting exercises seed...');

  try {
    // Find the first coach user to assign as creator
    const coach = await prisma.user.findFirst({
      where: { role: 'coach' },
    });

    if (!coach) {
      console.error('[SEED ERROR] No coach found in database. Please create a coach user first.');
      return;
    }

    console.log(`[SEED] Using coach ${coach.email} as creator`);

    let created = 0;
    let skipped = 0;

    // Create exercises
    for (const exercise of standardExercises) {
      const existing = await prisma.exercise.findUnique({
        where: { name: exercise.name },
      });

      if (existing) {
        console.log(`[SEED] Exercise "${exercise.name}" already exists, skipping...`);
        skipped++;
        continue;
      }

      await prisma.exercise.create({
        data: {
          ...exercise,
          createdBy: coach.id,
          isGlobal: true,
          isCustom: false,
          positionTags: [], // Empty = available for all positions
        },
      });

      created++;
      console.log(`[SEED] ✓ Created: ${exercise.name} (${exercise.category})`);
    }

    console.log(`\n[SEED] ✅ Exercises seed completed!`);
    console.log(`[SEED] Created: ${created} exercises`);
    console.log(`[SEED] Skipped: ${skipped} exercises (already exist)`);
    console.log(`[SEED] Total: ${standardExercises.length} exercises in catalog`);
  } catch (error) {
    console.error('[SEED ERROR] Failed to seed exercises:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedExercises();
