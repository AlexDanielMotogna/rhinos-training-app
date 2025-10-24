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

  if (sessionDrills.length === 0) {
    alert('No drills found in this session.');
    return;
  }

  // Alert user about multiple downloads
  if (sessionDrills.length > 1) {
    const confirmed = confirm(
      `This session contains ${sessionDrills.length} drills. Each drill will be downloaded as a separate PDF.\n\n` +
      `IMPORTANT: Your browser may ask you to "Allow multiple downloads" - please click ALLOW.\n\n` +
      `Downloads will start in 1 second intervals.\n\nClick OK to continue.`
    );

    if (!confirmed) {
      return;
    }
  }

  // Export each drill as a separate PDF with delay
  let downloadCount = 0;

  const downloadNext = (index: number) => {
    if (index >= sessionDrills.length) {
      console.log(`✅ All ${downloadCount} drill PDFs downloaded successfully!`);
      setTimeout(() => {
        alert(`✅ Downloaded all ${downloadCount} drill PDFs!`);
      }, 500);
      return;
    }

    const drill = sessionDrills[index];
    if (!drill) {
      downloadNext(index + 1);
      return;
    }

    try {
      exportDrillToPDF(drill, t);
      downloadCount++;
      console.log(`✅ Downloaded drill ${index + 1}/${sessionDrills.length}: ${drill.name}`);

      // Schedule next download
      setTimeout(() => downloadNext(index + 1), 1000); // 1 second delay
    } catch (error) {
      console.error(`❌ Failed to download drill: ${drill.name}`, error);
      // Continue with next drill even if one fails
      setTimeout(() => downloadNext(index + 1), 1000);
    }
  };

  // Start the download chain
  downloadNext(0);
};
