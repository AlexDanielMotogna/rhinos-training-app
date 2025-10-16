# User Plans Integration Guide

## Current Status

✅ **Completed:**
- Types: `UserPlanTemplate`, `PlanExercise`
- Service: `userPlan.ts` with full CRUD operations
- Components:
  - `PlanCard` - Display plan cards
  - `PlanBuilderDialog` - Create/edit plans
  - `ExerciseSelector` - Select exercises from catalog
  - `StartWorkoutDialog` - Execute workout plans
- `WorkoutLog` updated with `planTemplateId`, `planName`, `duration`
- "Today" filter added to workout history

❌ **TODO:** Integration into `MyTraining.tsx`

---

## Integration Steps

### 1. Add Imports to MyTraining.tsx

```typescript
// Add these imports after existing imports (line ~22)
import { PlanCard } from '../components/plan/PlanCard';
import { PlanBuilderDialog } from '../components/plan/PlanBuilderDialog';
import { StartWorkoutDialog } from '../components/plan/StartWorkoutDialog';
import { getUserPlans, createUserPlan, updateUserPlan, deleteUserPlan, duplicateUserPlan, markPlanAsUsed } from '../services/userPlan';
import type { UserPlanTemplate, PlanExercise } from '../types/userPlan';
import { Grid } from '@mui/material'; // Add Grid to MUI imports

// Add type definitions after SessionView (line ~31)
type MySessionTab = 'plans' | 'history';
type TeamSessionTab = 'plan' | 'history';
```

### 2. Add State Variables

```typescript
// Add after line ~43 (after editWorkout state)
const [mySessionTab, setMySessionTab] = useState<MySessionTab>('plans');
const [teamSessionTab, setTeamSessionTab] = useState<TeamSessionTab>('plan');
const [userPlans, setUserPlans] = useState<UserPlanTemplate[]>([]);
const [showPlanBuilder, setShowPlanBuilder] = useState(false);
const [editingPlan, setEditingPlan] = useState<UserPlanTemplate | null>(null);
const [startingPlan, setStartingPlan] = useState<UserPlanTemplate | null>(null);
const [showStartWorkout, setShowStartWorkout] = useState(false);
```

### 3. Load User Plans

```typescript
// Add after line ~50 (after workoutHistory state initialization)
useEffect(() => {
  if (user) {
    setUserPlans(getUserPlans(user.id));
  }
}, [user]);

const refreshUserPlans = () => {
  if (user) {
    setUserPlans(getUserPlans(user.id));
  }
};
```

### 4. Add Plan Handlers

```typescript
// Add after line ~134 (after handleVideoClick)
const handleCreatePlan = (planName: string, exercises: PlanExercise[]) => {
  if (user) {
    createUserPlan({
      userId: user.id,
      name: planName,
      exercises,
    });
    refreshUserPlans();
    setSuccessMessage('Plan created successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  }
};

const handleUpdatePlan = (planName: string, exercises: PlanExercise[]) => {
  if (editingPlan) {
    updateUserPlan(editingPlan.id, {
      name: planName,
      exercises,
    });
    refreshUserPlans();
    setEditingPlan(null);
    setSuccessMessage('Plan updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  }
};

const handleDeletePlan = (planId: string) => {
  if (window.confirm('Are you sure you want to delete this plan?')) {
    deleteUserPlan(planId);
    refreshUserPlans();
    setSuccessMessage('Plan deleted successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  }
};

const handleDuplicatePlan = (planId: string) => {
  duplicateUserPlan(planId);
  refreshUserPlans();
  setSuccessMessage('Plan duplicated successfully!');
  setTimeout(() => setSuccessMessage(''), 3000);
};

const handleStartPlan = (plan: UserPlanTemplate) => {
  setStartingPlan(plan);
  setShowStartWorkout(true);
};

const handleFinishWorkout = (entries: WorkoutEntry[], notes: string, duration: number) => {
  if (user && startingPlan) {
    const today = new Date().toISOString().split('T')[0];

    const workoutLog: WorkoutLog = {
      id: crypto.randomUUID(),
      userId: user.id,
      date: today,
      entries,
      notes,
      source: 'player',
      planTemplateId: startingPlan.id,
      planName: startingPlan.name,
      duration,
      createdAt: new Date().toISOString(),
    };

    const allLogs = getWorkoutLogs();
    allLogs.push(workoutLog);
    localStorage.setItem('rhinos_workouts', JSON.stringify(allLogs));

    markPlanAsUsed(startingPlan.id);
    refreshUserPlans();
    refreshWorkoutHistory();
    setStartingPlan(null);
    setSuccessMessage(`Workout completed! Duration: ${duration} min`);
    setTimeout(() => setSuccessMessage(''), 3000);
  }
};
```

### 5. Replace MY SESSIONS VIEW (lines ~167-180)

Replace the entire "MY SESSIONS VIEW" section with:

```typescript
{/* MY SESSIONS VIEW */}
{sessionView === 'my' && (
  <Box>
    {/* Header with button */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h5">My Sessions</Typography>
      {mySessionTab === 'plans' && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingPlan(null);
            setShowPlanBuilder(true);
          }}
        >
          Create New Plan
        </Button>
      )}
    </Box>

    {/* Sub-tabs: My Plans / History */}
    <Tabs
      value={mySessionTab}
      onChange={(_, value) => setMySessionTab(value as MySessionTab)}
      sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
    >
      <Tab value="plans" label="My Plans" />
      <Tab value="history" label="History" />
    </Tabs>

    {/* My Plans Tab */}
    {mySessionTab === 'plans' && (
      <Box>
        {userPlans.length === 0 ? (
          <Alert severity="info">
            No workout plans yet. Click "Create New Plan" to build your first workout template!
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {userPlans.map(plan => (
              <Grid item xs={12} sm={6} md={4} key={plan.id}>
                <PlanCard
                  plan={plan}
                  onStart={handleStartPlan}
                  onEdit={(plan) => {
                    setEditingPlan(plan);
                    setShowPlanBuilder(true);
                  }}
                  onDelete={handleDeletePlan}
                  onDuplicate={handleDuplicatePlan}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    )}

    {/* History Tab */}
    {mySessionTab === 'history' && (
      <Box>
        <WorkoutHistory
          workouts={workoutHistory.filter(w => w.source === 'player')}
          onDelete={handleDeleteWorkout}
          onEdit={handleEditWorkout}
        />
      </Box>
    )}
  </Box>
)}
```

### 6. Update TEAM SESSIONS VIEW with Tabs (lines ~182-313)

Replace the "Training History" section (lines ~295-305) with tabs:

```typescript
{/* Training Type Tabs */}
<Tabs
  value={teamSessionTab}
  onChange={(_, value) => setTeamSessionTab(value as TeamSessionTab)}
  sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
>
  <Tab value="plan" label="Training Plan" />
  <Tab value="history" label="History" />
</Tabs>

{/* Training Plan Tab */}
{teamSessionTab === 'plan' && (
  <>
    <Tabs
      value={activeTab}
      onChange={(_, value) => setActiveTab(value)}
      sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      variant="scrollable"
      scrollButtons="auto"
    >
      {trainingTypes
        .filter((tt) => tt.active)
        .map((tt) => (
          <Tab
            key={tt.key}
            value={tt.key}
            label={t(`training.${tt.key === 'strength_conditioning' ? 'strength' : 'sprints'}` as any)}
          />
        ))}
    </Tabs>

    {/* Coach Plan Exercises */}
    {template ? (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
          {t('training.coachPlan')}
        </Typography>

        {template.blocks
          .sort((a, b) => a.order - b.order)
          .map((block) => (
            <WorkoutBlock
              key={block.order}
              block={block}
              showLogButtons={true}
              onLogWorkout={handleLogWorkout}
              onVideoClick={handleVideoClick}
              trainingType={activeTab}
            />
          ))}
      </Box>
    ) : (
      <Alert severity="info">
        No training plan available for this type
      </Alert>
    )}
  </>
)}

{/* History Tab */}
{teamSessionTab === 'history' && (
  <WorkoutHistory
    workouts={workoutHistory.filter(w => w.source === 'coach')}
    onDelete={handleDeleteWorkout}
    onEdit={handleEditWorkout}
  />
)}
```

### 7. Add Dialogs Before Closing </Box> (after line ~361)

```typescript
{/* Plan Builder Dialog */}
<PlanBuilderDialog
  open={showPlanBuilder}
  editingPlan={editingPlan}
  onClose={() => {
    setShowPlanBuilder(false);
    setEditingPlan(null);
  }}
  onSave={editingPlan ? handleUpdatePlan : handleCreatePlan}
/>

{/* Start Workout Dialog */}
<StartWorkoutDialog
  open={showStartWorkout}
  plan={startingPlan}
  onClose={() => {
    setShowStartWorkout(false);
    setStartingPlan(null);
  }}
  onFinish={handleFinishWorkout}
/>
```

---

## Testing Checklist

After integration, test:

1. ✅ Create a new plan with 3 exercises
2. ✅ Edit an existing plan (change name, add/remove exercises)
3. ✅ Duplicate a plan
4. ✅ Delete a plan
5. ✅ Start a workout from a plan
6. ✅ Complete all exercises in a workout
7. ✅ Check workout appears in History tab with plan name
8. ✅ Verify plan shows "Last used" and completion count
9. ✅ Test "Today" filter shows current workouts
10. ✅ Test Team Sessions tabs (Plan / History)

---

## Database Migration Notes

When migrating to a real database, the structure is ready:

```sql
-- User Plans Table
CREATE TABLE user_plan_templates (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  last_used TIMESTAMP,
  times_completed INTEGER DEFAULT 0
);

-- Plan Exercises Table
CREATE TABLE plan_exercises (
  id UUID PRIMARY KEY,
  plan_id UUID REFERENCES user_plan_templates(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  youtube_url TEXT,
  target_sets INTEGER NOT NULL,
  target_reps INTEGER,
  target_kg DECIMAL(5,2),
  target_duration_min INTEGER,
  notes TEXT,
  order_index INTEGER NOT NULL
);

-- Update workout_logs table
ALTER TABLE workout_logs ADD COLUMN plan_template_id UUID REFERENCES user_plan_templates(id);
ALTER TABLE workout_logs ADD COLUMN plan_name VARCHAR(255);
ALTER TABLE workout_logs ADD COLUMN duration INTEGER; -- in minutes
```

---

## Future Enhancements

- Progress tracking: Show "Last time vs This time" comparison
- Personal bests: Track best lift for each exercise
- Rest timer: Auto-timer between sets
- Workout templates sharing: Share plans with teammates
- Smart suggestions: AI-suggested plans based on position
- Progressive overload: Auto-suggest weight increases
