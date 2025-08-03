// Image compression utility for profile pictures
// Compresses images to optimal size for profile display (max 300x300px, ~100kb)

export const compressImage = (file, maxWidth = 300, maxHeight = 300, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    // Validate input
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid file type'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate optimal dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        // Only resize if image is larger than target
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = maxWidth;
            height = maxWidth / aspectRatio;
          } else {
            height = maxHeight;
            width = maxHeight * aspectRatio;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new file with compressed data
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              
              console.log('Image compression result:', {
                originalSize: file.size,
                compressedSize: compressedFile.size,
                originalDimensions: `${img.width}x${img.height}`,
                newDimensions: `${width}x${height}`,
                compressionRatio: ((file.size - compressedFile.size) / file.size * 100).toFixed(1) + '%'
              });
              
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      } catch (error) {
        reject(new Error('Failed to process image: ' + error.message));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};

// Validate and compress image for profile upload
export const processProfileImage = async (file) => {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Vælg venligst en billedfil');
  }

  // Validate file size (before compression - max 10MB for input)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Billedet må ikke være større end 10MB');
  }

  try {
    // Compress image to optimal size for profile display
    const compressedFile = await compressImage(file, 300, 300, 0.85);
    
    // Final validation - ensure compressed image is under 500KB
    if (compressedFile.size > 500 * 1024) {
      // Try with higher compression if still too large
      const recompressedFile = await compressImage(file, 250, 250, 0.7);
      return recompressedFile;
    }
    
    return compressedFile;
  } catch (error) {
    throw new Error('Kunne ikke behandle billedet: ' + error.message);
  }
};