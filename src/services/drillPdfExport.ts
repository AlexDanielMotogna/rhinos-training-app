import jsPDF from 'jspdf';
import type { Drill, DrillEquipment } from '../types/drill';
import { equipmentService } from './equipmentService';
import type { MessageKey } from '../i18n/messages/en';

export const exportDrillToPDF = (drill: Drill, t: (key: MessageKey, params?: Record<string, string | number>) => string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * (fontSize * 0.4) + 5;
  };

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Title
  addText(drill.name.toUpperCase(), 18, true);
  yPosition += 5;

  // Category and Difficulty badges
  const categoryText = `${t('drills.category.label')}: ${t(`drills.category.${drill.category}`)}`;
  const difficultyText = `${t('drills.difficulty.label')}: ${t(`drills.difficulty.${drill.difficulty}`)}`;
  addText(`${categoryText} | ${difficultyText}`, 11);
  yPosition += 5;

  // Divider line
  doc.setDrawColor(200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Sketch Image
  if (drill.sketchUrl) {
    checkPageBreak(100);
    try {
      // Add sketch image
      const imgWidth = contentWidth;
      const imgHeight = 80; // Fixed height for consistency
      doc.addImage(drill.sketchUrl, 'PNG', margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      addText(`[${t('drills.sketch')}]`, 10);
    }
  }

  checkPageBreak(40);

  // Description Section
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 5, contentWidth, 8, 'F');
  addText(t('drills.description').toUpperCase(), 12, true);
  yPosition -= 5;
  addText(drill.description, 11);
  yPosition += 5;

  checkPageBreak(40);

  // Coaching Points Section
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 5, contentWidth, 8, 'F');
  addText(t('drills.coachingPoints').toUpperCase(), 12, true);
  yPosition -= 5;
  addText(drill.coachingPoints, 11);
  yPosition += 5;

  // Training Context (if available)
  if (drill.trainingContext) {
    checkPageBreak(30);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition - 5, contentWidth, 8, 'F');
    addText(t('drills.trainingContext').toUpperCase(), 12, true);
    yPosition -= 5;
    addText(drill.trainingContext, 11);
    yPosition += 5;
  }

  checkPageBreak(60);

  // Resources Needed Section
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, yPosition - 5, contentWidth, 8, 'F');
  addText(t('drills.resourcesNeeded').toUpperCase(), 12, true);
  yPosition -= 5;

  // Personnel
  const personnelText = `${t('drills.coaches')}: ${drill.coaches} | ${t('drills.dummies')}: ${drill.dummies} | ${t('drills.players')}: ${drill.players}`;
  addText(personnelText, 11);

  // Equipment
  if (drill.equipment.length > 0) {
    const equipmentText = drill.equipment
      .map((eq: DrillEquipment) => {
        const equipment = equipmentService.getAllEquipment().find(e => e.id === eq.equipmentId);
        return equipment ? `${equipment.name} x${eq.quantity}` : `${t('drills.noEquipment')}`;
      })
      .join(', ');
    addText(`${t('drills.equipment')}: ${equipmentText}`, 11);
  } else {
    addText(`${t('drills.equipment')}: ${t('drills.noEquipment')}`, 11);
  }

  yPosition += 10;

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  const footerText = `${t('drills.generatedBy')} - ${new Date().toLocaleDateString()}`;
  doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  // Save the PDF
  const fileName = `${drill.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_drill.pdf`;
  doc.save(fileName);
};
