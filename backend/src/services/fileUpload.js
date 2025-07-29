const multer = require('multer');
const { gcloudService } = require('../config/gcloud');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class FileUploadService {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
  }

  // Configure multer for memory storage
  getMulterConfig() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: this.maxFileSize,
        files: 5, // Max 5 files per request
      },
      fileFilter: (req, file, cb) => {
        if (this.allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type ${file.mimetype} not allowed`), false);
        }
      },
    });
  }

  // Upload single file to Cloud Storage
  async uploadSingle(file, folder = 'general', userId = null) {
    try {
      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const filename = `${uuidv4()}${fileExtension}`;
      const destination = `${folder}/${filename}`;

      // Upload to Cloud Storage
      const gsPath = await gcloudService.uploadFile(file, destination, 'ai-rookie-uploads');

      // Log upload
      await gcloudService.log('info', 'File uploaded successfully', {
        component: 'file-upload',
        filename: file.originalname,
        destination,
        size: file.size,
        mimetype: file.mimetype,
        userId,
      });

      return {
        success: true,
        data: {
          filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          gsPath,
          publicUrl: this.getPublicUrl(destination),
          folder,
        },
      };
    } catch (error) {
      await gcloudService.log('error', 'File upload failed', {
        component: 'file-upload',
        error: error.message,
        filename: file.originalname,
        userId,
      });

      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  // Upload multiple files
  async uploadMultiple(files, folder = 'general', userId = null) {
    const uploadPromises = files.map(file => 
      this.uploadSingle(file, folder, userId)
    );

    try {
      const results = await Promise.all(uploadPromises);
      return {
        success: true,
        data: results.map(result => result.data),
      };
    } catch (error) {
      // If any upload fails, we might want to clean up successful uploads
      await gcloudService.log('error', 'Multiple file upload failed', {
        component: 'file-upload',
        error: error.message,
        fileCount: files.length,
        userId,
      });

      throw error;
    }
  }

  // Delete file from Cloud Storage
  async deleteFile(gsPath) {
    try {
      // Extract bucket and filename from gsPath
      const pathParts = gsPath.replace('gs://', '').split('/');
      const bucketName = pathParts[0];
      const filename = pathParts.slice(1).join('/');

      const bucket = gcloudService.getBucket(bucketName.replace(`-${gcloudService.projectId}`, ''));
      await bucket.file(filename).delete();

      await gcloudService.log('info', 'File deleted successfully', {
        component: 'file-upload',
        gsPath,
      });

      return true;
    } catch (error) {
      await gcloudService.log('error', 'File deletion failed', {
        component: 'file-upload',
        error: error.message,
        gsPath,
      });

      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  // Get public URL for file
  getPublicUrl(destination, bucketName = 'ai-rookie-uploads') {
    const fullBucketName = `${bucketName}-${gcloudService.projectId}`;
    return `https://storage.googleapis.com/${fullBucketName}/${destination}`;
  }

  // Get signed URL for private files (valid for 1 hour)
  async getSignedUrl(destination, bucketName = 'ai-rookie-uploads', expiresIn = 3600) {
    try {
      const bucket = gcloudService.getBucket(bucketName);
      const file = bucket.file(destination);

      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
      });

      return signedUrl;
    } catch (error) {
      await gcloudService.log('error', 'Failed to generate signed URL', {
        component: 'file-upload',
        error: error.message,
        destination,
      });

      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  // Validate file before upload
  validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return errors;
    }

    if (file.size > this.maxFileSize) {
      errors.push(`File size ${file.size} exceeds maximum ${this.maxFileSize} bytes`);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} not allowed`);
    }

    return errors;
  }

  // Image processing (requires Sharp library)
  async processImage(file, options = {}) {
    const sharp = require('sharp');
    
    const {
      width = 800,
      height = 600,
      quality = 80,
      format = 'jpeg',
    } = options;

    try {
      const processedBuffer = await sharp(file.buffer)
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality })
        .toBuffer();

      // Create new file object with processed image
      const processedFile = {
        ...file,
        buffer: processedBuffer,
        mimetype: `image/${format}`,
        size: processedBuffer.length,
        originalname: file.originalname.replace(/\.[^/.]+$/, `.${format}`),
      };

      return processedFile;
    } catch (error) {
      await gcloudService.log('error', 'Image processing failed', {
        component: 'file-upload',
        error: error.message,
        filename: file.originalname,
      });

      throw new Error(`Image processing failed: ${error.message}`);
    }
  }
}

// Singleton instance
const fileUploadService = new FileUploadService();

module.exports = {
  FileUploadService,
  fileUploadService,
};