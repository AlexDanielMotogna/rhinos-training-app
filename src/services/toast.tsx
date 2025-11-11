import { toast, ToastOptions } from 'react-toastify';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SaveIcon from '@mui/icons-material/Save';
import ErrorIcon from '@mui/icons-material/Error';
import LockIcon from '@mui/icons-material/Lock';
import WarningIcon from '@mui/icons-material/Warning';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import SyncIcon from '@mui/icons-material/Sync';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WifiIcon from '@mui/icons-material/Wifi';
import UploadIcon from '@mui/icons-material/Upload';
import CelebrationIcon from '@mui/icons-material/Celebration';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

/**
 * Centralized toast notification service with Material-UI icons
 * Provides consistent styling and behavior across the app
 */

const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const toastService = {
  // Success notifications
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      ...defaultOptions,
      icon: <CheckCircleIcon />,
      ...options
    });
  },

  // Error notifications
  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      ...defaultOptions,
      autoClose: 5000,
      icon: <ErrorIcon />,
      ...options
    });
  },

  // Info notifications
  info: (message: string, options?: ToastOptions) => {
    toast.info(message, { ...defaultOptions, ...options });
  },

  // Warning notifications
  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, {
      ...defaultOptions,
      icon: <WarningIcon />,
      ...options
    });
  },

  // CRUD Operations - Success
  created: (itemName: string) => {
    toast.success(`${itemName} created successfully!`, {
      ...defaultOptions,
      icon: <CheckCircleIcon />
    });
  },

  updated: (itemName: string) => {
    toast.success(`${itemName} updated successfully!`, {
      ...defaultOptions,
      icon: <CheckCircleIcon />
    });
  },

  deleted: (itemName: string) => {
    toast.success(`${itemName} deleted successfully!`, {
      ...defaultOptions,
      icon: <DeleteIcon />
    });
  },

  duplicated: (itemName: string) => {
    toast.success(`${itemName} duplicated successfully!`, {
      ...defaultOptions,
      icon: <ContentCopyIcon />
    });
  },

  saved: (itemName: string) => {
    toast.success(`${itemName} saved successfully!`, {
      ...defaultOptions,
      icon: <SaveIcon />
    });
  },

  // CRUD Operations - Errors
  createError: (itemName: string, error?: string) => {
    const message = error || `Failed to create ${itemName}`;
    toast.error(message, {
      ...defaultOptions,
      autoClose: 5000,
      icon: <ErrorIcon />
    });
  },

  updateError: (itemName: string, error?: string) => {
    const message = error || `Failed to update ${itemName}`;
    toast.error(message, {
      ...defaultOptions,
      autoClose: 5000,
      icon: <ErrorIcon />
    });
  },

  deleteError: (itemName: string, error?: string) => {
    const message = error || `Failed to delete ${itemName}`;
    toast.error(message, {
      ...defaultOptions,
      autoClose: 5000,
      icon: <ErrorIcon />
    });
  },

  loadError: (itemName: string, error?: string) => {
    const message = error || `Failed to load ${itemName}`;
    toast.error(message, {
      ...defaultOptions,
      autoClose: 5000,
      icon: <ErrorIcon />
    });
  },

  // Auth notifications
  loginSuccess: (userName?: string) => {
    const message = userName ? `Welcome back, ${userName}!` : 'Login successful!';
    toast.success(message, {
      ...defaultOptions,
      icon: <WavingHandIcon />
    });
  },

  logoutSuccess: () => {
    toast.info('Logged out successfully', {
      ...defaultOptions,
      icon: <WavingHandIcon />
    });
  },

  authError: (message: string) => {
    toast.error(message, {
      ...defaultOptions,
      autoClose: 5000,
      icon: <LockIcon />
    });
  },

  // Form validations
  validationError: (message: string) => {
    toast.warning(message, {
      ...defaultOptions,
      autoClose: 4000,
      icon: <WarningIcon />
    });
  },

  // Network operations
  syncSuccess: () => {
    toast.success('Synced successfully!', {
      ...defaultOptions,
      icon: <SyncIcon />
    });
  },

  syncError: () => {
    toast.error('Sync failed. Please try again.', {
      ...defaultOptions,
      autoClose: 5000,
      icon: <ErrorIcon />
    });
  },

  offline: () => {
    toast.warning('You are offline. Changes will sync when online.', {
      ...defaultOptions,
      autoClose: 4000,
      icon: <WifiOffIcon />
    });
  },

  online: () => {
    toast.success('You are back online!', {
      ...defaultOptions,
      autoClose: 2000,
      icon: <WifiIcon />
    });
  },

  // Upload operations
  uploadSuccess: (itemName: string) => {
    toast.success(`${itemName} uploaded successfully!`, {
      ...defaultOptions,
      icon: <UploadIcon />
    });
  },

  uploadError: (itemName: string) => {
    toast.error(`Failed to upload ${itemName}`, {
      ...defaultOptions,
      autoClose: 5000,
      icon: <ErrorIcon />
    });
  },

  // Assignment operations
  assigned: (itemName: string, targetName: string) => {
    toast.success(`${itemName} assigned to ${targetName}`, {
      ...defaultOptions,
      icon: <CheckCircleIcon />
    });
  },

  unassigned: (itemName: string) => {
    toast.success(`${itemName} unassigned`, {
      ...defaultOptions,
      icon: <CheckCircleIcon />
    });
  },

  // Workout operations
  workoutCompleted: () => {
    toast.success('Workout completed! Great job!', {
      ...defaultOptions,
      icon: <CelebrationIcon />
    });
  },

  workoutStarted: (workoutName: string) => {
    toast.info(`Starting: ${workoutName}`, {
      ...defaultOptions,
      autoClose: 2000,
      icon: <FitnessCenterIcon />
    });
  },

  // Session operations
  checkInSuccess: () => {
    toast.success('Checked in successfully!', {
      ...defaultOptions,
      icon: <CheckCircleIcon />
    });
  },

  checkInError: () => {
    toast.error('Check-in failed. Please try again.', {
      ...defaultOptions,
      autoClose: 5000,
      icon: <ErrorIcon />
    });
  },

  // Copy operations
  copied: (itemName?: string) => {
    const message = itemName ? `${itemName} copied to clipboard` : 'Copied to clipboard';
    toast.success(message, {
      ...defaultOptions,
      autoClose: 2000,
      icon: <ContentCopyIcon />
    });
  },

  // Permission errors
  permissionDenied: () => {
    toast.error('You do not have permission to perform this action', {
      ...defaultOptions,
      autoClose: 4000,
      icon: <LockIcon />
    });
  },

  // Generic loading
  loading: (message: string) => {
    return toast.loading(message, defaultOptions);
  },

  // Update existing toast (useful for loading states)
  update: (toastId: any, type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const iconMap = {
      success: <CheckCircleIcon />,
      error: <ErrorIcon />,
      info: undefined,
      warning: <WarningIcon />,
    };

    toast.update(toastId, {
      render: message,
      type,
      isLoading: false,
      autoClose: 3000,
      icon: iconMap[type],
    });
  },

  // Dismiss toast
  dismiss: (toastId?: any) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  // Promise-based toast (for async operations)
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      pending: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages, defaultOptions);
  },
};
