import type { DrillTrainingSession } from '../types/drill';
import type { MessageKey } from '../i18n/messages/en';
import { drillService } from './drillService';
import { exportDrillToPDF } from './drillPdfExport';

export const exportSessionToPDF = (
  session: DrillTrainingSession,
  t: (key: MessageKey, params?: Record<string, string | number>) => string
) => {
  // Get all drills in the session
  const allDrills = drillService.getAllDrills();
  const sessionDrills = session.drills
    .map((id: string) => allDrills.find(d => d.id === id))
    .filter(Boolean);

  // Export each drill as a separate PDF
  sessionDrills.forEach((drill: any, index: number) => {
    if (!drill) return;

    // Small delay between downloads to prevent browser blocking
    setTimeout(() => {
      exportDrillToPDF(drill, t);
    }, index * 200); // 200ms delay between each download
  });
};
