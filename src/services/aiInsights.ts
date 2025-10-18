import type { WorkoutReport } from './workoutAnalysis';
import type { Position } from '../types/exercise';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Build the AI prompt for workout analysis
 * IMPORTANT: AI should NOT suggest changing coach's exercises,
 * only provide feedback on execution quality and training approach
 */
function buildAIPrompt(
  report: WorkoutReport,
  workoutTitle: string,
  position: Position,
  userName: string
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

  return `You are a TOUGH, NO-NONSENSE American Football strength coach. Call out laziness, celebrate real effort, and BE BRUTALLY HONEST.

**Player:** ${userName}
**Position:** ${position}

${exerciseSummary}

**CRITICAL INSTRUCTIONS:**
1. DO NOT suggest changing exercises - the coach programmed them
2. BE HARSH when effort is weak (low RPE, incomplete sets, short duration)
3. BE REAL - if the workout was too easy or too short, CALL IT OUT
4. CELEBRATE real hard work with genuine respect
5. 2-3 sentences MAX - direct, no fluff
6. If RPE < 6 or duration < 20 min or sets incomplete: GET TOUGH
7. If RPE > 7.5 and completed everything: SHOW RESPECT

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
  apiKey: string
): Promise<{ success: boolean; insight?: string; error?: string }> {
  try {
    // Validate API key
    if (!apiKey || !apiKey.startsWith('sk-')) {
      return {
        success: false,
        error: 'Invalid API key. Please configure your OpenAI API key in settings.',
      };
    }

    const prompt = buildAIPrompt(report, workoutTitle, position, userName);

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
