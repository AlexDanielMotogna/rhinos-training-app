import type { WorkoutReport } from './workoutAnalysis';
import type { Position } from '../types/exercise';
import type { WorkoutEntry } from '../types/workout';
import { getTeamSettings } from './teamSettings';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * AI-Generated Workout Report
 * The AI analyzes the workout and generates all scores + insights
 */
export interface AIWorkoutReport extends WorkoutReport {
  aiGenerated: true;
  sessionPrimaryIntent?: string;
  sessionSecondaryIntent?: string;
}

/**
 * Build AI prompt for COMPLETE workout report generation
 * AI will analyze exercises and generate all scores + insights
 */
function buildReportGenerationPrompt(
  entries: WorkoutEntry[],
  duration: number,
  workoutTitle: string,
  position: Position,
  userName: string,
  workoutNotes?: string,
  playerWeight?: number,
  playerHeight?: number
): string {
  // Calculate basic metrics that AI will use
  const totalSets = entries.reduce((sum, e) => sum + (e.setData?.length || e.sets || 0), 0);

  const totalReps = entries.reduce((sum, e) => {
    if (e.setData) {
      return sum + e.setData.reduce((s, set) => s + (set.reps || 0), 0);
    }
    return sum + ((e.reps || 0) * (e.sets || 0));
  }, 0);

  const totalVolume = entries.reduce((sum, e) => {
    if (e.setData) {
      return sum + e.setData.reduce((s, set) => s + (set.kg || 0) * (set.reps || 0), 0);
    }
    return sum + ((e.kg || 0) * (e.reps || 0) * (e.sets || 0));
  }, 0);

  const totalDistance = entries.reduce((sum, e) => {
    if (e.setData) {
      return sum + e.setData.reduce((s, set) => s + (set.distance || 0), 0);
    }
    return sum + ((e.distance || 0) * (e.sets || 1));
  }, 0);

  const rpeValues = entries.filter(e => e.rpe).map(e => e.rpe!);
  const avgRPE = rpeValues.length > 0 ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length : 0;

  // Debug logging to diagnose data issues
  console.log('🔍 AI Prompt Data:', {
    exerciseCount: entries.length,
    totalSets,
    totalReps,
    totalVolume,
    totalDistance: totalDistance.toFixed(3),
    avgRPE: avgRPE.toFixed(1),
    duration,
    workoutTitle,
    entries: entries.map(e => ({
      name: e.name,
      setDataLength: e.setData?.length,
      sets: e.sets,
      reps: e.reps,
      kg: e.kg,
      hasSetData: !!e.setData
    }))
  });

  // Get team settings for context
  const teamSettings = getTeamSettings();

  // Exercise breakdown
  const exerciseList = entries.map(e => {
    let setsInfo = '';
    if (e.setData) {
      setsInfo = `${e.setData.length} sets: ${e.setData.map(s => {
        const parts = [];
        if (s.reps) parts.push(`${s.reps} reps`);
        if (s.kg) parts.push(`${s.kg}kg`);
        if (s.durationSec) parts.push(`${s.durationSec}sec`);
        if (s.distance) parts.push(`${(s.distance * 1000).toFixed(0)}m`); // Convert km to m for readability
        return parts.join(' @ ');
      }).join(', ')}`;
    } else {
      const parts = [];
      if (e.sets) parts.push(`${e.sets} sets`);
      if (e.reps) parts.push(`${e.reps} reps`);
      if (e.kg) parts.push(`${e.kg}kg`);
      if (e.durationSec) parts.push(`${e.durationSec}sec`);
      if (e.distance) parts.push(`${(e.distance * 1000).toFixed(0)}m`);
      setsInfo = parts.join(' x ');
    }
    const rpeInfo = e.rpe ? ` (RPE ${e.rpe})` : '';
    const notesInfo = e.notes ? ` - Note: "${e.notes}"` : '';
    return `- ${e.name} [${e.category}]: ${setsInfo}${rpeInfo}${notesInfo}`;
  }).join('\n');

  return `🏈 UNIVERSAL WORKOUT REPORT GENERATOR – American Football S&C (FINAL STRICT MODE)

ROLE
You are an expert American Football Strength & Conditioning coach. Analyze training sessions of ANY type and generate a professional, honest, and actionable report. Be tough, clear, and fair — no sugarcoating. Validate sets, reps, load, distance, and RPE. Never add fake praise. Adjust expectations based on position, season phase, and team level.

INPUTS
• Player:
  - Name: ${userName}
  - Position: ${position}
  - Body Weight (kg): ${playerWeight || 'Unknown'}
  - Height (cm): ${playerHeight || 'Unknown'}
  - Season Phase: ${teamSettings.seasonPhase}
  - Team Level: ${teamSettings.teamLevel}
• Workout:
  - Title: ${workoutTitle}
  - Duration (min): ${duration}
  - Exercises (raw list):
${exerciseList}
  - Total Sets: ${totalSets}
  - Total Reps: ${totalReps}
  - Total Lifting Volume (kg): ${totalVolume}
  - Total Distance (km): ${totalDistance.toFixed(3)}
  - Average RPE: ${avgRPE.toFixed(1)}${workoutNotes ? `\n  - Notes: ${workoutNotes}` : ''}

TASK PIPELINE

1) SESSION INTENT CLASSIFICATION
Pick 1 primary, 1 optional secondary: speed | power | strength | conditioning | agility | mobility | mixed

CRITICAL: Evaluate THIS session based on its PRIMARY INTENT only.
• DO NOT penalize a focused session for missing other modalities
• If session intent = strength upper → judge the strength work, NOT the lack of sprints/legs
• If session intent = speed → judge the speed work, NOT the lack of lifting
• Missing modalities can be mentioned for WEEKLY BALANCE context, but NEVER as a fault of this specific session
• Example GOOD feedback: "Solid upper strength session. Remember to balance this week with lower body and speed work."
• Example BAD feedback: "No lower body work detected - make sure to train legs" ❌ (This penalizes a valid upper-focused session)

2) POSITION-SPECIFIC BENCHMARKS
Compare training metrics against standards (relative to BW unless otherwise noted).

RB / WR / CB / S (Skill Players)
  Squat: Weak <1.0× BW | Adequate 1.4–1.8× BW | Elite >1.9× BW
  Bench: Weak <0.7× BW | Adequate 1.1–1.3× BW | Elite >1.4× BW
  Deadlift: Weak <1.2× BW | Adequate 1.7–2.0× BW | Elite >2.2× BW
  40y Sprint: Elite WR ≤4.40s | Elite RB ≤4.45s | Adequate WR ≤4.55s, RB ≤4.60s | Weak above these
  Pro-Agility (5–10–5): Elite ≤4.15s | Adequate 4.26–4.35s | Weak ≥4.36s
  Broad Jump: Adequate 2.5–2.7m | Elite >2.8m
  Vertical Jump: Adequate 75–85cm | Elite >86cm

LB / TE (Hybrid Power)
  Squat: Adequate 1.7–2.0× BW | Elite >2.1× BW
  Bench: Adequate 1.3–1.5× BW | Elite >1.6× BW
  Deadlift: Adequate 1.9–2.2× BW | Elite >2.3× BW
  40y Sprint: Adequate 5.10–5.29s | Elite <5.09s
  Pro-Agility: Adequate 4.6–4.79s | Elite <4.59s
  Broad Jump: Adequate 2.6–2.8m | Elite >2.9m
  Vertical: Adequate 69–77cm | Elite >78cm

OL / DL (Linemen)
  Squat: Adequate 2.0–2.3× BW | Elite >2.4× BW
  Bench: Adequate 1.4–1.6× BW | Elite >1.7× BW
  Deadlift: Adequate 2.1–2.4× BW | Elite >2.5× BW
  40y Sprint: Adequate 5.30–5.49s | Elite <5.29s
  Pro-Agility: Adequate 4.8–4.99s | Elite <4.79s
  Broad Jump: Adequate 2.3–2.4m | Elite >2.5m
  Vertical: Adequate 63–70cm | Elite >71cm

QB (Quarterbacks)
  Squat: Adequate 1.3–1.5× BW | Elite >1.6× BW
  Bench: Adequate 1.0–1.2× BW | Elite >1.3× BW
  Deadlift: Adequate 1.5–1.8× BW | Elite >1.9× BW
  40y Sprint: Adequate 4.90–5.09s | Elite <4.89s
  Pro-Agility: Adequate 4.6–4.79s | Elite <4.59s
  Broad Jump: Adequate 2.5–2.6m | Elite >2.7m
  Vertical: Adequate 69–75cm | Elite >76cm

3) MINIMUM EFFECTIVE DOSE VALIDATION
Mark session as insufficient if ANY of these are true:
  • < 2 exercises (unless max-test or focused single-lift session)
  • < 4 total sets (strength/power)
  • < 12 total reps (strength/power)
  • Sprint volume < 150m or < 5 sprints (speed work)
  • Conditioning < 6 min (conditioning work)
  • RPE > 7 with trivial volume (< 3 sets)

IMPORTANT: A session with adequate sets, reps, and volume is VALID even if duration is short.
Example: 4×10×90kg Bench + 4×10×100kg Squat = VALID (8 sets, 80 reps, high volume) even if only 20-30 minutes.

If insufficient →
  "sessionValid": false
  "intensityScore": ≤ 35
  "workCapacityScore": ≤ 25
  "athleticQualityScore": ≤ 40
  "positionRelevanceScore": ≤ 40
  "strengths": []
  "warnings": ["Session insufficient: specific reason with numbers"]
  "recoveryDemand": "insufficient"
  "recommendedRestHours": 0
  "coachInsights": USE VERY DIRECT TONE:
    "This was not a real workout. [Specific numbers: X sets, Y reps, Z kg total] has ZERO training effect.
     Minimum requirements for valid strength session: 4+ sets, 12+ total reps, adequate volume.
     This session will NOT produce any adaptation or strength gains. Plan a proper training session next time."

4) SEASON PHASE MULTIPLIERS
Apply to raw scores:

Phase         Intensity  WorkCap  AthleticQual  PositionFit
off-season    ×1.1       ×1.2     ×1.1          ×1.0
pre-season    ×1.0       ×0.9     ×1.1          ×1.2
in-season     ×0.8       ×0.7     ×1.2          ×1.3
post-season   ×0.7       ×0.6     ×1.0          ×0.8

5) TEAM LEVEL MULTIPLIERS
Apply to raw scores:

Level       Intensity  WorkCap  AthleticQual  PositionFit
amateur     ×0.9       ×0.9     ×1.0          ×0.8
semi-pro    ×1.0       ×1.0     ×1.0          ×1.0
college     ×1.1       ×1.1     ×1.1          ×1.1
pro         ×1.3       ×1.3     ×1.2          ×1.3

6) SCORING FRAMEWORK (0–100)
  • intensityScore: effort vs intent (load, RPE, density)
  • workCapacityScore: useful volume vs position standards
  • athleticQualityScore: warm-up, execution, technique
  • positionRelevanceScore: alignment with role & benchmarks

Final scores = raw × SeasonPhaseMultiplier × TeamLevelMultiplier (capped 0–100).

7) RECOVERY
  • recoveryDemand: low | medium | high | very-high
  • Hours: 24–72 (adjusted by intensity & season phase)

8) FEEDBACK
  • strengths: 1–3 positives (only if earned, based on session intent)
  • warnings: 1–3 risks/faults (ONLY within session scope - no "missing leg day" on an upper session)
  • coachInsights: 2–3 sentences, direct, contextual to role & season

IMPORTANT FEEDBACK RULES:
  • Judge session quality within its PRIMARY INTENT - don't mark down for what it wasn't trying to be
  • "No lower body work" is ONLY a warning if session was supposed to be full-body or mixed
  • Weekly balance reminders are OK in coachInsights, but not in warnings
  • Focus on execution quality, effort, volume adequacy FOR THE INTENT

OUTPUT FORMAT (JSON only):

{
  "sessionValid": <true|false>,
  "intensityScore": <0-100>,
  "workCapacityScore": <0-100>,
  "athleticQualityScore": <0-100>,
  "positionRelevanceScore": <0-100>,
  "seasonPhase": "${teamSettings.seasonPhase}",
  "teamLevel": "${teamSettings.teamLevel}",
  "totalVolume": ${totalVolume},
  "totalDistance": ${totalDistance.toFixed(3)},
  "duration": ${duration},
  "avgRPE": ${avgRPE.toFixed(1)},
  "setsCompleted": ${totalSets},
  "setsPlanned": ${totalSets},
  "sessionPrimaryIntent": "<speed|power|strength|conditioning|agility|mobility|mixed>",
  "sessionSecondaryIntent": "<none|speed|power|strength|conditioning|agility|mobility>",
  "powerWork": <0-100>,
  "strengthWork": <0-100>,
  "speedWork": <0-100>,
  "strengths": ["..."],
  "warnings": ["..."],
  "recoveryDemand": "<low|medium|high|very-high|insufficient>",
  "recommendedRestHours": <0-72>,
  "coachInsights": "..."
}`;
}

/**
 * Generate complete workout report using AI
 */
export async function generateAIWorkoutReport(
  entries: WorkoutEntry[],
  duration: number,
  workoutTitle: string,
  position: Position,
  userName: string,
  apiKey: string,
  workoutNotes?: string,
  playerWeight?: number,
  playerHeight?: number
): Promise<{ success: boolean; report?: AIWorkoutReport; error?: string }> {
  try {
    // Validate API key
    if (!apiKey || !apiKey.startsWith('sk-')) {
      return {
        success: false,
        error: 'Invalid API key. Please configure your OpenAI API key in settings.',
      };
    }

    const prompt = buildReportGenerationPrompt(
      entries,
      duration,
      workoutTitle,
      position,
      userName,
      workoutNotes,
      playerWeight,
      playerHeight
    );

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert strength coach for American Football. Analyze workouts intelligently - speed work is NOT the same as strength work. Evaluate based on SESSION INTENT first. Generate accurate, fair performance scores. Output ONLY valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        return {
          success: false,
          error: 'Invalid API key. Please check your OpenAI API key in settings.',
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please add credits to your OpenAI account.',
        };
      }

      return {
        success: false,
        error: errorData.error?.message || `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return {
        success: false,
        error: 'Invalid response from AI. Please try again.',
      };
    }

    const jsonContent = data.choices[0].message.content.trim();
    const reportData = JSON.parse(jsonContent);

    // Validate required fields
    const requiredFields = ['intensityScore', 'workCapacityScore', 'athleticQualityScore', 'positionRelevanceScore'];
    for (const field of requiredFields) {
      if (typeof reportData[field] !== 'number') {
        return {
          success: false,
          error: `Invalid AI response: missing ${field}`,
        };
      }
    }

    const aiReport: AIWorkoutReport = {
      ...reportData,
      aiGenerated: true,
    };

    return {
      success: true,
      report: aiReport,
    };
  } catch (error) {
    console.error('AI Report Generation Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate AI report',
    };
  }
}

/**
 * Build the AI prompt for workout analysis
 * IMPORTANT: AI should NOT suggest changing coach's exercises,
 * only provide feedback on execution quality and training approach
 */
function buildAIPrompt(
  report: WorkoutReport,
  workoutTitle: string,
  position: Position,
  userName: string,
  entries: WorkoutEntry[]
): string {
  const exerciseSummary = `
**Workout Completed:**
- Title: ${workoutTitle}
- Duration: ${report.duration} minutes
- Total Volume: ${report.totalVolume} kg
- Sets Completed: ${report.setsCompleted}/${report.setsPlanned}
- Average RPE: ${report.avgRPE}/10

**Performance Scores:**
- Intensity: ${report.intensityScore}/100
- Work Capacity: ${report.workCapacityScore}/100
- Athletic Quality: ${report.athleticQualityScore}/100
- Position Fit: ${report.positionRelevanceScore}/100

**Training Focus:**
- Power Work: ${report.powerWork}%
- Strength Work: ${report.strengthWork}%
- Speed Work: ${report.speedWork}%

**Recovery:**
- Demand: ${report.recoveryDemand}
- Recommended Rest: ${report.recommendedRestHours}h
`;

  // Add exercise-specific notes if they exist
  const exerciseNotes = entries
    .filter(e => e.notes && e.notes.trim().length > 0)
    .map(e => `- ${e.name}: "${e.notes}"`)
    .join('\n');

  const notesSection = exerciseNotes ? `\n**Player Notes on Exercises:**\n${exerciseNotes}\n` : '';

  return `You are a TOUGH, NO-NONSENSE American Football strength coach. Call out laziness, celebrate real effort, and BE BRUTALLY HONEST.

**Player:** ${userName}
**Position:** ${position}

${exerciseSummary}${notesSection}

**CRITICAL INSTRUCTIONS:**
1. DO NOT suggest changing exercises - the coach programmed them
2. BE HARSH when effort is weak (low RPE, incomplete sets, short duration)
3. BE REAL - if the workout was too easy or too short, CALL IT OUT
4. CELEBRATE real hard work with genuine respect
5. READ player notes carefully - they tell you about form, pain, struggles, or wins
6. Address specific concerns mentioned in notes (e.g., "elbow hurt" → acknowledge and advise)
7. 2-3 sentences MAX - direct, no fluff
8. If RPE < 6 or duration < 20 min or sets incomplete: GET TOUGH
9. If RPE > 7.5 and completed everything: SHOW RESPECT

**HARSH examples (use this tone when effort is weak):**
"RPE of 5? Are you warming up or training? You need to push harder if you want real gains - this was too easy."
"1 minute workout? That's not training, that's a joke. Get back in there and finish what your coach programmed."
"50% of sets completed? Either you're injured or you're not committed. Figure out which one."

**RESPECT examples (use this when they earned it):**
"Solid grind at RPE 8.2 - you actually worked today. Keep that intensity and you'll see real gains on the field."
"100% completion with high RPE - that's what I want to see. Now rest those ${report.recommendedRestHours}h and come back ready."

**Your brutally honest coaching feedback:**`;
}

/**
 * Get AI-powered workout insight using OpenAI API
 */
export async function getAIWorkoutInsight(
  report: WorkoutReport,
  workoutTitle: string,
  position: Position,
  userName: string,
  apiKey: string,
  entries: WorkoutEntry[]
): Promise<{ success: boolean; insight?: string; error?: string }> {
  try {
    // Validate API key
    if (!apiKey || !apiKey.startsWith('sk-')) {
      return {
        success: false,
        error: 'Invalid API key. Please configure your OpenAI API key in settings.',
      };
    }

    const prompt = buildAIPrompt(report, workoutTitle, position, userName, entries);

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cheaper and faster than gpt-4
        messages: [
          {
            role: 'system',
            content: 'You are a TOUGH American Football strength coach. Call out weak effort harshly. Respect real work. NO sugarcoating. Be BRUTALLY HONEST.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle common errors
      if (response.status === 401) {
        return {
          success: false,
          error: 'Invalid API key. Please check your OpenAI API key in settings.',
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please add credits to your OpenAI account at platform.openai.com/settings/organization/billing',
        };
      }

      return {
        success: false,
        error: errorData.error?.message || `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return {
        success: false,
        error: 'Invalid response from AI. Please try again.',
      };
    }

    const insight = data.choices[0].message.content.trim();

    return {
      success: true,
      insight,
    };
  } catch (error) {
    console.error('AI Insight Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get AI insight',
    };
  }
}

/**
 * Estimate cost of AI insight
 * GPT-4o-mini pricing (as of 2024):
 * - Input: $0.150 per 1M tokens (~$0.00015 per request)
 * - Output: $0.600 per 1M tokens (~$0.00012 per request)
 * Average cost per insight: ~$0.0003 USD
 */
export function estimateAICost(): string {
  return '~€0.0003';
}

/**
 * Validate if an API key is functional by making a test request
 */
export async function validateAPIKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  if (!apiKey || !apiKey.startsWith('sk-')) {
    return { valid: false, error: 'Invalid API key format' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return { valid: true };
    }

    if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    }

    if (response.status === 429) {
      return { valid: false, error: 'Rate limit exceeded - add credits to your OpenAI account' };
    }

    return { valid: false, error: `API error: ${response.status}` };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

/**
 * Get API key with priority: Team Settings > User Settings (only if enabled)
 * Returns null if no valid API key is configured or AI Coach is disabled
 */
export function getAPIKey(): string | null {
  // Priority 1: Team API Key (configured by admin)
  const teamSettings = getTeamSettings();
  if (teamSettings.aiApiKey) {
    return teamSettings.aiApiKey;
  }

  // Priority 2: User API Key (personal, only if enabled)
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.aiCoachEnabled && user.aiApiKey) {
        return user.aiApiKey;
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }

  // No API key configured or AI Coach is disabled
  return null;
}

/**
 * Check if API key is configured (Team or User)
 */
export function hasAPIKey(): boolean {
  return Boolean(getAPIKey());
}

/**
 * Save API key to localStorage (DEPRECATED - use Profile or Admin settings instead)
 * @deprecated Use user.aiApiKey or teamSettings.aiApiKey instead
 */
export function saveAPIKey(apiKey: string): boolean {
  if (!apiKey || !apiKey.startsWith('sk-')) {
    return false;
  }
  localStorage.setItem('openai_api_key', apiKey);
  return true;
}

/**
 * Remove API key (DEPRECATED)
 * @deprecated Manage API keys through Profile or Admin settings instead
 */
export function removeAPIKey(): void {
  localStorage.removeItem('openai_api_key');
}
