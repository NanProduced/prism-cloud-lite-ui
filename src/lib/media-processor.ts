
/**
 * Calculate the best fit dimensions for a source image to fit within a bounding box
 */
function calculateFitSize(srcW: number, srcH: number, maxW: number, maxH: number) {
  let width = srcW;
  let height = srcH;

  const ratio = width / height;

  if (width > maxW) {
    width = maxW;
    height = width / ratio;
  }

  if (height > maxH) {
    height = maxH;
    width = height * ratio;
  }

  return { 
    width: Math.max(1, Math.round(width)), 
    height: Math.max(1, Math.round(height)) 
  };
}

/**
 * Generate a JPEG cover (screenshot/thumbnail) for an image file
 */
async function generateImageCover(
  file: File, 
  maxWidth: number, 
  maxHeight: number, 
  quality: number
): Promise<Blob> {
  // Use createImageBitmap for efficient decoding if available
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = calculateFitSize(bitmap.width, bitmap.height, maxWidth, maxHeight);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    ctx.drawImage(bitmap, 0, 0, width, height);
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to generate image blob'));
        },
        'image/jpeg',
        quality
      );
    });
  } finally {
    bitmap.close();
  }
}

/**
 * Generate a JPEG cover (screenshot/thumbnail) for a video file
 */
async function generateVideoCover(
  file: File, 
  maxWidth: number, 
  maxHeight: number, 
  quality: number
): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    
    // Wait for metadata to get dimensions
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = () => reject(new Error('Failed to load video metadata'));
    });

    // Seek to 1 second or 10% of duration, whichever is smaller, to avoid black frames at start
    video.currentTime = Math.min(1, video.duration * 0.1);

    await new Promise((resolve) => {
      video.onseeked = resolve;
    });

    const { width, height } = calculateFitSize(video.videoWidth, video.videoHeight, maxWidth, maxHeight);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    ctx.drawImage(video, 0, 0, width, height);
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to generate video blob'));
        },
        'image/jpeg',
        quality
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * High-level utility to generate a cover for image or video files
 */
export async function generateMediaCover(
  file: File,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<Blob | null> {
  const { maxWidth = 1280, maxHeight = 720, quality = 0.8 } = options;

  try {
    if (file.type.startsWith('image/')) {
      return await generateImageCover(file, maxWidth, maxHeight, quality);
    } else if (file.type.startsWith('video/')) {
      return await generateVideoCover(file, maxWidth, maxHeight, quality);
    }
  } catch (err) {
    console.error('Failed to generate media cover:', err);
  }
  
  return null;
}
