# Google Cloud Deployment Guide

## Prerequisites

1. **Install Google Cloud CLI**:
   ```bash
   # Install gcloud CLI
   curl https://sdk.cloud.google.com | bash
   source ~/.bashrc
   gcloud init
   ```

2. **Set up Google Cloud Project**:
   ```bash
   # Login and set project
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   
   # Enable required APIs
   gcloud services enable appengine.googleapis.com
   gcloud services enable sqladmin.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   ```

## Database Setup (Cloud SQL)

### Option 1: Create MySQL Instance
```bash
# Create Cloud SQL instance
gcloud sql instances create airookie-db \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_SECURE_PASSWORD

# Create database
gcloud sql databases create airookie_production --instance=airookie-db

# Create user
gcloud sql users create airookie_user \
  --instance=airookie-db \
  --password=YOUR_USER_PASSWORD
```

### Option 2: Use existing MySQL (like your current simply.com setup)
Keep your current DATABASE_URL in the environment variables.

## Environment Variables Setup

1. **Using Google Secret Manager** (Recommended):
   ```bash
   # Store secrets
   echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
   echo -n "your-db-password" | gcloud secrets create db-password --data-file=-
   ```

2. **Update app.yaml** with secret references:
   ```yaml
   env_variables:
     JWT_SECRET: ${JWT_SECRET}
     DATABASE_URL: ${DATABASE_URL}
   ```

## Deployment Steps

1. **Prepare for deployment**:
   ```bash
   cd backend
   npm install
   npx prisma generate
   ```

2. **Deploy to App Engine**:
   ```bash
   # Deploy application
   gcloud app deploy

   # Deploy with specific version
   gcloud app deploy --version=v1
   ```

3. **Run database migrations**:
   ```bash
   # If using Cloud SQL
   gcloud sql connect airookie-db --user=root
   # Then run: npx prisma migrate deploy
   ```

## Post-Deployment

1. **View logs**:
   ```bash
   gcloud app logs tail -s default
   ```

2. **Check application**:
   ```bash
   gcloud app browse
   ```

3. **Set up monitoring**:
   - Enable Cloud Monitoring
   - Set up alerts for errors and high latency

## Custom Domain Setup

1. **Map custom domain**:
   ```bash
   gcloud app domain-mappings create your-domain.com
   ```

2. **Update DNS records** as instructed by Google Cloud.

## Environment Variables You Need to Set

In Google Cloud Console → App Engine → Settings → Environment Variables:

- `DATABASE_URL`: Your MySQL connection string
- `JWT_SECRET`: Secure JWT secret key
- `FRONTEND_URL`: Your frontend domain
- `SMTP_*`: Email configuration
- Any other environment variables from .env.production

## Scaling Configuration

The app.yaml includes automatic scaling:
- Min instances: 1 (always warm)
- Max instances: 10
- CPU target: 60%

Adjust based on your needs and budget.

## Cost Optimization

1. **Use F1 instance** for low traffic
2. **Enable automatic scaling** with min_instances: 0 for development
3. **Use Cloud SQL micro instance** for small databases
4. **Monitor usage** with billing alerts

## Troubleshooting

1. **Check logs**: `gcloud app logs tail -s default`
2. **Health check**: Visit `/health` endpoint
3. **Database issues**: Verify Cloud SQL connection
4. **Environment variables**: Check in GCP Console

## Security Best Practices

1. **Use Secret Manager** for sensitive data
2. **Enable HTTPS only** (handled by App Engine)
3. **Set up IAM roles** properly
4. **Regular security updates**