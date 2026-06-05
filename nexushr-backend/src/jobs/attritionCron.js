import cron from 'node-cron';
import { redis } from '../config/redis.js';
import { Company } from '../models/index.js';
import { getAttritionRisk } from '../modules/analytics/analytics.service.js';

/**
 * Nightly attrition-risk cache warm-up. Runs at 02:00 AM IST.
 */
export const startAttritionCron = () => {
  cron.schedule(
    '30 20 * * *', // 20:30 UTC = 02:00 IST
    async () => {
      console.log('[Cron] Starting nightly attrition risk analysis...');
      try {
        const companies = await Company.find({ isActive: true }).select('_id').lean();
        for (const company of companies) {
          await redis.del(`attrition_risk:${company._id}`); // invalidate
          await getAttritionRisk(company._id.toString(), redis); // regenerate + cache
          console.log(`[Cron] Attrition risk updated for company ${company._id}`);
        }
        console.log('[Cron] Nightly attrition analysis complete.');
      } catch (err) {
        console.error('[Cron] Attrition cron failed:', err.message);
      }
    },
    { timezone: 'Asia/Kolkata' }
  );
};
