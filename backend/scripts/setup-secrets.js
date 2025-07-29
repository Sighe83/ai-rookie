#!/usr/bin/env node

const { gcloudService } = require('../src/config/gcloud');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function setupSecrets() {
  console.log('🔐 Setting up Google Cloud Secret Manager...\n');

  const secrets = [
    {
      name: 'DATABASE_URL',
      description: 'Database connection string',
      required: true,
    },
    {
      name: 'JWT_SECRET',
      description: 'JWT secret key (leave empty to generate)',
      required: false,
    },
    {
      name: 'STRIPE_SECRET_KEY',
      description: 'Stripe secret key',
      required: false,
    },
    {
      name: 'SMTP_PASSWORD',
      description: 'SMTP password for email',
      required: false,
    },
  ];

  try {
    for (const secret of secrets) {
      let value = '';
      
      if (secret.name === 'JWT_SECRET') {
        const generateJWT = await question(`Generate random JWT secret for ${secret.name}? (y/n): `);
        if (generateJWT.toLowerCase() === 'y') {
          value = require('crypto').randomBytes(64).toString('hex');
          console.log(`Generated JWT secret: ${value.substring(0, 20)}...`);
        } else {
          value = await question(`Enter value for ${secret.name} (${secret.description}): `);
        }
      } else {
        value = await question(`Enter value for ${secret.name} (${secret.description}): `);
      }

      if (secret.required && !value) {
        console.log(`❌ ${secret.name} is required, skipping...`);
        continue;
      }

      if (value) {
        console.log(`Setting secret ${secret.name}...`);
        const success = await gcloudService.setSecret(secret.name, value);
        if (success) {
          console.log(`✅ ${secret.name} set successfully`);
        } else {
          console.log(`❌ Failed to set ${secret.name}`);
        }
      }
    }

    console.log('\n🎉 Secret setup completed!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run setup:storage');
    console.log('2. Deploy your application: npm run gcp:deploy');
    
  } catch (error) {
    console.error('❌ Error setting up secrets:', error.message);
  } finally {
    rl.close();
  }
}

// Check if running directly
if (require.main === module) {
  setupSecrets();
}

module.exports = { setupSecrets };