import type { TrainingTemplate, TrainingTemplateDTO, TrainingType, TrainingAssignment, TrainingAssignmentDTO } from '../types/trainingBuilder';
import type { Position, Exercise } from '../types/exercise';
import { globalCatalog } from './catalog';

/**
 * Mock Training Templates Storage
 * In production, this would be replaced with API calls
 */
const STORAGE_KEY = 'training_templates';
const TRAINING_TYPES_KEY = 'training_types';
const ASSIGNMENTS_KEY = 'training_assignments';

/**
 * Get all training types
 */
export function getTrainingTypes(): TrainingType[] {
  const stored = localStorage.getItem(TRAINING_TYPES_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  // Default training types
  const defaults: TrainingType[] = [
    {
      id: '1',
      key: 'strength_conditioning',
      nameEN: 'Strength & Conditioning',
      nameDE: 'Kraft & Kondition',
      season: 'off-season',
      active: true,
    },
    {
      id: '2',
      key: 'sprints_speed',
      nameEN: 'Sprints / Speed',
      nameDE: 'Sprints / Geschwindigkeit',
      season: 'off-season',
      active: true,
    },
    {
      id: '3',
      key: 'cb_drills',
      nameEN: 'CB Drills',
      nameDE: 'CB-Übungen',
      season: 'in-season',
      active: true,
    },
  ];

  localStorage.setItem(TRAINING_TYPES_KEY, JSON.stringify(defaults));
  return defaults;
}

/**
 * Save training types
 */
export function saveTrainingTypes(types: TrainingType[]): void {
  localStorage.setItem(TRAINING_TYPES_KEY, JSON.stringify(types));
}

/**
 * Get all training templates
 */
export function getTrainingTemplates(): TrainingTemplate[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  // Return empty array - no hardcoded defaults
  // Coaches must create their own templates
  return [];
}

/**
 * Get templates for a specific training type
 */
export function getTemplatesByTrainingType(trainingTypeId: string): TrainingTemplate[] {
  const allTemplates = getTrainingTemplates();
  return allTemplates.filter(t => t.trainingTypeId === trainingTypeId);
}

/**
 * Get template for a specific position and training type
 */
export function getTemplateByPositionAndType(position: Position, trainingTypeId: string): TrainingTemplate | null {
  const allTemplates = getTrainingTemplates();
  return allTemplates.find(t => t.positions.includes(position) && t.trainingTypeId === trainingTypeId) || null;
}

/**
 * Create a new training template
 */
export function createTrainingTemplate(dto: TrainingTemplateDTO): TrainingTemplate {
  const templates = getTrainingTemplates();
  const trainingTypes = getTrainingTypes();
  const trainingType = trainingTypes.find(tt => tt.id === dto.trainingTypeId);

  if (!trainingType) {
    throw new Error('Training type not found');
  }

  const newTemplate: TrainingTemplate = {
    id: Date.now().toString(),
    trainingTypeId: dto.trainingTypeId,
    trainingTypeName: trainingType.nameEN,
    positions: dto.positions,
    durationWeeks: dto.durationWeeks,
    frequencyPerWeek: dto.frequencyPerWeek,
    weeklyNotes: dto.weeklyNotes,
    blocks: dto.blocks.map(blockDto => ({
      id: `block-${Date.now()}-${Math.random()}`,
      title: blockDto.title,
      order: blockDto.order,
      dayOfWeek: blockDto.dayOfWeek,
      dayNumber: blockDto.dayNumber,
      sessionName: blockDto.sessionName,
      exercises: blockDto.exerciseIds
        .map(id => globalCatalog.find(ex => ex.id === id))
        .filter((ex): ex is Exercise => ex !== undefined),
      globalSets: blockDto.globalSets,
      exerciseConfigs: blockDto.exerciseConfigs,
    } as any)),
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  templates.push(newTemplate);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));

  return newTemplate;
}

/**
 * Update an existing training template
 */
export function updateTrainingTemplate(id: string, dto: TrainingTemplateDTO): TrainingTemplate {
  const templates = getTrainingTemplates();
  const index = templates.findIndex(t => t.id === id);

  if (index === -1) {
    throw new Error('Template not found');
  }

  const trainingTypes = getTrainingTypes();
  const trainingType = trainingTypes.find(tt => tt.id === dto.trainingTypeId);

  if (!trainingType) {
    throw new Error('Training type not found');
  }

  const updated: TrainingTemplate = {
    ...templates[index],
    trainingTypeId: dto.trainingTypeId,
    trainingTypeName: trainingType.nameEN,
    positions: dto.positions,
    durationWeeks: dto.durationWeeks,
    frequencyPerWeek: dto.frequencyPerWeek,
    weeklyNotes: dto.weeklyNotes,
    blocks: dto.blocks.map(blockDto => ({
      id: `block-${Date.now()}-${Math.random()}`,
      title: blockDto.title,
      order: blockDto.order,
      dayOfWeek: blockDto.dayOfWeek,
      dayNumber: blockDto.dayNumber,
      sessionName: blockDto.sessionName,
      exercises: blockDto.exerciseIds
        .map(id => globalCatalog.find(ex => ex.id === id))
        .filter((ex): ex is Exercise => ex !== undefined),
      globalSets: blockDto.globalSets,
      exerciseConfigs: blockDto.exerciseConfigs,
    } as any)),
    updatedAt: new Date().toISOString(),
  };

  templates[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));

  return updated;
}

/**
 * Delete a training template
 */
export function deleteTrainingTemplate(id: string): void {
  const templates = getTrainingTemplates();
  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Toggle template active status
 */
export function toggleTemplateActive(id: string): void {
  const templates = getTrainingTemplates();
  const template = templates.find(t => t.id === id);

  if (template) {
    template.active = !template.active;
    template.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }
}

/**
 * Get templates for a specific position (used by MyTraining page)
 */
export function getTemplatesForPosition(position: Position): { [trainingTypeKey: string]: TrainingTemplate } {
  const allTemplates = getTrainingTemplates();
  const positionTemplates = allTemplates.filter(t => t.positions.includes(position) && t.active);

  const result: { [key: string]: TrainingTemplate } = {};
  positionTemplates.forEach(template => {
    const trainingTypes = getTrainingTypes();
    const trainingType = trainingTypes.find(tt => tt.id === template.trainingTypeId);
    if (trainingType) {
      result[trainingType.key] = template;
    }
  });

  return result;
}

/**
 * ======================================
 * TRAINING ASSIGNMENTS
 * ======================================
 */

/**
 * Get all training assignments
 */
export function getTrainingAssignments(): TrainingAssignment[] {
  const stored = localStorage.getItem(ASSIGNMENTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Create a new training assignment
 */
export function createTrainingAssignment(dto: TrainingAssignmentDTO, coachId: string): TrainingAssignment {
  const assignments = getTrainingAssignments();
  const template = getTrainingTemplates().find(t => t.id === dto.templateId);

  if (!template) {
    throw new Error('Template not found');
  }

  // Calculate end date based on template duration
  const startDate = new Date(dto.startDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (template.durationWeeks * 7));

  const newAssignment: TrainingAssignment = {
    id: Date.now().toString(),
    templateId: dto.templateId,
    playerIds: dto.playerIds,
    startDate: dto.startDate,
    endDate: endDate.toISOString().split('T')[0],
    active: true,
    createdAt: new Date().toISOString(),
    createdBy: coachId,
  };

  assignments.push(newAssignment);
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));

  return newAssignment;
}

/**
 * Update an existing training assignment
 */
export function updateTrainingAssignment(id: string, dto: TrainingAssignmentDTO, _coachId: string): TrainingAssignment {
  const assignments = getTrainingAssignments();
  const template = getTrainingTemplates().find(t => t.id === dto.templateId);
  const assignmentIndex = assignments.findIndex(a => a.id === id);

  if (assignmentIndex === -1) {
    throw new Error('Assignment not found');
  }

  if (!template) {
    throw new Error('Template not found');
  }

  // Calculate end date based on template duration
  const startDate = new Date(dto.startDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (template.durationWeeks * 7));

  const updatedAssignment: TrainingAssignment = {
    ...assignments[assignmentIndex],
    templateId: dto.templateId,
    playerIds: dto.playerIds,
    startDate: dto.startDate,
    endDate: endDate.toISOString().split('T')[0],
  };

  assignments[assignmentIndex] = updatedAssignment;
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));

  return updatedAssignment;
}

/**
 * Get active assignments for a specific player
 */
export function getActiveAssignmentsForPlayer(playerId: string): Array<TrainingAssignment & { template: TrainingTemplate }> {
  const assignments = getTrainingAssignments();
  const templates = getTrainingTemplates();
  const today = new Date().toISOString().split('T')[0];

  return assignments
    .filter(a =>
      a.active &&
      a.playerIds.includes(playerId) &&
      a.startDate <= today &&
      a.endDate >= today
    )
    .map(assignment => {
      const template = templates.find(t => t.id === assignment.templateId)!;
      return { ...assignment, template };
    });
}

/**
 * Deactivate an assignment
 */
export function deactivateAssignment(id: string): void {
  const assignments = getTrainingAssignments();
  const assignment = assignments.find(a => a.id === id);

  if (assignment) {
    assignment.active = false;
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
  }
}

/**
 * Delete an assignment
 */
export function deleteAssignment(id: string): void {
  const assignments = getTrainingAssignments();
  const filtered = assignments.filter(a => a.id !== id);
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(filtered));
}

/**
 * Player info for assignment
 */
export interface PlayerInfo {
  id: string;
  name: string;
  position: Position;
  jerseyNumber: number;
}

/**
 * Get all players (users with role='player') from localStorage
 * In production, this would fetch from backend API
 */
export function getMockPlayers(): PlayerInfo[] {
  // Try to get real users from localStorage
  const usersKey = 'rhinos_users';
  const stored = localStorage.getItem(usersKey);

  if (stored) {
    try {
      const allUsers = JSON.parse(stored);
      // Filter only players (not coaches)
      const players = allUsers
        .filter((user: any) => user.role === 'player')
        .map((user: any) => ({
          id: user.id,
          name: user.name,
          position: user.position,
          jerseyNumber: user.jerseyNumber,
        }));

      // If we have real players, return them
      if (players.length > 0) {
        return players;
      }
    } catch (e) {
      console.error('Error parsing users from localStorage', e);
    }
  }

  // Fallback to mock players if no real users exist
  return [
    { id: 'mock-1', name: 'John Doe (Demo)', position: 'RB' as const, jerseyNumber: 23 },
    { id: 'mock-2', name: 'Mike Smith (Demo)', position: 'WR' as const, jerseyNumber: 12 },
    { id: 'mock-3', name: 'James Brown (Demo)', position: 'LB' as const, jerseyNumber: 55 },
    { id: 'mock-4', name: 'David Wilson (Demo)', position: 'QB' as const, jerseyNumber: 7 },
    { id: 'mock-5', name: 'Chris Lee (Demo)', position: 'TE' as const, jerseyNumber: 88 },
  ];
}
