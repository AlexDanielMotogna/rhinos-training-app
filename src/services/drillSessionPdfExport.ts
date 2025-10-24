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

  // Alert user about multiple downloads
  if (sessionDrills.length > 1) {
    alert(`Downloading ${sessionDrills.length} drill PDFs. Please allow multiple downloads in your browser if prompted.`);
  }

  // Export each drill as a separate PDF with increased delay
  sessionDrills.forEach((drill: any, index: number) => {
    if (!drill) return;

    // Increased delay to prevent browser blocking (800ms between each)
    setTimeout(() => {
      try {
        exportDrillToPDF(drill, t);
        console.log(`Downloaded drill ${index + 1}/${sessionDrills.length}: ${drill.name}`);
      } catch (error) {
        console.error(`Failed to download drill: ${drill.name}`, error);
      }
    }, index * 800); // 800ms delay between each download
  });
};
