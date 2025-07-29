# Cloud Run Deployment Guide

## Quick Deploy (Easiest Method)

```bash
cd backend
npm run gcp:deploy
```

This will build and deploy directly from source code.

## Prerequisites

1. **Install Google Cloud CLI**:
   ```bash
   curl https://sdk.cloud.google.com | bash
   gcloud init
   ```

2. **Enable APIs**:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

## Deployment Options

### Option 1: Direct Source Deploy (Recommended)
```bash
cd backend
gcloud run deploy ai-rookie-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10
```

### Option 2: Build via Cloud Build
```bash
cd backend
npm run gcp:build
```

### Option 3: Local Docker Build + Deploy
```bash
cd backend
docker build -t gcr.io/YOUR_PROJECT_ID/ai-rookie-backend .
docker push gcr.io/YOUR_PROJECT_ID/ai-rookie-backend
gcloud run deploy ai-rookie-backend \
  --image gcr.io/YOUR_PROJECT_ID/ai-rookie-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Environment Variables Setup

### Method 1: During Deployment
```bash
gcloud run deploy ai-rookie-backend \
  --source . \
  --set-env-vars "NODE_ENV=production,JWT_SECRET=your-secret" \
  --region us-central1
```

### Method 2: Google Cloud Console
1. Go to Cloud Run → Your Service → Variables & Secrets
2. Add each environment variable from `.env.cloudrun`

### Method 3: Using Secret Manager (Most Secure)
```bash
# Store secrets
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
echo -n "your-db-password" | gcloud secrets create db-password --data-file=-

# Deploy with secrets
gcloud run deploy ai-rookie-backend \
  --source . \
  --set-secrets "JWT_SECRET=jwt-secret:latest" \
  --region us-central1
```

## Database Options

### Option 1: Keep Your Simply.com MySQL (Current)
```bash
DATABASE_URL="mysql://airookie_dk:BgcrdzRGaF9mb6kwnEpf@mysql106.unoeuro.com:3306/airookie_dk_db"
```

### Option 2: Google Cloud SQL
```bash
# Create Cloud SQL instance
gcloud sql instances create ai-rookie-db \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=us-central1

# Connect Cloud Run to Cloud SQL
gcloud run deploy ai-rookie-backend \
  --source . \
  --add-cloudsql-instances PROJECT_ID:REGION:INSTANCE_NAME \
  --region us-central1
```

## Custom Domain Setup

```bash
# Map domain
gcloud run domain-mappings create \
  --service ai-rookie-backend \
  --domain your-domain.com \
  --region us-central1
```

## Monitoring & Logs

```bash
# View logs
npm run gcp:logs
# or
gcloud run services logs read ai-rookie-backend --region us-central1

# Monitor service
gcloud run services describe ai-rookie-backend --region us-central1
```

## Local Testing

```bash
# Build and test locally
npm run docker:build
npm run docker:run
```

## Troubleshooting

1. **Build fails**: Check Dockerfile and dependencies
2. **Port issues**: Ensure your app uses `process.env.PORT || 8080`
3. **Database connection**: Verify DATABASE_URL in environment variables
4. **Memory issues**: Increase memory in deployment command
5. **Cold starts**: Set min-instances to 1 for always-warm

## Production Optimizations

```bash
gcloud run deploy ai-rookie-backend \
  --source . \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 20 \
  --concurrency 80 \
  --timeout 300 \
  --execution-environment gen2
```

## Cost Optimization

- **Gen2 execution environment**: Better performance
- **Min instances 0**: Pay only when used
- **Right-size memory/CPU**: Start with 1Gi/1CPU
- **Set concurrency**: 80-100 requests per instance

Your Cloud Run service will be available at: `https://ai-rookie-backend-[hash]-uc.a.run.app`