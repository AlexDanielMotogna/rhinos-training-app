import cron from 'node-cron';
import prisma from './prisma.js';

/**
 * Close expired attendance polls
 * Runs every 5 minutes
 */
export function startPollExpirationJob() {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      console.log(`[CRON] Checking for expired polls at ${now.toISOString()}`);

      // Find active polls that have expired
      const expiredPolls = await prisma.attendancePoll.findMany({
        where: {
          isActive: true,
          expiresAt: {
            lte: now.toISOString(),
          },
        },
      });

      if (expiredPolls.length > 0) {
        console.log(`[CRON] Found ${expiredPolls.length} expired polls, closing them...`);

        // Close all expired polls
        for (const poll of expiredPolls) {
          await prisma.attendancePoll.update({
            where: { id: poll.id },
            data: { isActive: false },
          });
          console.log(`[CRON] Closed poll: ${poll.sessionName} (${poll.id})`);
        }

        console.log(`[CRON] Successfully closed ${expiredPolls.length} polls`);
      } else {
        console.log('[CRON] No expired polls found');
      }
    } catch (error) {
      console.error('[CRON] Error closing expired polls:', error);
    }
  });

  console.log('[CRON] Poll expiration job started (runs every 5 minutes)');
}

/**
 * Start all cron jobs
 */
export function startCronJobs() {
  console.log('[CRON] Starting cron jobs...');
  startPollExpirationJob();
}
