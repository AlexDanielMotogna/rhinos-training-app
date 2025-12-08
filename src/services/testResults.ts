/**
 * Test results service - backend only
 */

import { testResultService } from './api';

const TEST_STORAGE_KEYS = {
  strength: 'lastStrengthTest',
  speed: 'lastSpeedTest',
  power: 'lastPowerTest',
  agility: 'lastAgilityTest',
};

/**
 * Save test result locally
 */
export function saveTestResultLocal(testType: string, testData: any): void {
  const key = TEST_STORAGE_KEYS[testType as keyof typeof TEST_STORAGE_KEYS];
  if (!key) {
    console.error('[TEST RESULTS] Invalid test type:', testType);
    return;
  }

  // Save previous test before overwriting
  const previousTest = localStorage.getItem(key);
  if (previousTest) {
    localStorage.setItem(`${key}_previous`, previousTest);
  }

  // Save new test
  localStorage.setItem(key, JSON.stringify(testData));
  console.log(`[TEST RESULTS] Test saved locally: ${testType}`);
}

/**
 * Get test result from local storage
 */
export function getTestResultLocal(testType: string): any | null {
  const key = TEST_STORAGE_KEYS[testType as keyof typeof TEST_STORAGE_KEYS];
  if (!key) {
    console.error('[TEST RESULTS] Invalid test type:', testType);
    return null;
  }

  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : null;
}

/**
 * Save test result with backend sync
 */
export async function saveTestResult(
  testType: 'strength' | 'speed' | 'power' | 'agility',
  testData: any,
  score: number,
  tier: string
): Promise<void> {
  // Save locally first
  saveTestResultLocal(testType, testData);

  try {
    console.log('[TEST RESULTS] Syncing test result to backend...', { testType, score, tier });

    const dateISO = testData.dateISO || new Date().toISOString().split('T')[0];

    await testResultService.create({
      testType,
      dateISO,
      testData,
      score,
      tier,
    });

    console.log('[TEST RESULTS] Test result synced to backend successfully');
  } catch (error) {
    console.warn('[TEST RESULTS] Failed to sync to backend:', error);
    throw error;
  }
}

/**
 * Sync test results from backend to localStorage
 */
export async function syncTestResultsFromBackend(): Promise<void> {
  try {
    console.log('🔄 Syncing test results from backend...');

    const testTypes: Array<keyof typeof TEST_STORAGE_KEYS> = ['strength', 'speed', 'power', 'agility'];

    for (const testType of testTypes) {
      try {
        const backendResult = await testResultService.getLatest(testType);

        if (backendResult) {
          console.log(`📥 Received ${testType} test from backend`);

          // Get existing local test
          const localResult = getTestResultLocal(testType);

          // Only update if backend result is newer or local doesn't exist
          if (!localResult || new Date(backendResult.dateISO) >= new Date(localResult.dateISO)) {
            saveTestResultLocal(testType, backendResult.testData);
            console.log(`✅ ${testType} test synced from backend`);
          } else {
            console.log(`ℹ️ Local ${testType} test is newer, keeping it`);
          }
        } else {
          console.log(`ℹ️ No ${testType} test found in backend`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to sync ${testType} test:`, error);
      }
    }

    console.log('✅ Test results sync completed');
  } catch (error) {
    console.error('❌ Failed to sync test results from backend:', error);
  }
}

/**
 * Delete test result
 */
export async function deleteTestResult(testType: string, testId?: string): Promise<void> {
  // Delete from local storage
  const key = TEST_STORAGE_KEYS[testType as keyof typeof TEST_STORAGE_KEYS];
  if (key) {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_previous`);
    console.log(`[TEST RESULTS] Test deleted locally: ${testType}`);
  }

  // Delete from backend if testId is provided
  if (testId) {
    try {
      await testResultService.delete(testId);
      console.log('[TEST RESULTS] Test deleted from backend');
    } catch (error) {
      console.warn('[TEST RESULTS] Failed to delete from backend:', error);
      throw error;
    }
  }
}
