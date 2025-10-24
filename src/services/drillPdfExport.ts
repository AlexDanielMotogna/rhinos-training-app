import jsPDF from 'jspdf';
import type { Drill, DrillEquipment } from '../types/drill';
import { equipmentService } from './equipmentService';
import type { MessageKey } from '../i18n/messages/en';

export const exportDrillToPDF = (drill: Drill, t: (key: MessageKey, params?: Record<string, string | number>) => string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = 15;

  // Helper function to remove emojis and special characters that PDF doesn't support
  const cleanTextForPDF = (text: string): string => {
    // Remove emojis and other unicode characters that Helvetica doesn't support
    return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
  };

  // Green Bay Packers colors
  const packersGreen = [24, 48, 40];
  const packersGold = [255, 184, 28];

  // Header with background
  doc.setFillColor(packersGreen[0], packersGreen[1], packersGreen[2]);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Title in white on green background
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const cleanTitle = cleanTextForPDF(drill.name.toUpperCase());
  doc.text(cleanTitle, pageWidth / 2, 20, { align: 'center' });

  yPosition = 40;

  // Category and Difficulty badges with gold accent
  doc.setFillColor(packersGold[0], packersGold[1], packersGold[2]);
  doc.roundedRect(margin, yPosition - 5, contentWidth, 10, 2, 2, 'F');

  doc.setTextColor(packersGreen[0], packersGreen[1], packersGreen[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const categoryText = cleanTextForPDF(`${t('drills.category.label')}: ${t(`drills.category.${drill.category}`)}`);
  const difficultyText = cleanTextForPDF(`${t('drills.difficulty.label')}: ${t(`drills.difficulty.${drill.difficulty}`)}`);
  doc.text(`${categoryText}  |  ${difficultyText}`, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 8;

  // Sketch Image with border
  if (drill.sketchUrl) {
    try {
      const imgWidth = contentWidth;
      const imgHeight = 55;

      // Add border around image
      doc.setDrawColor(packersGreen[0], packersGreen[1], packersGreen[2]);
      doc.setLineWidth(0.5);
      doc.rect(margin - 1, yPosition - 1, imgWidth + 2, imgHeight + 2);

      doc.addImage(drill.sketchUrl, 'PNG', margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 6;
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text(`[${cleanTextForPDF(t('drills.sketch'))}]`, margin, yPosition);
      yPosition += 5;
    }
  }

  // Reset text color for sections
  doc.setTextColor(0, 0, 0);

  // Description Section with green header
  doc.setFillColor(packersGreen[0], packersGreen[1], packersGreen[2]);
  doc.roundedRect(margin, yPosition - 2, contentWidth, 7, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(cleanTextForPDF(t('drills.description').toUpperCase()), margin + 2, yPosition + 3);
  yPosition += 9;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const descLines = doc.splitTextToSize(cleanTextForPDF(drill.description), contentWidth - 4);
  doc.text(descLines, margin + 2, yPosition);
  yPosition += descLines.length * 3.2 + 3;

  // Coaching Points Section with green header
  doc.setFillColor(packersGreen[0], packersGreen[1], packersGreen[2]);
  doc.roundedRect(margin, yPosition - 2, contentWidth, 7, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(cleanTextForPDF(t('drills.coachingPoints').toUpperCase()), margin + 2, yPosition + 3);
  yPosition += 9;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const coachLines = doc.splitTextToSize(cleanTextForPDF(drill.coachingPoints), contentWidth - 4);
  doc.text(coachLines, margin + 2, yPosition);
  yPosition += coachLines.length * 3.2 + 3;

  // Training Context (if available)
  if (drill.trainingContext) {
    doc.setFillColor(packersGreen[0], packersGreen[1], packersGreen[2]);
    doc.roundedRect(margin, yPosition - 2, contentWidth, 7, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(cleanTextForPDF(t('drills.trainingContext').toUpperCase()), margin + 2, yPosition + 3);
    yPosition += 9;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const contextLines = doc.splitTextToSize(cleanTextForPDF(drill.trainingContext), contentWidth - 4);
    doc.text(contextLines, margin + 2, yPosition);
    yPosition += contextLines.length * 3.2 + 3;
  }

  // Resources Needed Section with gold background
  doc.setFillColor(packersGold[0], packersGold[1], packersGold[2]);
  doc.roundedRect(margin, yPosition - 2, contentWidth, 7, 1, 1, 'F');
  doc.setTextColor(packersGreen[0], packersGreen[1], packersGreen[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(cleanTextForPDF(t('drills.resourcesNeeded').toUpperCase()), margin + 2, yPosition + 3);
  yPosition += 9;

  // Personnel with icons (simulated with text)
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const personnelText = cleanTextForPDF(`${t('drills.coaches')}: ${drill.coaches}  |  ${t('drills.dummies')}: ${drill.dummies}  |  ${t('drills.players')}: ${drill.players}`);
  doc.text(personnelText, margin + 2, yPosition);
  yPosition += 5;

  // Equipment
  if (drill.equipment.length > 0) {
    const equipmentText = drill.equipment
      .map((eq: DrillEquipment) => {
        const equipment = equipmentService.getAllEquipment().find(e => e.id === eq.equipmentId);
        return equipment ? `${equipment.name} x${eq.quantity}` : cleanTextForPDF(t('drills.noEquipment'));
      })
      .join(', ');
    const equipLines = doc.splitTextToSize(cleanTextForPDF(`${t('drills.equipment')}: ${equipmentText}`), contentWidth - 4);
    doc.text(equipLines, margin + 2, yPosition);
    yPosition += equipLines.length * 3.2;
  } else {
    doc.text(cleanTextForPDF(`${t('drills.equipment')}: ${t('drills.noEquipment')}`), margin + 2, yPosition);
    yPosition += 4;
  }

  // Footer with green bar
  doc.setFillColor(packersGreen[0], packersGreen[1], packersGreen[2]);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  const footerText = cleanTextForPDF(`${t('drills.generatedBy')} - ${new Date().toLocaleDateString()}`);
  doc.text(footerText, pageWidth / 2, pageHeight - 7, { align: 'center' });

  // Save the PDF
  const fileName = `${drill.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_drill.pdf`;
  doc.save(fileName);
};
