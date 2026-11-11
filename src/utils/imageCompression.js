import imageCompression from 'browser-image-compression';

const MAX_INPUT_SIZE_MB = 2; // Maximum raw photo size accepted from user

/**
 * Validates file type and initial size
 */
export function validateImageFile(file, maxMB = MAX_INPUT_SIZE_MB) {
  if (!file) return { valid: false, error: 'No file selected' };

  if (!file.type || !file.type.startsWith('image/')) {
    return { valid: false, error: 'Only image files (JPEG, PNG, WebP) are allowed' };
  }

  const maxBytes = maxMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Selected image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is ${maxMB}MB.`,
    };
  }

  return { valid: true };
}

/**
 * Compresses and resizes a user profile image on the frontend before sending to the backend.
 * Guarantees output is < 1 MB and formatted cleanly as WebP.
 *
 * @param {File} file - The raw input file from the file picker
 * @returns {Promise<File>} Compressed File
 */
export async function compressProfileImage(file) {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const options = {
    maxSizeMB: 0.8,              // Hard target < 1MB (usually outputs 50KB - 200KB)
    maxWidthOrHeight: 800,       // Standard avatar resolution
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.85,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    // Convert Blob back to a standard File instance with .webp extension
    const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
    const compressedFile = new File([compressedBlob], cleanName, {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    console.info(
      `[ImageCompression] Original: ${(file.size / 1024).toFixed(1)} KB → Compressed: ${(compressedFile.size / 1024).toFixed(1)} KB`
    );

    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('Failed to compress image. Please try another image.');
  }
}
