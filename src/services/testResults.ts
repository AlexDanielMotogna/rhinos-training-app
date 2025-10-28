import { testResultService } from './api';
import { isOnline } from './sync';

const TEST_STORAGE_KEYS = {
  strength: 'lastStrengthTest',
  speed: 'lastSpeedTest',
  power: 'lastPowerTest',
  agility: 'lastAgilityTest',
};

const SYNCING_KEY = 'rhinos_syncing_tests';

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
 * This is the main function to use when saving test results
 */
export async function saveTestResult(
  testType: 'strength' | 'speed' | 'power' | 'agility',
  testData: any,
  score: number,
  tier: string
): Promise<void> {
  // Save locally first
  saveTestResultLocal(testType, testData);

  // Try to sync with backend if online
  const online = isOnline();
  if (online) {
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
      console.warn('[TEST RESULTS] Failed to sync to backend, keeping local changes:', error);
      // Keep local changes even if backend sync fails
    }
  } else {
    console.log('[TEST RESULTS] Offline - test saved locally only');
  }
}

/**
 * Sync test results from backend to localStorage
 * This should be called on app startup and when coming back online
 */
export async function syncTestResultsFromBackend(): Promise<void> {
  if (!isOnline()) {
    console.log('📦 Offline - skipping test results sync');
    return;
  }

  // Check if already syncing to prevent duplicate calls
  const isSyncing = localStorage.getItem(SYNCING_KEY);
  if (isSyncing === 'true') {
    console.log('[TEST RESULTS] Already syncing, skipping duplicate call');
    return;
  }

  try {
    // Set syncing flag
    localStorage.setItem(SYNCING_KEY, 'true');
    console.log('🔄 Syncing test results from backend...');

    // Fetch all test types
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
        // Continue with other test types
      }
    }

    console.log('✅ Test results sync completed');
  } catch (error) {
    console.error('❌ Failed to sync test results from backend:', error);
  } finally {
    // Clear syncing flag
    localStorage.removeItem(SYNCING_KEY);
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

  // Try to delete from backend if online and testId is provided
  if (isOnline() && testId) {
    try {
      await testResultService.delete(testId);
      console.log('[TEST RESULTS] Test deleted from backend');
    } catch (error) {
      console.warn('[TEST RESULTS] Failed to delete from backend:', error);
    }
  }
}
