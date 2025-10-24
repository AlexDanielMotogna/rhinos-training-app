export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  width?: number;
  height?: number;
  size?: number;
}

export interface ImageOptimizationOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number; // 0-1
  maxSizeKB: number;
  format: 'jpeg' | 'png';
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 1600,
  maxHeight: 1200,
  quality: 0.85,
  maxSizeKB: 2048, // 2MB
  format: 'jpeg',
};

/**
 * Validates an image file before processing
 */
export const validateImage = (file: File): ImageValidationResult => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG or PNG image.',
    };
  }

  // Check file size (5MB max for original)
  const maxOriginalSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxOriginalSize) {
    return {
      valid: false,
      error: 'File is too large. Maximum size is 5MB.',
    };
  }

  return {
    valid: true,
    size: file.size,
  };
};

/**
 * Optimizes and resizes an image file to base64
 * Maintains aspect ratio and converts to optimal format
 */
export const optimizeImage = async (
  file: File,
  options: Partial<ImageOptimizationOptions> = {}
): Promise<string> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    // Validate first
    const validation = validateImage(file);
    if (!validation.valid) {
      reject(new Error(validation.error));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.onload = () => {
        try {
          // Check minimum dimensions
          if (img.width < 400 || img.height < 300) {
            reject(new Error('Image is too small. Minimum size is 400x300 pixels.'));
            return;
          }

          // Calculate new dimensions maintaining aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > opts.maxWidth || height > opts.maxHeight) {
            const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Use better quality scaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with specified format and quality
          const mimeType = opts.format === 'jpeg' ? 'image/jpeg' : 'image/png';
          const base64 = canvas.toDataURL(mimeType, opts.quality);

          // Check if result is too large
          const resultSizeKB = (base64.length * 3) / 4 / 1024; // Approximate size in KB
          if (resultSizeKB > opts.maxSizeKB) {
            console.warn(`Optimized image size (${resultSizeKB.toFixed(0)}KB) exceeds target (${opts.maxSizeKB}KB)`);
          }

          resolve(base64);
        } catch (error) {
          reject(new Error('Failed to process image: ' + (error as Error).message));
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Gets image dimensions from a base64 string
 */
export const getImageDimensions = (base64: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = base64;
  });
};

/**
 * Optimizes image specifically for drill sketches
 * Uses settings optimized for field diagrams
 */
export const optimizeDrillSketch = async (file: File): Promise<string> => {
  return optimizeImage(file, {
    maxWidth: 1600,
    maxHeight: 1200,
    quality: 0.88, // Slightly higher quality for diagrams
    format: 'jpeg',
  });
};

/**
 * Optimizes image for equipment photos
 * Uses settings optimized for product images
 */
export const optimizeEquipmentImage = async (file: File): Promise<string> => {
  return optimizeImage(file, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.85,
    format: 'jpeg',
  });
};
