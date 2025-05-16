// Dynamically import imageCompression to reduce initial bundle size

// Define types locally to avoid importing them directly
export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  maxIteration?: number;
  exifOrientation?: number;
  onProgress?: (progress: number) => void;
  preserveExif?: boolean;
}

// Helper function for development-only logging
const logDev = (message: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Image Compression] ${message}`);
  }
};

/**
 * Compresses an image file using browser-image-compression
 * @param imageFile - The original image file to compress
 * @param options - Compression options
 * @returns Promise with the compressed file
 */
export async function compressImage(
  imageFile: File,
  customOptions?: CompressionOptions
): Promise<File> {
  try {
    // Skip compression for small images
    if (imageFile.size / 1024 / 1024 < 0.3) {
      logDev('Image is already small, skipping compression');
      return imageFile;
    }

    // Skip compression for non-image files
    if (!imageFile.type.startsWith('image/')) {
      logDev('Not an image file, skipping compression');
      return imageFile;
    }

    // Default compression options
    const defaultOptions = {
      maxSizeMB: 1, // Default max file size is 1MB
      maxWidthOrHeight: 1920, // Limit to 1920px width/height
      useWebWorker: true, // Use web workers for better performance
      preserveExif: true, // Keep metadata like orientation
    };

    // Merge custom options with defaults
    const options = { ...defaultOptions, ...customOptions };

    // Compress the image file
    const originalSize = (imageFile.size / 1024 / 1024).toFixed(2);
    logDev(`Original image size: ${originalSize} MB`);
    
    // Dynamically import the compression library
    const imageCompression = (await import('browser-image-compression')).default;
    const compressedFile = await imageCompression(imageFile, options);
    
    const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
    logDev(`Compressed image size: ${compressedSize} MB (${
      Math.round((1 - compressedFile.size / imageFile.size) * 100)
    }% reduction)`);
    
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    return imageFile; // Return original file if compression fails
  }
}

/**
 * Processes multiple files, compressing images while leaving other files unchanged
 * @param files - Array of files to process
 * @param options - Compression options
 * @returns Promise with processed files
 */
export async function processFiles(
  files: File[], 
  options?: CompressionOptions
): Promise<File[]> {
  const processedFiles = await Promise.all(
    files.map(async (file) => {
      // Only compress image files
      if (file.type.startsWith('image/')) {
        return compressImage(file, options);
      }
      // Return other files unchanged
      return file;
    })
  );
  
  return processedFiles;
} 