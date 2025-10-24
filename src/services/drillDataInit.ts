import { equipmentService } from './equipmentService';
import { drillService } from './drillService';

export const initializeDrillData = () => {
  // Check if data already exists
  const existingEquipment = equipmentService.getAllEquipment();
  const existingDrills = drillService.getAllDrills();

  if (existingEquipment.length > 0 || existingDrills.length > 0) {
    console.log('Drill data already initialized');
    return;
  }

  console.log('Initializing drill sample data...');

  // Create equipment
  const cone = equipmentService.createEquipment('Cones', 20);
  const ball = equipmentService.createEquipment('Football', 10);
  const dummy = equipmentService.createEquipment('Tackle Dummy', 6);
  const sled = equipmentService.createEquipment('Blocking Sled', 2);
  const resistanceBand = equipmentService.createEquipment('Resistance Bands', 12);

  // Create sample drills
  const userId = 'coach_1'; // Default coach ID

  // 1. Athletik / Conditioning Drill
  drillService.createDrill({
    name: 'Shuttle Run 5-10-5',
    category: 'athletik',
    equipment: [{ equipmentId: cone.id, quantity: 3 }],
    coaches: 1,
    dummies: 0,
    players: 12,
    difficulty: 'basic',
    description: 'Classic agility drill for change of direction speed. Set up 3 cones 5 yards apart. Sprint right, touch line, sprint 10 yards left, touch line, sprint 5 yards right through start.',
    coachingPoints: 'Focus on low center of gravity during direction changes. Quick foot touches on cones. Push off explosively. Keep head up.',
    trainingContext: 'Warm-up, Conditioning Period',
    createdBy: userId,
  });

  // 2. Fundamentals Drill
  drillService.createDrill({
    name: 'Form Tackling Progression',
    category: 'fundamentals',
    equipment: [{ equipmentId: dummy.id, quantity: 4 }],
    coaches: 2,
    dummies: 4,
    players: 8,
    difficulty: 'basic',
    description: 'Progressive tackling technique drill. Start with static position, progress to slow speed, then game speed. Focus on head placement, wrap, and drive.',
    coachingPoints: 'Eyes up, head across body. Wrap arms tight. Drive legs on contact. Stay low and explosive.',
    trainingContext: 'Individual Period',
    createdBy: userId,
  });

  // 3. Offense Drill
  drillService.createDrill({
    name: 'WR Route Running Tree',
    category: 'offense',
    equipment: [
      { equipmentId: cone.id, quantity: 6 },
      { equipmentId: ball.id, quantity: 3 }
    ],
    coaches: 1,
    dummies: 0,
    players: 6,
    difficulty: 'advanced',
    description: 'Wide receivers practice full route tree against air. Focus on stem depth, break angle, acceleration out of cuts. QB throws timing routes.',
    coachingPoints: 'Sell vertical threat on stem. Sharp cuts at break point. Accelerate to catching zone. Track ball over shoulder.',
    trainingContext: 'Individual Period, Team Period',
    createdBy: userId,
  });

  // 4. Defense Drill
  drillService.createDrill({
    name: 'DB Backpedal & Break',
    category: 'defense',
    equipment: [{ equipmentId: cone.id, quantity: 4 }],
    coaches: 1,
    dummies: 0,
    players: 8,
    difficulty: 'basic',
    description: 'Defensive backs practice smooth backpedal technique and breaking on the ball. Emphasize hip fluidity and quick transitions.',
    coachingPoints: 'Shoulders over toes in backpedal. Small quick steps. Plant and drive on break. Eyes on WR hips.',
    trainingContext: 'Individual Period',
    createdBy: userId,
  });

  // 5. Team Drill
  drillService.createDrill({
    name: 'Team Situational Scrimmage',
    category: 'team',
    equipment: [
      { equipmentId: ball.id, quantity: 5 },
      { equipmentId: cone.id, quantity: 10 }
    ],
    coaches: 4,
    dummies: 0,
    players: 22,
    difficulty: 'complex',
    description: 'Full team simulation of game situations. Practice 2-minute drill, red zone, third down scenarios with live defense.',
    coachingPoints: 'Communicate assignments. Execute plays at game speed. Mental toughness in pressure situations.',
    trainingContext: 'Team Period',
    createdBy: userId,
  });

  // 6. Speed Drill
  drillService.createDrill({
    name: 'Flying 20s Sprint',
    category: 'athletik',
    equipment: [{ equipmentId: cone.id, quantity: 2 }],
    coaches: 1,
    dummies: 0,
    players: 12,
    difficulty: 'basic',
    description: '20-yard acceleration zone followed by 20-yard timed sprint. Measure top-end speed development.',
    coachingPoints: 'Full acceleration in build-up zone. Maintain posture in flying zone. Drive knees, pump arms.',
    trainingContext: 'Conditioning Period',
    createdBy: userId,
  });

  // 7. Advanced Offense Drill
  drillService.createDrill({
    name: 'RB Pass Protection vs Blitz',
    category: 'offense',
    equipment: [{ equipmentId: dummy.id, quantity: 2 }],
    coaches: 2,
    dummies: 2,
    players: 4,
    difficulty: 'complex',
    description: 'Running backs practice pass protection technique against simulated blitzes. Read blitz, pick up rushers, maintain pocket integrity.',
    coachingPoints: 'ID the Mike. Eyes on rushers. Athletic stance. Punch and anchor. Keep QB clean.',
    trainingContext: 'Individual Period',
    createdBy: userId,
  });

  // 8. Advanced Defense Drill
  drillService.createDrill({
    name: 'LB Fill & Shed',
    category: 'defense',
    equipment: [
      { equipmentId: dummy.id, quantity: 3 },
      { equipmentId: sled.id, quantity: 1 }
    ],
    coaches: 2,
    dummies: 3,
    players: 6,
    difficulty: 'advanced',
    description: 'Linebackers work on taking on blocks, shedding, and filling gaps. Multiple blockers, read & react.',
    coachingPoints: 'Read keys. Attack downhill. Hands inside. Rip/swim to shed. Fill gap violently.',
    trainingContext: 'Individual Period',
    createdBy: userId,
  });

  // 9. Plyometrics Drill
  drillService.createDrill({
    name: 'Box Jump Circuit',
    category: 'athletik',
    equipment: [],
    coaches: 1,
    dummies: 0,
    players: 10,
    difficulty: 'basic',
    description: 'Explosive plyometric training using box jumps. Single leg, double leg, lateral variations.',
    coachingPoints: 'Load and explode. Soft landing. Full hip extension. Control descent.',
    trainingContext: 'Warm-up, Conditioning Period',
    createdBy: userId,
  });

  // 10. Cool Down Drill
  drillService.createDrill({
    name: 'Dynamic Flexibility Flow',
    category: 'cooldown',
    equipment: [{ equipmentId: resistanceBand.id, quantity: 12 }],
    coaches: 1,
    dummies: 0,
    players: 30,
    difficulty: 'basic',
    description: 'Full-body dynamic stretching sequence. Hip openers, shoulder mobility, hamstring lengthening with resistance bands.',
    coachingPoints: 'Controlled breathing. Hold stretches 20-30 seconds. No bouncing. Progressive range of motion.',
    trainingContext: 'Cool Down',
    createdBy: userId,
  });

  console.log('Drill sample data initialized successfully!');
};
