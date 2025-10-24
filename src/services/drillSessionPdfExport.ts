import jsPDF from 'jspdf';
import type { DrillTrainingSession } from '../types/drill';
import type { MessageKey } from '../i18n/messages/en';
import { drillService } from './drillService';
import { equipmentService } from './equipmentService';

export const exportSessionToPDF = (
  session: DrillTrainingSession,
  t: (key: MessageKey, params?: Record<string, string | number>) => string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
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
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Get all drills in the session
  const allDrills = drillService.getAllDrills();
  const sessionDrills = session.drills.map((id: string) => allDrills.find(d => d.id === id)).filter(Boolean);

  // Calculate resource summary
  const resourceSummary = drillService.calculateResourceSummary(session.drills);

  // ========== PAGE 1: SESSION OVERVIEW ==========

  // Title
  addText(session.name.toUpperCase(), 20, true);
  yPosition += 2;

  // Date
  const dateText = `${t('admin.date')}: ${new Date(session.date).toLocaleDateString()}`;
  addText(dateText, 11);
  yPosition += 3;

  // Divider line
  doc.setDrawColor(200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Notes (if exists)
  if (session.notes) {
    addText(t('drills.notes').toUpperCase(), 12, true);
    yPosition -= 5;
    addText(session.notes, 11);
    yPosition += 5;
  }

  checkPageBreak(60);

  // ========== RESOURCE SUMMARY SECTION ==========
  doc.setFillColor(45, 55, 72); // Dark blue-gray background
  doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');
  doc.setTextColor(255, 255, 255); // White text
  addText(t('drills.resourcesNeeded').toUpperCase(), 14, true);
  doc.setTextColor(0, 0, 0); // Reset to black
  yPosition += 5;

  // Personnel box
  doc.setFillColor(240, 248, 255); // Light blue background
  doc.rect(margin, yPosition, contentWidth, 25, 'F');
  doc.setDrawColor(100, 149, 237);
  doc.rect(margin, yPosition, contentWidth, 25, 'S');

  yPosition += 8;
  const personnelText = `👥 ${t('drills.coaches')}: ${resourceSummary.totalCoaches}  |  🎯 ${t('drills.dummies')}: ${resourceSummary.totalDummies}  |  🏃 ${t('drills.players')}: ${resourceSummary.totalPlayers}`;
  addText(personnelText, 12, true);
  yPosition += 12;

  // Equipment box
  if (resourceSummary.totalEquipment.size > 0) {
    checkPageBreak(40);
    doc.setFillColor(255, 250, 240); // Light orange background
    const equipmentHeight = Math.min(resourceSummary.totalEquipment.size * 7 + 10, 60);
    doc.rect(margin, yPosition, contentWidth, equipmentHeight, 'F');
    doc.setDrawColor(255, 165, 0);
    doc.rect(margin, yPosition, contentWidth, equipmentHeight, 'S');

    yPosition += 8;
    addText(`📦 ${t('drills.equipment').toUpperCase()}:`, 11, true);
    yPosition -= 3;

    const equipmentList: string[] = [];
    resourceSummary.totalEquipment.forEach((quantity: number, equipmentId: string) => {
      const equipment = equipmentService.getAllEquipment().find(e => e.id === equipmentId);
      if (equipment) {
        equipmentList.push(`   • ${equipment.name} x${quantity}`);
      }
    });

    addText(equipmentList.join('\n'), 10);
    yPosition += 5;
  }

  yPosition += 10;

  // ========== DRILLS SECTION ==========
  checkPageBreak(40);
  doc.setFillColor(34, 139, 34); // Green background
  doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');
  doc.setTextColor(255, 255, 255); // White text
  addText(`${t('drills.drillsIncluded')} (${sessionDrills.length})`, 14, true);
  doc.setTextColor(0, 0, 0); // Reset to black
  yPosition += 5;

  // List each drill with details
  sessionDrills.forEach((drill: any, index: number) => {
    if (!drill) return;

    checkPageBreak(70);

    // Drill number and name
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPosition, contentWidth, 8, 'F');
    addText(`${index + 1}. ${drill.name.toUpperCase()}`, 13, true);
    yPosition -= 3;

    // Category and Difficulty
    const categoryText = `${t('drills.category.label')}: ${t(`drills.category.${drill.category}` as MessageKey)}`;
    const difficultyText = `${t('drills.difficulty.label')}: ${t(`drills.difficulty.${drill.difficulty}` as MessageKey)}`;
    addText(`   ${categoryText} | ${difficultyText}`, 9);
    yPosition -= 2;

    // Description
    addText(`   ${t('drills.description')}: ${drill.description}`, 9);
    yPosition -= 2;

    // Coaching Points
    addText(`   ${t('drills.coachingPoints')}: ${drill.coachingPoints}`, 9);
    yPosition -= 2;

    // Training Context
    if (drill.trainingContext) {
      addText(`   ${t('drills.trainingContext')}: ${drill.trainingContext}`, 9);
      yPosition -= 2;
    }

    // Drill-specific resources
    const drillEquipmentText = drill.equipment.length > 0
      ? drill.equipment
          .map((eq: any) => {
            const equipment = equipmentService.getAllEquipment().find(e => e.id === eq.equipmentId);
            return equipment ? `${equipment.name} x${eq.quantity}` : '';
          })
          .filter(Boolean)
          .join(', ')
      : t('drills.noEquipment');

    addText(`   ${t('drills.equipment')}: ${drillEquipmentText}`, 9);
    const personnelLabel = 'Personnel' as MessageKey; // Fallback since it's not in translations
    addText(`   ${personnelLabel}: ${drill.coaches} ${t('drills.coaches')}, ${drill.dummies} ${t('drills.dummies')}, ${drill.players} ${t('drills.players')}`, 9);

    yPosition += 8;
  });

  // ========== FOOTER ON EVERY PAGE ==========
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);

    // Footer text
    const footerText = `Session generated by Rhinos Training App - ${new Date().toLocaleDateString()} - Page ${i}/${totalPages}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // Save the PDF
  const fileName = `${session.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_session.pdf`;
  doc.save(fileName);
};
