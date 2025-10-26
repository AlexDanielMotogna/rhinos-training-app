import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'rhinos-training';

// Multer storage (in-memory for cloud upload)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!') as any, false);
    }
    cb(null, true);
  },
});

export interface UploadImageOptions {
  folder?: string;
  transformation?: any;
  publicId?: string;
}

/**
 * Upload image to Cloudinary
 * @param buffer - Image buffer from multer
 * @param options - Upload options
 * @returns Cloudinary upload result with secure_url
 */
export async function uploadImage(
  buffer: Buffer,
  options: UploadImageOptions = {}
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || CLOUDINARY_FOLDER,
        transformation: options.transformation || [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
        public_id: options.publicId,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(new Error('Failed to upload image'));
        }
        if (!result) {
          return reject(new Error('No result from Cloudinary'));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload avatar/profile picture (optimized for avatars)
 */
export async function uploadAvatar(buffer: Buffer, userId: string) {
  return uploadImage(buffer, {
    folder: `${CLOUDINARY_FOLDER}/avatars`,
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
    publicId: `avatar-${userId}`,
  });
}

/**
 * Upload team logo
 */
export async function uploadTeamLogo(buffer: Buffer) {
  return uploadImage(buffer, {
    folder: `${CLOUDINARY_FOLDER}/logos`,
    transformation: [
      { width: 500, height: 500, crop: 'fit' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  });
}

/**
 * Delete image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`[CLOUDINARY] Deleted image: ${publicId}`);
  } catch (error) {
    console.error('[CLOUDINARY ERROR] Failed to delete image:', error);
    throw new Error('Failed to delete image');
  }
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  publicId: string,
  width?: number,
  height?: number
): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop: 'fill' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  });
}

export default cloudinary;
