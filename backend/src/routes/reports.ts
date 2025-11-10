import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { generateDailyReport, generateWeeklyReport, generateMonthlyReport } from '../services/reports.js';

const router = express.Router();

/**
 * GET /api/reports/daily/:date
 * Get daily report for a specific date (coach only)
 * @param date - Date in YYYY-MM-DD format (optional, defaults to today)
 */
router.get('/daily/:date?', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Only coaches can access reports
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can access reports' });
    }

    const date = req.params.date ? new Date(req.params.date) : new Date();

    // Validate date
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    console.log(`[REPORTS] Generating daily report for ${date.toISOString().split('T')[0]}`);

    const report = await generateDailyReport(date);

    res.json(report);
  } catch (error) {
    console.error('[REPORTS] Daily report error:', error);
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
});

/**
 * GET /api/reports/weekly/:startDate?
 * Get weekly report starting from a specific date (coach only)
 * @param startDate - Start date in YYYY-MM-DD format (optional, defaults to current week start)
 */
router.get('/weekly/:startDate?', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Only coaches can access reports
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can access reports' });
    }

    let startDate: Date;

    if (req.params.startDate) {
      startDate = new Date(req.params.startDate);

      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
    } else {
      // Default to current week (Monday)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
      startDate = new Date(today);
      startDate.setDate(today.getDate() + diff);
      startDate.setHours(0, 0, 0, 0);
    }

    console.log(`[REPORTS] Generating weekly report starting from ${startDate.toISOString().split('T')[0]}`);

    const report = await generateWeeklyReport(startDate);

    res.json(report);
  } catch (error) {
    console.error('[REPORTS] Weekly report error:', error);
    res.status(500).json({ error: 'Failed to generate weekly report' });
  }
});

/**
 * GET /api/reports/monthly/:month?
 * Get monthly report for a specific month (coach only)
 * @param month - Month in YYYY-MM format (optional, defaults to current month)
 */
router.get('/monthly/:month?', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Only coaches can access reports
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can access reports' });
    }

    let month: string;

    if (req.params.month) {
      month = req.params.month;

      // Validate format YYYY-MM
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
      }
    } else {
      // Default to current month
      const today = new Date();
      month = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    }

    console.log(`[REPORTS] Generating monthly report for ${month}`);

    const report = await generateMonthlyReport(month);

    res.json(report);
  } catch (error) {
    console.error('[REPORTS] Monthly report error:', error);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

export default router;
