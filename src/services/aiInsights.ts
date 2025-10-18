import type { WorkoutReport } from './workoutAnalysis';
import type { Position } from '../types/exercise';
import type { WorkoutEntry } from '../types/workout';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * AI-Generated Workout Report
 * The AI analyzes the workout and generates all scores + insights
 */
export interface AIWorkoutReport extends WorkoutReport {
  aiGenerated: true;
}

/**
 * Build AI prompt for COMPLETE workout report generation
 * AI will analyze exercises and generate all scores + feedback
 */
function buildReportGenerationPrompt(
  entries: WorkoutEntry[],
  duration: number,
  workoutTitle: string,
  position: Position,
  userName: string
): string {
  // Calculate basic metrics that AI will use
  const totalSets = entries.reduce((sum, e) => sum + (e.setData?.length || e.sets || 0), 0);

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

  // Exercise breakdown
  const exerciseList = entries.map(e => {
    let setsInfo = '';
    if (e.setData) {
      setsInfo = `${e.setData.length} sets: ${e.setData.map(s => {
        const parts = [];
        if (s.reps) parts.push(`${s.reps} reps`);
        if (s.kg) parts.push(`${s.kg}kg`);
        if (s.durationSec) parts.push(`${s.durationSec}sec`);
        if (s.distance) parts.push(`${s.distance}km`);
        return parts.join(' @ ');
      }).join(', ')}`;
    } else {
      const parts = [];
      if (e.sets) parts.push(`${e.sets} sets`);
      if (e.reps) parts.push(`${e.reps} reps`);
      if (e.kg) parts.push(`${e.kg}kg`);
      if (e.durationSec) parts.push(`${e.durationSec}sec`);
      if (e.distance) parts.push(`${e.distance}km`);
      setsInfo = parts.join(' x ');
    }
    const rpeInfo = e.rpe ? ` (RPE ${e.rpe})` : '';
    const notesInfo = e.notes ? ` - Note: "${e.notes}"` : '';
    return `- ${e.name} [${e.category}]: ${setsInfo}${rpeInfo}${notesInfo}`;
  }).join('\n');

  return `You are an expert American Football strength coach analyzing a workout. Generate a complete performance report with scores and feedback.

**Player:** ${userName}
**Position:** ${position}
**Workout:** ${workoutTitle}
**Duration:** ${duration} minutes
**Total Sets:** ${totalSets}
**Total Volume (lifting):** ${totalVolume} kg
**Total Distance (cardio):** ${totalDistance.toFixed(2)} km
**Average RPE:** ${avgRPE.toFixed(1)}/10

**Exercises Completed:**
${exerciseList}

**YOUR TASK:**
Analyze this workout INTELLIGENTLY. Look at the exercises, pace, distance, RPE, and notes to determine what type of training this actually was.

**IMPORTANT - ANALYZE THE WORKOUT TYPE:**
For running/cardio workouts, calculate the pace (min/km) and determine the type:
- If pace ~3-4 min/km with high RPE → Sprint/Speed work
- If pace ~4-5 min/km with RPE 7-9 → Tempo/Threshold run (this is RESISTANCE/ENDURANCE, not pure speed)
- If pace ~5-6 min/km with moderate RPE → Easy/Aerobic run
- If pace >6 min/km → Recovery run

For this workout:
- Distance: ${totalDistance.toFixed(2)} km in ${duration} min
- Pace: ${totalDistance > 0 ? (duration / totalDistance).toFixed(2) : 'N/A'} min/km
- Average RPE: ${avgRPE.toFixed(1)}/10

**ATHLETIC FOCUS CLASSIFICATION:**
- powerWork: Explosive movements (jumps, throws, Olympic lifts, short sprints <100m at max effort)
- strengthWork: Heavy resistance training (squats, deadlifts, bench, weighted exercises)
- speedWork: ALL cardio/running work INCLUDING tempo runs, resistance runs, sprints, conditioning
  * For a 5 min/km pace tempo run → speedWork: 100% (but label it as endurance/resistance in strengths/insights)
  * For a 3 min/km sprint session → speedWork: 100% (label as pure speed work)
  * The AI should describe the TYPE in coachInsights based on pace analysis

**SCORING GUIDELINES (0-100):**
1. **intensityScore**: How hard did they push? (RPE, effort level, proximity to failure)
   - RPE 9-10 with full completion = 90-100
   - RPE 7-8.5 = 70-90
   - RPE <7 = below 70

2. **workCapacityScore**: Total work done relative to time
   - For STRENGTH: Volume (kg) + sets completed + duration
   - For CARDIO: Duration + distance + RPE
   - 30min tempo run at 6km = SOLID score (80-90)
   - Don't penalize cardio workouts for low kg!

3. **athleticQualityScore**: How athletic/football-relevant is this?
   - Sprints, jumps, explosive lifts = HIGH (80-100)
   - Tempo runs, resistance work = GOOD (70-85)
   - Isolation exercises only = LOWER (40-60)
   - Compound lifts = GOOD (70-85)

4. **positionRelevanceScore**: Fit for ${position} position
   - WR/CB needs speed, power, agility, endurance = all cardio/speed scores HIGH
   - OL/DL needs strength, power = heavy lifts score HIGH

Generate ONLY valid JSON (no markdown, no extra text):
{
  "intensityScore": <number 0-100>,
  "workCapacityScore": <number 0-100>,
  "athleticQualityScore": <number 0-100>,
  "positionRelevanceScore": <number 0-100>,
  "totalVolume": ${totalVolume},
  "totalDistance": ${totalDistance.toFixed(2)},
  "duration": ${duration},
  "avgRPE": ${avgRPE.toFixed(1)},
  "setsCompleted": ${totalSets},
  "setsPlanned": ${totalSets},
  "powerWork": <percentage 0-100>,
  "strengthWork": <percentage 0-100>,
  "speedWork": <percentage 0-100>,
  "strengths": [<array of 1-3 specific positive observations, e.g., "High intensity sprint work", "Excellent explosive focus">],
  "warnings": [<array of 0-2 legitimate concerns, e.g., "Monitor recovery after high volume", "Consider adding upper body work">],
  "volumeChange": null,
  "intensityChange": null,
  "recoveryDemand": "<low|medium|high|very-high based on volume, intensity, duration>",
  "recommendedRestHours": <24-72 hours based on recovery demand>,
  "coachInsights": "<2-3 sentence TOUGH but FAIR feedback. If they crushed it, RESPECT them. If effort was weak, CALL IT OUT. Address any player notes.>"
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
  apiKey: string
): Promise<{ success: boolean; report?: AIWorkoutReport; error?: string }> {
  try {
    // Validate API key
    if (!apiKey || !apiKey.startsWith('sk-')) {
      return {
        success: false,
        error: 'Invalid API key. Please configure your OpenAI API key in settings.',
      };
    }

    const prompt = buildReportGenerationPrompt(entries, duration, workoutTitle, position, userName);

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
            content: 'You are an expert strength coach for American Football. Analyze workouts intelligently - speed work is NOT the same as strength work. Generate accurate, fair performance scores. Output ONLY valid JSON.',
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
 * Check if API key is configured
 */
export function hasAPIKey(): boolean {
  const apiKey = localStorage.getItem('openai_api_key');
  return Boolean(apiKey && apiKey.startsWith('sk-'));
}

/**
 * Save API key to localStorage
 */
export function saveAPIKey(apiKey: string): boolean {
  if (!apiKey || !apiKey.startsWith('sk-')) {
    return false;
  }
  localStorage.setItem('openai_api_key', apiKey);
  return true;
}

/**
 * Get saved API key
 */
export function getAPIKey(): string | null {
  return localStorage.getItem('openai_api_key');
}

/**
 * Remove API key
 */
export function removeAPIKey(): void {
  localStorage.removeItem('openai_api_key');
}
