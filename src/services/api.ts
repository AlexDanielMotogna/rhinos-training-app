// API service for backend communication
import { logger } from './logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface SignupData {
  email: string;
  password: string;
  name: string;
  role: 'player' | 'coach';
  coachCode?: string;
  jerseyNumber?: number;
  birthDate?: string;
  age?: number;
  weightKg?: number;
  heightCm?: number;
  position?: string;
  sex?: 'male' | 'female';
  ageCategory?: string;
  coachCategories?: string[];
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token?: string; // JWT token for Bearer authentication
  user: {
    id: string;
    email: string;
    name: string;
    role: 'player' | 'coach';
    jerseyNumber?: number;
    birthDate?: string;
    position?: string;
    age?: number;
    weightKg?: number;
    heightCm?: number;
    sex?: 'male' | 'female';
    phone?: string;
    instagram?: string;
    snapchat?: string;
    tiktok?: string;
    hudl?: string;
    metricsPublic?: boolean;
    aiCoachEnabled?: boolean;
    ageCategory?: string;
    coachCategories?: string[];
  };
}

// Helper to get auth token from localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper to store auth token in localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

// Helper to clear user data from localStorage
export const clearAuthData = (): void => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');
};

// CSRF token management
let csrfToken: string | null = null;

// Get CSRF token from backend
const getCsrfToken = async (): Promise<string> => {
  if (csrfToken) return csrfToken;

  try {
    const response = await fetch(`${API_URL}/csrf-token`, {
      credentials: 'include',
    });
    const data = await response.json();
    csrfToken = data.csrfToken;
    return csrfToken!;
  } catch (error) {
    logger.error('Failed to get CSRF token', error);
    throw new Error('CSRF token unavailable');
  }
};

// Clear CSRF token (call on logout)
export const clearCsrfToken = (): void => {
  csrfToken = null;
};

// API call helper with credentials (cookies) and CSRF protection
export const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // Don't set Content-Type for FormData - browser will set it automatically with boundary
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  // Add Authorization header with Bearer token if available
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // CSRF protection disabled - using Bearer tokens provides sufficient protection

  logger.apiRequest(options.method || 'GET', endpoint);

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Keep for CSRF cookie
  });

  logger.apiResponse(options.method || 'GET', endpoint, response.status);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    logger.error(`API error on ${endpoint}`, error);
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();

  // Debug logging only in development
  if (endpoint === '/exercises' && Array.isArray(data)) {
    logger.debug(`Received ${data.length} exercises`, {
      firstExercise: data[0],
      muscleGroups: data[0]?.muscleGroups,
      withLegs: data.filter((e: any) => e.muscleGroups?.includes('legs')).length,
    });
  } else {
    logger.debug(`API data from ${endpoint}`, {
      type: Array.isArray(data) ? 'array' : 'object',
      count: Array.isArray(data) ? data.length : 1,
    });
  }

  return data;
};

// Auth endpoints
export const authService = {
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await apiCall<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store token and user in localStorage
    if (response.token) {
      setAuthToken(response.token);
    }
    localStorage.setItem('currentUser', JSON.stringify(response.user));

    return response;
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiCall<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store token and user in localStorage
    if (response.token) {
      setAuthToken(response.token);
    }
    localStorage.setItem('currentUser', JSON.stringify(response.user));

    return response;
  },

  async logout(): Promise<void> {
    await apiCall('/auth/logout', {
      method: 'POST',
    });

    // Clear user data from localStorage and CSRF token
    clearAuthData();
    clearCsrfToken();
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },
};

// User endpoints
export const userService = {
  async getProfile() {
    return apiCall('/users/me');
  },

  async getMe() {
    return apiCall('/users/me');
  },

  async getAllUsers() {
    return apiCall('/users');
  },

  async getUserById(id: string) {
    return apiCall(`/users/${id}`);
  },

  async updateProfile(data: any) {
    return apiCall('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Exercise endpoints
export const exerciseService = {
  async getAll() {
    return apiCall('/exercises');
  },

  async getById(id: string) {
    return apiCall(`/exercises/${id}`);
  },

  async create(data: any) {
    return apiCall('/exercises', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiCall(`/exercises/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiCall(`/exercises/${id}`, {
      method: 'DELETE',
    });
  },
};

// Template endpoints
export const templateService = {
  async getAll(filters?: { trainingType?: string; position?: string; season?: string }) {
    const params = new URLSearchParams();
    if (filters?.trainingType) params.append('trainingType', filters.trainingType);
    if (filters?.position) params.append('position', filters.position);
    if (filters?.season) params.append('season', filters.season);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/templates${query}`);
  },

  async getById(id: string) {
    return apiCall(`/templates/${id}`);
  },

  async create(data: any) {
    return apiCall('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiCall(`/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiCall(`/templates/${id}`, {
      method: 'DELETE',
    });
  },
};

// Assignment endpoints
export const assignmentService = {
  async getAll(filters?: { playerId?: string; templateId?: string }) {
    const params = new URLSearchParams();
    if (filters?.playerId) params.append('playerId', filters.playerId);
    if (filters?.templateId) params.append('templateId', filters.templateId);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/assignments${query}`);
  },

  async getById(id: string) {
    return apiCall(`/assignments/${id}`);
  },

  async create(data: any) {
    return apiCall('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiCall(`/assignments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiCall(`/assignments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Workout endpoints
export const workoutService = {
  async getAll(filters?: { userId?: string; startDate?: string; endDate?: string; trainingType?: string }) {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.trainingType) params.append('trainingType', filters.trainingType);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/workouts${query}`);
  },

  async getById(id: string) {
    return apiCall(`/workouts/${id}`);
  },

  async create(data: any) {
    return apiCall('/workouts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiCall(`/workouts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiCall(`/workouts/${id}`, {
      method: 'DELETE',
    });
  },

  async getStats(userId: string, filters?: { startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/workouts/stats/${userId}${query}`);
  },
};

// Workout Reports endpoints
export const workoutReportService = {
  async getAll(filters?: { userId?: string; source?: 'coach' | 'player' }) {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.source) params.append('source', filters.source);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/workouts/reports${query}`);
  },

  async create(data: any) {
    return apiCall('/workouts/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiCall(`/workouts/reports/${id}`, {
      method: 'DELETE',
    });
  },
};

// Training Session endpoints
export const trainingSessionService = {
  async getAll(filters?: { from?: string; days?: number }) {
    const params = new URLSearchParams();
    if (filters?.from) params.append('from', filters.from);
    if (filters?.days) params.append('days', filters.days.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/trainings${query}`);
  },

  async getById(id: string) {
    return apiCall(`/trainings/${id}`);
  },

  async create(data: any) {
    return apiCall('/trainings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiCall(`/trainings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiCall(`/trainings/${id}`, {
      method: 'DELETE',
    });
  },

  async updateRSVP(id: string, userId: string, status: 'going' | 'maybe' | 'not-going') {
    return apiCall(`/trainings/${id}/rsvp`, {
      method: 'POST',
      body: JSON.stringify({ userId, status }),
    });
  },

  async checkIn(id: string, userId: string) {
    return apiCall(`/trainings/${id}/checkin`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },
};

// TrainingType endpoints
export const trainingTypeService = {
  async getAll() {
    return apiCall('/training-types');
  },

  async getById(id: string) {
    return apiCall(`/training-types/${id}`);
  },

  async create(data: any) {
    return apiCall('/training-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiCall(`/training-types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiCall(`/training-types/${id}`, {
      method: 'DELETE',
    });
  },
};

// PointsConfig endpoints
export const pointsConfigService = {
  async get() {
    return apiCall('/points-config');
  },

  async update(data: any) {
    return apiCall('/points-config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async reset() {
    return apiCall('/points-config', {
      method: 'DELETE',
    });
  },
};

// Attendance Poll endpoints
export const attendancePollService = {
  async getAll() {
    return apiCall('/attendance-polls');
  },

  async getActive() {
    return apiCall('/attendance-polls/active');
  },

  async getById(id: string) {
    return apiCall(`/attendance-polls/${id}`);
  },

  async create(data: {
    sessionId: string;
    sessionName: string;
    sessionDate: string;
    expiresAt: string;
  }) {
    return apiCall('/attendance-polls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async vote(pollId: string, option: 'training' | 'present' | 'absent') {
    return apiCall(`/attendance-polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ option }),
    });
  },

  async getResults(pollId: string) {
    return apiCall(`/attendance-polls/${pollId}/results`);
  },

  async close(pollId: string) {
    return apiCall(`/attendance-polls/${pollId}/close`, {
      method: 'PATCH',
    });
  },

  async delete(pollId: string) {
    return apiCall(`/attendance-polls/${pollId}`, {
      method: 'DELETE',
    });
  },
};

// User Plans endpoints
export const userPlanService = {
  async getAll() {
    return apiCall('/workouts/plans');
  },

  async create(data: any) {
    return apiCall('/workouts/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiCall(`/workouts/plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiCall(`/workouts/plans/${id}`, {
      method: 'DELETE',
    });
  },
};

// Test Results endpoints
export const testResultService = {
  async getAll(testType?: string) {
    const query = testType ? `?testType=${testType}` : '';
    return apiCall(`/test-results${query}`);
  },

  async getLatest(testType: string) {
    return apiCall(`/test-results/latest/${testType}`);
  },

  async getLatestForUser(testType: string, userId: string) {
    return apiCall(`/test-results/latest/${testType}/${userId}`);
  },

  async create(data: {
    testType: string;
    dateISO: string;
    testData: any;
    score: number;
    tier: string;
  }) {
    return apiCall('/test-results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiCall(`/test-results/${id}`, {
      method: 'DELETE',
    });
  },
};

// Videos Service
export const videoService = {
  async getAll(type?: string) {
    const query = type ? `?type=${type}` : '';
    return apiCall(`/videos${query}`);
  },

  async getById(id: string) {
    return apiCall(`/videos/${id}`);
  },

  async create(data: {
    title: string;
    description?: string;
    youtubeUrl: string;
    type: 'position' | 'route' | 'coverage';
    status?: 'draft' | 'published';
    level?: 'intro' | 'intermediate' | 'advanced';
    unit?: 'Offense' | 'Defense' | 'Special Teams';
    positions?: string[];
    routes?: string[];
    coverages?: string[];
    createdBy: string;
    order?: number;
    isPinned?: boolean;
  }) {
    return apiCall('/videos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: {
    title?: string;
    description?: string;
    youtubeUrl?: string;
    type?: 'position' | 'route' | 'coverage';
    status?: 'draft' | 'published';
    level?: 'intro' | 'intermediate' | 'advanced' | null;
    unit?: 'Offense' | 'Defense' | 'Special Teams' | null;
    positions?: string[];
    routes?: string[];
    coverages?: string[];
    order?: number;
    isPinned?: boolean;
  }) {
    return apiCall(`/videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiCall(`/videos/${id}`, {
      method: 'DELETE',
    });
  },

  // Progress tracking
  async saveProgress(id: string, progress: {
    lastTimestamp: number;
    totalDuration: number;
    percentWatched: number;
    completed: boolean;
  }) {
    return apiCall(`/videos/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify(progress),
    });
  },

  async getProgress(id: string) {
    return apiCall(`/videos/${id}/progress`);
  },

  async getUserProgress(userId: string) {
    return apiCall(`/videos/progress/user/${userId}`);
  },
};

// Video Tags Service
export const videoTagsService = {
  async getAll(type?: 'position' | 'route' | 'coverage') {
    const query = type ? `?type=${type}` : '';
    return apiCall(`/video-tags${query}`);
  },

  async getById(id: string) {
    return apiCall(`/video-tags/${id}`);
  },

  async create(data: {
    type: 'position' | 'route' | 'coverage';
    name: string;
    order?: number;
    isDefault?: boolean;
  }) {
    return apiCall('/video-tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: {
    name?: string;
    order?: number;
  }) {
    return apiCall(`/video-tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiCall(`/video-tags/${id}`, {
      method: 'DELETE',
    });
  },

  async initialize() {
    return apiCall('/video-tags/initialize', {
      method: 'POST',
    });
  },
};

// ========================================
// DRILLS API
// ========================================

export const drillService = {
  async getAll(category?: string, difficulty?: string) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (difficulty) params.append('difficulty', difficulty);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/drills${query}`);
  },

  async getById(id: string) {
    return apiCall(`/drills/${id}`);
  },

  async create(data: {
    name: string;
    category: string;
    description: string;
    coachingPoints: string;
    players?: number;
    coaches?: number;
    dummies?: number;
    equipment?: Array<{ equipmentId: string; quantity: number }>;
    difficulty: string;
    trainingContext?: string;
    sketchUrl?: string;
    sketchPublicId?: string;
  }) {
    return apiCall('/drills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<{
    name: string;
    category: string;
    description: string;
    coachingPoints: string;
    players: number;
    coaches: number;
    dummies: number;
    equipment: Array<{ equipmentId: string; quantity: number }>;
    difficulty: string;
    trainingContext: string;
    sketchUrl: string;
    sketchPublicId: string;
  }>) {
    return apiCall(`/drills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiCall(`/drills/${id}`, {
      method: 'DELETE',
    });
  },

  async uploadSketch(id: string, file: File) {
    const formData = new FormData();
    formData.append('sketch', file);

    logger.debug(`Uploading sketch for drill ${id}`, { fileSize: file.size });

    const response = await fetch(`${API_URL}/drills/${id}/upload-sketch`, {
      method: 'POST',
      credentials: 'include', // Send cookie for authentication
      body: formData,
    });

    logger.apiResponse('POST', `/drills/${id}/upload-sketch`, response.status);

    if (!response.ok) {
      if (response.status === 401) {
        const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
        logger.error('401 Unauthorized on sketch upload', errorBody);
        throw new Error('Authentication failed. Please log in again.');
      }
      const error = await response.json().catch(() => ({ error: 'Failed to upload sketch' }));
      logger.error('Sketch upload failed', error);
      throw new Error(error.error || 'Failed to upload sketch');
    }

    const result = await response.json();
    logger.debug('Sketch upload successful', result);
    return result;
  },

  async uploadImage(id: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);

    logger.debug(`Uploading image for drill ${id}`, { fileSize: file.size });

    const response = await fetch(`${API_URL}/drills/${id}/upload-image`, {
      method: 'POST',
      credentials: 'include', // Send cookie for authentication
      body: formData,
    });

    logger.apiResponse('POST', `/drills/${id}/upload-image`, response.status);

    if (!response.ok) {
      if (response.status === 401) {
        const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
        logger.error('401 Unauthorized on image upload', errorBody);
        throw new Error('Authentication failed. Please log in again.');
      }
      const error = await response.json().catch(() => ({ error: 'Failed to upload image' }));
      logger.error('Image upload failed', error);
      throw new Error(error.error || 'Failed to upload image');
    }

    const result = await response.json();
    logger.debug('Image upload successful', result);
    return result;
  },
};

// ========================================
// EQUIPMENT API
// ========================================

export const equipmentService = {
  async getAll() {
    return apiCall('/equipment');
  },

  async getById(id: string) {
    return apiCall(`/equipment/${id}`);
  },

  async create(data: {
    name: string;
    quantity?: number;
    imageUrl?: string;
    imagePublicId?: string;
  }) {
    return apiCall('/equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<{
    name: string;
    quantity: number;
    imageUrl: string;
    imagePublicId: string;
  }>) {
    return apiCall(`/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiCall(`/equipment/${id}`, {
      method: 'DELETE',
    });
  },

  async uploadImage(id: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    const response = await fetch(`${API_URL}/equipment/${id}/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      const error = await response.json().catch(() => ({ error: 'Failed to upload image' }));
      throw new Error(error.error || 'Failed to upload image');
    }

    return response.json();
  },
};

// ========================================
// DRILL CATEGORIES API
// ========================================

export const drillCategoryService = {
  async getAll() {
    return apiCall('/drill-categories');
  },

  async getById(id: string) {
    return apiCall(`/drill-categories/${id}`);
  },

  async create(data: {
    name: string;
    nameDE?: string;
    color?: string;
  }) {
    return apiCall('/drill-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: {
    name?: string;
    nameDE?: string;
    color?: string;
  }) {
    return apiCall(`/drill-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiCall(`/drill-categories/${id}`, {
      method: 'DELETE',
    });
  },

  async seed() {
    return apiCall('/drill-categories/seed', {
      method: 'POST',
    });
  },
};

// ========================================
// DRILL TRAINING SESSIONS API
// ========================================

export const drillTrainingSessionService = {
  async getAll() {
    return apiCall('/drill-training-sessions');
  },

  async getById(id: string) {
    return apiCall(`/drill-training-sessions/${id}`);
  },

  async create(data: {
    name: string;
    date: string;
    drills: string[];
    notes?: string;
  }) {
    return apiCall('/drill-training-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: {
    name?: string;
    date?: string;
    drills?: string[];
    notes?: string;
  }) {
    return apiCall(`/drill-training-sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiCall(`/drill-training-sessions/${id}`, {
      method: 'DELETE',
    });
  },
};

// ========================================
// TEAM SETTINGS API
// ========================================

export const teamSettingsService = {
  async get() {
    return apiCall('/team-settings');
  },

  // Public endpoint - no auth required, used for login page branding
  async getBranding() {
    return apiCall('/team-settings/branding');
  },

  async update(data: {
    teamName?: string;
    appName?: string;
    primaryColor?: string;
    secondaryColor?: string;
    seasonPhase?: string;
    teamLevel?: string;
    aiApiKey?: string;
  }) {
    return apiCall('/team-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async uploadLogo(file: File) {
    const formData = new FormData();
    formData.append('logo', file);

    return apiCall('/team-settings/logo', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  },

  async uploadFavicon(file: File) {
    const formData = new FormData();
    formData.append('favicon', file);

    return apiCall('/team-settings/favicon', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  },
};

// ========================================
// NOTIFICATIONS API
// ========================================

export const notificationService = {
  /**
   * Get user's notifications (automatically filtered by userId from JWT)
   * @param unreadOnly - If true, only return unread notifications
   */
  async getAll(unreadOnly = false) {
    const query = unreadOnly ? '?unreadOnly=true' : '';
    return apiCall(`/notifications${query}`);
  },

  /**
   * Get count of unread notifications
   */
  async getUnreadCount() {
    return apiCall('/notifications/unread-count');
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string) {
    return apiCall(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    return apiCall('/notifications/mark-all-read', {
      method: 'PATCH',
    });
  },

  /**
   * Delete a notification
   */
  async delete(notificationId: string) {
    return apiCall(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Leaderboard Service
 * Backend-first: All leaderboard data is stored and fetched from backend
 */
export const leaderboardService = {
  /**
   * Get current month leaderboard
   */
  async getCurrentWeek(category?: string) {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return apiCall(`/leaderboard${params}`);
  },

  /**
   * Get leaderboard for a specific month (YYYY-MM format)
   */
  async getMonth(month: string, category?: string) {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return apiCall(`/leaderboard/month/${month}${params}`);
  },
};

/**
 * Exercise Category Service
 * Backend-first: All exercise categories are stored and managed in backend
 */
export const exerciseCategoryService = {
  /**
   * Get all exercise categories
   */
  async getAll() {
    return apiCall('/exercise-categories');
  },

  /**
   * Get only active exercise categories
   */
  async getActive() {
    return apiCall('/exercise-categories/active');
  },

  /**
   * Initialize default exercise categories (coach only)
   */
  async initialize() {
    return apiCall('/exercise-categories/init', {
      method: 'POST',
    });
  },

  /**
   * Create a new exercise category (coach only)
   */
  async create(data: {
    key: string;
    nameEN: string;
    nameDE: string;
    color?: string;
    icon?: string;
    active?: boolean;
  }) {
    return apiCall('/exercise-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an exercise category (coach only)
   */
  async update(id: string, data: {
    key?: string;
    nameEN?: string;
    nameDE?: string;
    color?: string;
    icon?: string;
    active?: boolean;
  }) {
    return apiCall(`/exercise-categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete an exercise category (coach only)
   */
  async delete(id: string) {
    return apiCall(`/exercise-categories/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Reports Service
 * Backend-first: All reports are generated by backend from real data
 */
export const reportsService = {
  /**
   * Get weekly overview - simple view of who trained each day
   * @param startDate - Week start date in YYYY-MM-DD format (optional, defaults to current week)
   */
  async getWeeklyOverview(startDate?: string) {
    const endpoint = startDate ? `/reports/weekly-overview/${startDate}` : '/reports/weekly-overview';
    return apiCall(endpoint);
  },
};
