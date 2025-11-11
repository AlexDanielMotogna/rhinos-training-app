/**
 * Seed Training Videos
 * Populates the database with high-quality football training videos from YouTube
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VideoSeed {
  type: 'position' | 'route' | 'coverage' | 'run';
  title: string;
  description: string;
  youtubeUrl: string;
  status: 'published';
  level?: 'intro' | 'intermediate' | 'advanced';
  unit?: 'Offense' | 'Defense' | 'Special Teams';
  positions?: string[];
  routes?: string[];
  coverages?: string[];
  runs?: string[];
  isPinned?: boolean;
  order: number;
}

const trainingVideos: VideoSeed[] = [
  // ========================================
  // QUARTERBACK VIDEOS
  // ========================================
  {
    type: 'position',
    title: 'Quarterback Footwork Fundamentals',
    description: 'Master the fundamentals of QB footwork including 3-step, 5-step, and 7-step drops. Essential mechanics for every quarterback.',
    youtubeUrl: 'https://www.youtube.com/watch?v=qnKDbn7vY0c',
    status: 'published',
    level: 'intro',
    unit: 'Offense',
    positions: ['QB'],
    isPinned: true,
    order: 1,
  },
  {
    type: 'position',
    title: 'QB Throwing Mechanics - Grip, Release & Follow Through',
    description: 'Learn proper throwing mechanics including grip, arm motion, hip rotation, and follow-through for accurate passing.',
    youtubeUrl: 'https://www.youtube.com/watch?v=4KSZ0W3eYHk',
    status: 'published',
    level: 'intro',
    unit: 'Offense',
    positions: ['QB'],
    order: 2,
  },
  {
    type: 'position',
    title: 'Reading Defenses - Pre-Snap QB Keys',
    description: 'Advanced breakdown of pre-snap reads, identifying coverages, and making the right protection calls.',
    youtubeUrl: 'https://www.youtube.com/watch?v=HLv6hYjN8Fw',
    status: 'published',
    level: 'advanced',
    unit: 'Offense',
    positions: ['QB'],
    order: 3,
  },

  // ========================================
  // WIDE RECEIVER VIDEOS
  // ========================================
  {
    type: 'position',
    title: 'Wide Receiver Stance and Releases',
    description: 'Proper WR stance, various release techniques vs press and off coverage, and getting into your route cleanly.',
    youtubeUrl: 'https://www.youtube.com/watch?v=5FMW5DG3XHc',
    status: 'published',
    level: 'intro',
    unit: 'Offense',
    positions: ['WR'],
    isPinned: true,
    order: 4,
  },
  {
    type: 'position',
    title: 'Route Running Fundamentals for WRs',
    description: 'Breaking down proper route running including stem, break point, and acceleration out of breaks.',
    youtubeUrl: 'https://www.youtube.com/watch?v=dIXjNttUYRs',
    status: 'published',
    level: 'intro',
    unit: 'Offense',
    positions: ['WR', 'TE'],
    order: 5,
  },
  {
    type: 'position',
    title: 'Catching Technique - Hands, Eyes & Body Control',
    description: 'Advanced catching techniques including contested catches, adjusting to the ball, and securing possession.',
    youtubeUrl: 'https://www.youtube.com/watch?v=uDGN2XcGgP0',
    status: 'published',
    level: 'intermediate',
    unit: 'Offense',
    positions: ['WR', 'TE', 'RB'],
    order: 6,
  },

  // ========================================
  // RUNNING BACK VIDEOS
  // ========================================
  {
    type: 'position',
    title: 'Running Back Vision and Patience',
    description: 'Developing vision, reading blocks, and being patient to let plays develop in the running game.',
    youtubeUrl: 'https://www.youtube.com/watch?v=2WZALq8Hv4M',
    status: 'published',
    level: 'intermediate',
    unit: 'Offense',
    positions: ['RB'],
    order: 7,
  },
  {
    type: 'position',
    title: 'RB Pass Protection Fundamentals',
    description: 'Essential pass protection techniques for running backs including stance, punch, and anchor.',
    youtubeUrl: 'https://www.youtube.com/watch?v=7ZkKRdWv6Xo',
    status: 'published',
    level: 'intro',
    unit: 'Offense',
    positions: ['RB'],
    order: 8,
  },

  // ========================================
  // OFFENSIVE LINE VIDEOS
  // ========================================
  {
    type: 'position',
    title: 'Offensive Line Pass Protection Fundamentals',
    description: 'Footwork, hand placement, and technique for pass blocking as an offensive lineman.',
    youtubeUrl: 'https://www.youtube.com/watch?v=bMfDshV1IZ8',
    status: 'published',
    level: 'intro',
    unit: 'Offense',
    positions: ['OL'],
    isPinned: true,
    order: 9,
  },
  {
    type: 'position',
    title: 'Run Blocking Techniques for OL',
    description: 'Drive blocks, combo blocks, and pulling techniques for offensive linemen in the run game.',
    youtubeUrl: 'https://www.youtube.com/watch?v=KSMbqj5L3AY',
    status: 'published',
    level: 'intermediate',
    unit: 'Offense',
    positions: ['OL'],
    order: 10,
  },

  // ========================================
  // DEFENSIVE BACK VIDEOS
  // ========================================
  {
    type: 'position',
    title: 'DB Backpedal and Transition Technique',
    description: 'Proper backpedal technique, hip turn, and transitioning to run with receivers.',
    youtubeUrl: 'https://www.youtube.com/watch?v=m8vJ3e7_SQo',
    status: 'published',
    level: 'intro',
    unit: 'Defense',
    positions: ['DB'],
    isPinned: true,
    order: 11,
  },
  {
    type: 'position',
    title: 'Press Coverage Techniques for DBs',
    description: 'Hand placement, footwork, and leverage for playing press man coverage at cornerback.',
    youtubeUrl: 'https://www.youtube.com/watch?v=ckiK_L5mE1o',
    status: 'published',
    level: 'intermediate',
    unit: 'Defense',
    positions: ['DB'],
    order: 12,
  },
  {
    type: 'position',
    title: 'Ball Skills for Defensive Backs',
    description: 'Tracking the ball, high pointing, and making plays on the ball as a defensive back.',
    youtubeUrl: 'https://www.youtube.com/watch?v=8XP1a9Mf0vU',
    status: 'published',
    level: 'intermediate',
    unit: 'Defense',
    positions: ['DB'],
    order: 13,
  },

  // ========================================
  // LINEBACKER VIDEOS
  // ========================================
  {
    type: 'position',
    title: 'Linebacker Read Keys and Gap Responsibility',
    description: 'Reading offensive line keys, diagnosing plays, and fitting gaps as a linebacker.',
    youtubeUrl: 'https://www.youtube.com/watch?v=8t8T7YJ3z1A',
    status: 'published',
    level: 'intermediate',
    unit: 'Defense',
    positions: ['LB'],
    order: 14,
  },
  {
    type: 'position',
    title: 'LB Coverage Drops and Zone Technique',
    description: 'Dropping into zone coverage, reading quarterbacks, and making plays in space.',
    youtubeUrl: 'https://www.youtube.com/watch?v=GvH09nI6eTY',
    status: 'published',
    level: 'intermediate',
    unit: 'Defense',
    positions: ['LB'],
    order: 15,
  },

  // ========================================
  // DEFENSIVE LINE VIDEOS
  // ========================================
  {
    type: 'position',
    title: 'Defensive Line Hand Technique and Pass Rush',
    description: 'Hand placement, rip and swim moves, and winning one-on-one matchups on the D-line.',
    youtubeUrl: 'https://www.youtube.com/watch?v=V8OgKjKYaJs',
    status: 'published',
    level: 'intermediate',
    unit: 'Defense',
    positions: ['DL'],
    order: 16,
  },
  {
    type: 'position',
    title: 'DL Run Fits and Gap Integrity',
    description: 'Maintaining gap integrity, shedding blocks, and making tackles in the run game.',
    youtubeUrl: 'https://www.youtube.com/watch?v=P8bpS_QGfOQ',
    status: 'published',
    level: 'intro',
    unit: 'Defense',
    positions: ['DL'],
    order: 17,
  },

  // ========================================
  // ROUTE VIDEOS
  // ========================================
  {
    type: 'route',
    title: 'Slant Route Technique',
    description: 'Quick release, sharp 45-degree break, and catching in traffic on the slant route.',
    youtubeUrl: 'https://www.youtube.com/watch?v=XjQHdyTi8PU',
    status: 'published',
    level: 'intro',
    unit: 'Offense',
    routes: ['Slant'],
    order: 18,
  },
  {
    type: 'route',
    title: 'Out Route Fundamentals',
    description: 'Proper stem, breaking on the hash, and creating separation on out routes.',
    youtubeUrl: 'https://www.youtube.com/watch?v=M8QpX0SvJl4',
    status: 'published',
    level: 'intro',
    unit: 'Offense',
    routes: ['Out'],
    order: 19,
  },
  {
    type: 'route',
    title: 'Curl Route Technique and Timing',
    description: 'Running a proper curl route, finding the soft spot in zone, and sitting down vs man.',
    youtubeUrl: 'https://www.youtube.com/watch?v=j_nX7YW7Bjw',
    status: 'published',
    level: 'intro',
    unit: 'Offense',
    routes: ['Curl'],
    order: 20,
  },
  {
    type: 'route',
    title: 'Post Route - Breaking Deep',
    description: 'Stemming vertically, breaking at depth, and tracking the deep ball on post routes.',
    youtubeUrl: 'https://www.youtube.com/watch?v=4vQZ3vlYGxM',
    status: 'published',
    level: 'intermediate',
    unit: 'Offense',
    routes: ['Post'],
    order: 21,
  },
  {
    type: 'route',
    title: 'Corner Route vs Different Coverages',
    description: 'Running the corner route vs Cover 2, Cover 3, and man coverage.',
    youtubeUrl: 'https://www.youtube.com/watch?v=N_hHp7iJiEo',
    status: 'published',
    level: 'advanced',
    unit: 'Offense',
    routes: ['Corner'],
    order: 22,
  },
  {
    type: 'route',
    title: 'Screen Pass Execution',
    description: 'Selling the route, setting up blocks, and making plays after the catch on screen passes.',
    youtubeUrl: 'https://www.youtube.com/watch?v=aN8jGBP_ohQ',
    status: 'published',
    level: 'intermediate',
    unit: 'Offense',
    routes: ['Screen'],
    order: 23,
  },

  // ========================================
  // COVERAGE VIDEOS
  // ========================================
  {
    type: 'coverage',
    title: 'Cover 2 Zone Defense Breakdown',
    description: 'Understanding Cover 2 assignments, zone drops, and pattern recognition.',
    youtubeUrl: 'https://www.youtube.com/watch?v=U8zI3WzfSXs',
    status: 'published',
    level: 'intermediate',
    unit: 'Defense',
    coverages: ['Cover 2', 'Zone'],
    isPinned: true,
    order: 24,
  },
  {
    type: 'coverage',
    title: 'Cover 3 Responsibilities and Technique',
    description: 'Breaking down Cover 3 zone, deep third responsibilities, and underneath zones.',
    youtubeUrl: 'https://www.youtube.com/watch?v=WJZ2_h9YoLs',
    status: 'published',
    level: 'intermediate',
    unit: 'Defense',
    coverages: ['Cover 3', 'Zone'],
    order: 25,
  },
  {
    type: 'coverage',
    title: 'Man Coverage Fundamentals',
    description: 'Technique, positioning, and leverage for playing man-to-man coverage.',
    youtubeUrl: 'https://www.youtube.com/watch?v=fDW2gqjV9WY',
    status: 'published',
    level: 'intro',
    unit: 'Defense',
    coverages: ['Man'],
    order: 26,
  },
  {
    type: 'coverage',
    title: 'Cover 1 Man Free Safety Help',
    description: 'Cover 1 man coverage with single high safety, responsibilities and techniques.',
    youtubeUrl: 'https://www.youtube.com/watch?v=PUKvP6XFAFQ',
    status: 'published',
    level: 'intermediate',
    unit: 'Defense',
    coverages: ['Cover 1', 'Man'],
    order: 27,
  },
  {
    type: 'coverage',
    title: 'Cover 4 Quarters Coverage',
    description: 'Understanding quarters coverage, 4 deep defenders, and pattern matching concepts.',
    youtubeUrl: 'https://www.youtube.com/watch?v=iuuJH_cJTCY',
    status: 'published',
    level: 'advanced',
    unit: 'Defense',
    coverages: ['Cover 4', 'Quarters'],
    order: 28,
  },
  {
    type: 'coverage',
    title: 'Tampa 2 Coverage Scheme',
    description: 'The Tampa 2 defense with MLB dropping into deep middle, strengths and weaknesses.',
    youtubeUrl: 'https://www.youtube.com/watch?v=6Z3Af_zLhNE',
    status: 'published',
    level: 'advanced',
    unit: 'Defense',
    coverages: ['Tampa 2', 'Cover 2', 'Zone'],
    order: 29,
  },

  // ========================================
  // RUN CONCEPT VIDEOS
  // ========================================
  {
    type: 'run',
    title: 'Inside Zone Run Blocking and Reads',
    description: 'Zone blocking scheme, combo blocks, and reading inside zone as a running back.',
    youtubeUrl: 'https://www.youtube.com/watch?v=rsSKP9jsSj0',
    status: 'published',
    level: 'intermediate',
    unit: 'Offense',
    positions: ['RB', 'OL', 'QB'],
    runs: ['Inside Zone'],
    isPinned: true,
    order: 30,
  },
  {
    type: 'run',
    title: 'Outside Zone Stretch Concept',
    description: 'Outside zone blocking, getting to the edge, and cutback reads for RBs.',
    youtubeUrl: 'https://www.youtube.com/watch?v=xvg4YH_T_jE',
    status: 'published',
    level: 'intermediate',
    unit: 'Offense',
    positions: ['RB', 'OL', 'QB'],
    runs: ['Outside Zone', 'Stretch'],
    order: 31,
  },
  {
    type: 'run',
    title: 'Power Run Blocking Scheme',
    description: 'Gap blocking, pulling guard, and downhill running on the power concept.',
    youtubeUrl: 'https://www.youtube.com/watch?v=k3LuF1KcJtM',
    status: 'published',
    level: 'intermediate',
    unit: 'Offense',
    positions: ['RB', 'OL', 'TE'],
    runs: ['Power'],
    order: 32,
  },
  {
    type: 'run',
    title: 'Counter Run Play Execution',
    description: 'Misdirection, pulling linemen, and setting up the counter with previous runs.',
    youtubeUrl: 'https://www.youtube.com/watch?v=c8Q8_YGEZrc',
    status: 'published',
    level: 'advanced',
    unit: 'Offense',
    positions: ['RB', 'OL', 'QB'],
    runs: ['Counter'],
    order: 33,
  },
  {
    type: 'run',
    title: 'Trap Block Fundamentals',
    description: 'Trap blocking scheme, pulling guard technique, and making the defense pay for penetration.',
    youtubeUrl: 'https://www.youtube.com/watch?v=r0qCmj0RVLE',
    status: 'published',
    level: 'intermediate',
    unit: 'Offense',
    positions: ['RB', 'OL', 'QB'],
    runs: ['Trap'],
    order: 34,
  },
  {
    type: 'run',
    title: 'Toss Sweep to the Edge',
    description: 'Toss sweep execution, getting the ball to the perimeter, and turning the corner.',
    youtubeUrl: 'https://www.youtube.com/watch?v=qXxN8Ge1JMI',
    status: 'published',
    level: 'intro',
    unit: 'Offense',
    positions: ['RB', 'OL', 'QB'],
    runs: ['Toss', 'Sweep'],
    order: 35,
  },
  {
    type: 'run',
    title: 'Draw Play Timing and Execution',
    description: 'Selling pass protection, delayed handoff, and exploiting aggressive pass rushers.',
    youtubeUrl: 'https://www.youtube.com/watch?v=7Qox9Ux8KMs',
    status: 'published',
    level: 'intermediate',
    unit: 'Offense',
    positions: ['RB', 'OL', 'QB'],
    runs: ['Draw'],
    order: 36,
  },
  {
    type: 'run',
    title: 'ISO Lead Blocking Concept',
    description: 'Isolation play with fullback lead block, downhill power running.',
    youtubeUrl: 'https://www.youtube.com/watch?v=H_NhwW2EUpU',
    status: 'published',
    level: 'intro',
    unit: 'Offense',
    positions: ['RB', 'OL'],
    runs: ['Iso'],
    order: 37,
  },
];

async function seedVideos() {
  console.log('🎬 Starting video seeding...');

  // Get the first coach user as creator
  const creator = await prisma.user.findFirst({
    where: { role: 'coach' }, // lowercase to match other scripts
  });

  if (!creator) {
    console.error('[SEED ERROR] No coach found in database. Please create a coach user first.');
    return;
  }

  console.log(`✅ Using creator: ${creator.name} (${creator.id})`);

  let created = 0;
  let skipped = 0;

  for (const video of trainingVideos) {
    try {
      // Check if video with this URL already exists
      const existing = await prisma.video.findFirst({
        where: { youtubeUrl: video.youtubeUrl },
      });

      if (existing) {
        console.log(`⏭️  Skipping "${video.title}" - already exists`);
        skipped++;
        continue;
      }

      await prisma.video.create({
        data: {
          ...video,
          createdBy: creator.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Created video: ${video.title}`);
      created++;
    } catch (error: any) {
      console.error(`❌ Failed to create "${video.title}":`, error.message);
    }
  }

  console.log('\n📊 Video Seeding Summary:');
  console.log(`   ✅ Created: ${created} videos`);
  console.log(`   ⏭️  Skipped: ${skipped} videos (already exist)`);
  console.log(`   📹 Total: ${trainingVideos.length} videos`);
}

async function main() {
  try {
    await seedVideos();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
