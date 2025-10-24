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

  // Helper function to add text with word wrap (compact version)
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    const cleanedText = cleanTextForPDF(text);
    const lines = doc.splitTextToSize(cleanedText, contentWidth);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * (fontSize * 0.35) + 3;
  };

  // Title (more compact)
  addText(drill.name.toUpperCase(), 16, true);
  yPosition += 2;

  // Category and Difficulty badges (inline)
  const categoryText = `${t('drills.category.label')}: ${t(`drills.category.${drill.category}`)}`;
  const difficultyText = `${t('drills.difficulty.label')}: ${t(`drills.difficulty.${drill.difficulty}`)}`;
  addText(`${categoryText} | ${difficultyText}`, 9);
  yPosition += 2;

  // Divider line
  doc.setDrawColor(200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Sketch Image (smaller)
  if (drill.sketchUrl) {
    try {
      const imgWidth = contentWidth;
      const imgHeight = 60; // Reduced height
      doc.addImage(drill.sketchUrl, 'PNG', margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 5;
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      addText(`[${t('drills.sketch')}]`, 8);
    }
  }

  // Description Section (more compact)
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 3, contentWidth, 6, 'F');
  addText(t('drills.description').toUpperCase(), 10, true);
  yPosition -= 3;
  addText(drill.description, 9);
  yPosition += 2;

  // Coaching Points Section (more compact)
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 3, contentWidth, 6, 'F');
  addText(t('drills.coachingPoints').toUpperCase(), 10, true);
  yPosition -= 3;
  addText(drill.coachingPoints, 9);
  yPosition += 2;

  // Training Context (if available, more compact)
  if (drill.trainingContext) {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition - 3, contentWidth, 6, 'F');
    addText(t('drills.trainingContext').toUpperCase(), 10, true);
    yPosition -= 3;
    addText(drill.trainingContext, 9);
    yPosition += 2;
  }

  // Resources Needed Section (more compact)
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, yPosition - 3, contentWidth, 6, 'F');
  addText(t('drills.resourcesNeeded').toUpperCase(), 10, true);
  yPosition -= 3;

  // Personnel (inline)
  const personnelText = `${t('drills.coaches')}: ${drill.coaches} | ${t('drills.dummies')}: ${drill.dummies} | ${t('drills.players')}: ${drill.players}`;
  addText(personnelText, 9);

  // Equipment (inline)
  if (drill.equipment.length > 0) {
    const equipmentText = drill.equipment
      .map((eq: DrillEquipment) => {
        const equipment = equipmentService.getAllEquipment().find(e => e.id === eq.equipmentId);
        return equipment ? `${equipment.name} x${eq.quantity}` : `${t('drills.noEquipment')}`;
      })
      .join(', ');
    addText(`${t('drills.equipment')}: ${equipmentText}`, 9);
  } else {
    addText(`${t('drills.equipment')}: ${t('drills.noEquipment')}`, 9);
  }

  // Footer (at bottom of page)
  doc.setFontSize(7);
  doc.setTextColor(150);
  const footerText = `${t('drills.generatedBy')} - ${new Date().toLocaleDateString()}`;
  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save the PDF
  const fileName = `${drill.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_drill.pdf`;
  doc.save(fileName);
};
