const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { PubSub } = require('@google-cloud/pubsub');
const { Storage } = require('@google-cloud/storage');
const { Logging } = require('@google-cloud/logging');

class GoogleCloudService {
  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;
    this.secretClient = new SecretManagerServiceClient();
    this.pubsub = new PubSub({ projectId: this.projectId });
    this.storage = new Storage({ projectId: this.projectId });
    this.logging = new Logging({ projectId: this.projectId });
    
    // Initialize logger
    this.logger = this.logging.log('ai-rookie-backend');
  }

  // Secret Manager
  async getSecret(secretName) {
    try {
      const name = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await this.secretClient.accessSecretVersion({ name });
      return version.payload.data.toString();
    } catch (error) {
      console.warn(`Failed to get secret ${secretName}:`, error.message);
      return process.env[secretName]; // Fallback to environment variable
    }
  }

  async setSecret(secretName, secretValue) {
    try {
      const parent = `projects/${this.projectId}`;
      
      // Create secret if it doesn't exist
      try {
        await this.secretClient.createSecret({
          parent,
          secretId: secretName,
          secret: {
            replication: {
              automatic: {},
            },
          },
        });
      } catch (error) {
        // Secret might already exist
      }

      // Add secret version
      const secretPath = `projects/${this.projectId}/secrets/${secretName}`;
      await this.secretClient.addSecretVersion({
        parent: secretPath,
        payload: {
          data: Buffer.from(secretValue),
        },
      });

      return true;
    } catch (error) {
      console.error(`Failed to set secret ${secretName}:`, error);
      return false;
    }
  }

  // Cloud Storage
  getBucket(bucketName = 'ai-rookie-uploads') {
    return this.storage.bucket(`${bucketName}-${this.projectId}`);
  }

  async uploadFile(file, destination, bucketName) {
    const bucket = this.getBucket(bucketName);
    const blob = bucket.file(destination);
    
    const stream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', () => {
        resolve(`gs://${bucket.name}/${destination}`);
      });
      stream.end(file.buffer);
    });
  }

  // Pub/Sub for async processing
  async publishMessage(topicName, data) {
    try {
      const topic = this.pubsub.topic(topicName);
      const messageId = await topic.publish(Buffer.from(JSON.stringify(data)));
      console.log(`Message ${messageId} published to ${topicName}`);
      return messageId;
    } catch (error) {
      console.error('Error publishing message:', error);
      throw error;
    }
  }

  // Cloud Logging
  async log(level, message, metadata = {}) {
    const entry = this.logger.entry({
      severity: level.toUpperCase(),
      resource: {
        type: 'cloud_run_revision',
        labels: {
          service_name: 'ai-rookie-backend',
          revision_name: process.env.K_REVISION || 'local',
        },
      },
    }, {
      message,
      ...metadata,
      timestamp: new Date().toISOString(),
      trace: metadata.traceId || null,
    });

    try {
      await this.logger.write(entry);
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  // Health check for Google Cloud services
  async healthCheck() {
    const health = {
      secretManager: false,
      storage: false,
      pubsub: false,
      logging: false,
    };

    try {
      // Test Secret Manager
      await this.getSecret('JWT_SECRET');
      health.secretManager = true;
    } catch (error) {
      console.warn('Secret Manager health check failed:', error.message);
    }

    try {
      // Test Storage
      const bucket = this.getBucket();
      await bucket.exists();
      health.storage = true;
    } catch (error) {
      console.warn('Storage health check failed:', error.message);
    }

    try {
      // Test Pub/Sub
      const topics = await this.pubsub.getTopics();
      health.pubsub = true;
    } catch (error) {
      console.warn('Pub/Sub health check failed:', error.message);
    }

    try {
      // Test Logging
      await this.log('info', 'Health check', { component: 'health-check' });
      health.logging = true;
    } catch (error) {
      console.warn('Logging health check failed:', error.message);
    }

    return health;
  }
}

// Singleton instance
const gcloudService = new GoogleCloudService();

module.exports = {
  GoogleCloudService,
  gcloudService,
};