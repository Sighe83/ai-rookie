#!/usr/bin/env node

const { gcloudService } = require('../src/config/gcloud');

async function setupStorage() {
  console.log('🗄️  Setting up Google Cloud Storage...\n');

  const buckets = [
    {
      name: 'ai-rookie-uploads',
      description: 'User file uploads (images, documents)',
      public: true,
    },
    {
      name: 'ai-rookie-backups',
      description: 'Database backups and exports',
      public: false,
    },
    {
      name: 'ai-rookie-temp',
      description: 'Temporary files and processing',
      public: false,
      lifecycle: 1, // Delete after 1 day
    },
  ];

  try {
    for (const bucketConfig of buckets) {
      const bucketName = `${bucketConfig.name}-${gcloudService.projectId}`;
      console.log(`Creating bucket: ${bucketName}...`);

      try {
        const bucket = gcloudService.storage.bucket(bucketName);
        
        // Check if bucket exists
        const [exists] = await bucket.exists();
        
        if (!exists) {
          // Create bucket
          await gcloudService.storage.createBucket(bucketName, {
            location: 'EUROPE-NORTH1',
            storageClass: 'STANDARD',
            versioning: {
              enabled: false,
            },
          });
          
          console.log(`✅ Created bucket: ${bucketName}`);
        } else {
          console.log(`✅ Bucket already exists: ${bucketName}`);
        }

        // Set up CORS for uploads bucket
        if (bucketConfig.name === 'ai-rookie-uploads') {
          await bucket.setCorsConfiguration([
            {
              origin: ['*'],
              method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
              responseHeader: ['Content-Type', 'x-goog-resumable'],
            },
          ]);
          console.log(`✅ CORS configured for ${bucketName}`);
        }

        // Make bucket public if specified
        if (bucketConfig.public) {
          await bucket.makePublic();
          console.log(`✅ Made bucket public: ${bucketName}`);
        }

        // Set lifecycle rules
        if (bucketConfig.lifecycle) {
          await bucket.setLifecycleConfiguration({
            rule: [
              {
                action: { type: 'Delete' },
                condition: { age: bucketConfig.lifecycle },
              },
            ],
          });
          console.log(`✅ Lifecycle rules set for ${bucketName} (${bucketConfig.lifecycle} days)`);
        }

      } catch (error) {
        console.error(`❌ Error with bucket ${bucketName}:`, error.message);
      }
    }

    // Create Pub/Sub topics
    console.log('\n📡 Setting up Pub/Sub topics...');
    
    const topics = [
      'user-registrations',
      'booking-confirmations',
      'file-uploads',
      'email-notifications',
    ];

    for (const topicName of topics) {
      try {
        const topic = gcloudService.pubsub.topic(topicName);
        const [exists] = await topic.exists();
        
        if (!exists) {
          await gcloudService.pubsub.createTopic(topicName);
          console.log(`✅ Created topic: ${topicName}`);
        } else {
          console.log(`✅ Topic already exists: ${topicName}`);
        }
      } catch (error) {
        console.error(`❌ Error with topic ${topicName}:`, error.message);
      }
    }

    console.log('\n🎉 Storage setup completed!');
    console.log('\nBuckets created:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name}-${gcloudService.projectId} (${bucket.description})`);
    });
    
    console.log('\nPub/Sub topics created:');
    topics.forEach(topic => {
      console.log(`  - ${topic}`);
    });

  } catch (error) {
    console.error('❌ Error setting up storage:', error.message);
  }
}

// Check if running directly
if (require.main === module) {
  setupStorage();
}

module.exports = { setupStorage };