// Load environment variables first
require('dotenv').config();

const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Initialize Supabase client with error handling
let supabase;
try {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error.message);
  supabase = null;
}

class FileUploadService {
  constructor() {
    this.supabase = supabase;
    this.bucketName = 'ai-rookie-uploads';
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
    
    if (!this.supabase) {
      console.warn('⚠️ Supabase client not available, file uploads will fail');
    }
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

  // Validate file type and size
  validateFile(file, maxSize = this.maxFileSize) {
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} not allowed`);
    }

    if (file.size > maxSize) {
      throw new Error(`File size ${file.size} exceeds maximum ${maxSize} bytes`);
    }

    return true;
  }

  // Upload single file to Supabase Storage
  async uploadSingle(file, folder = 'general', userId = null) {
    try {
      this.validateFile(file);
      
      const fileExt = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
          }
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      return {
        success: true,
        path: data.path,
        fullPath: data.fullPath,
        fileName: fileName,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${this.bucketName}/${data.path}`
      };

    } catch (error) {
      throw error;
    }
  }

  // Upload multiple files
  async uploadMultiple(files, folder = 'general', userId = null) {
    const results = await Promise.all(
      files.map(file => this.uploadSingle(file, folder, userId))
    );
    
    return results;
  }

  // Delete file from Supabase Storage
  async deleteFile(filePath) {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      return { success: true };

    } catch (error) {
      throw error;
    }
  }

  // Get list of files in bucket
  async listFiles(folder = null, limit = 100, offset = 0) {
    try {
      const options = { limit, offset };
      if (folder) {
        options.prefix = folder;
      }

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('', options);

      if (error) {
        throw new Error(`List failed: ${error.message}`);
      }

      return data;

    } catch (error) {
      throw error;
    }
  }

  // Get signed URL for private file access
  async getSignedUrl(filePath, expiresIn = 3600) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw new Error(`Signed URL failed: ${error.message}`);
      }

      return data.signedUrl;

    } catch (error) {
      throw error;
    }
  }

  // Middleware for handling file uploads
  uploadMiddleware(fieldName = 'file', multiple = false) {
    const upload = this.getMulterConfig();
    
    if (multiple) {
      return upload.array(fieldName, 5);
    } else {
      return upload.single(fieldName);
    }
  }
}

// Export singleton instance
const fileUploadService = new FileUploadService();
module.exports = { fileUploadService };
