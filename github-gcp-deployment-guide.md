# Deploy Frontend via GitHub til Google Cloud

## 🎯 Automatic deployment: GitHub → Google Cloud Storage

### Step 1: Kør Setup Script
```bash
./setup-frontend-gcp.sh
```

### Step 2: Opret Cloud Build Trigger (Manual)

1. **Gå til Google Cloud Console**:
   - https://console.cloud.google.com/cloud-build/triggers
   - Vælg dit projekt: `arcane-fire-467421-d1`

2. **Click "Create Trigger"**

3. **Konfigurer trigger**:
   ```
   Name: ai-rookie-frontend
   Event: Push to a branch
   Source: Connect your GitHub repository
   Repository: Sighe83/ai-rookie
   Branch: ^main$
   Configuration Type: Cloud Build configuration file
   Cloud Build configuration file location: / (Repository)
   Cloud Build configuration file name: cloudbuild-frontend.yaml
   ```

4. **Click "Create"**

### Step 3: Test Deployment

1. **Push til GitHub**:
   ```bash
   git add .
   git commit -m "Add frontend deployment configuration"
   git push origin main
   ```

2. **Check build status**:
   - https://console.cloud.google.com/cloud-build/builds

### Step 4: Access Your Frontend

**Din frontend vil være tilgængelig på**:
```
https://storage.googleapis.com/ai-rookie-frontend-arcane-fire-467421-d1/index.html
```

## 🔧 Hvad sker der automatisk?

1. **Du pusher kode til GitHub** 
2. **Cloud Build trigger aktiveres**
3. **Frontend bygges** (`npm run build`)
4. **Bygget uploades** til Cloud Storage bucket
5. **Frontend er live** på Google Cloud

## 🌐 Forbedringer (Valgfrit)

### Custom Domain + CDN

1. **Opret Load Balancer**:
   ```bash
   # Create backend bucket
   gcloud compute backend-buckets create ai-rookie-frontend-bucket \
     --gcs-bucket-name=ai-rookie-frontend-arcane-fire-467421-d1

   # Create URL map
   gcloud compute url-maps create ai-rookie-frontend-lb \
     --default-backend-bucket=ai-rookie-frontend-bucket

   # Create HTTP(S) load balancer
   gcloud compute target-http-proxies create ai-rookie-frontend-proxy \
     --url-map=ai-rookie-frontend-lb

   # Create forwarding rule
   gcloud compute forwarding-rules create ai-rookie-frontend-rule \
     --global \
     --target-http-proxy=ai-rookie-frontend-proxy \
     --ports=80
   ```

2. **Add dit eget domæne**:
   - Peg dit domæne til load balancer IP
   - Setup HTTPS certificat

## 🔄 Workflow Overview

```
GitHub Repo (main branch)
    ↓ (push)
Cloud Build Trigger
    ↓ (builds)
React App (npm run build)
    ↓ (deploys)
Cloud Storage Bucket
    ↓ (serves)
Public Website
```

## 📝 Environment Variables

Frontend bruger:
```
VITE_API_URL=https://ai-rookie-774363048882.europe-north1.run.app/api
```

## 🚨 CORS Update Needed

Din backend skal tillade den nye frontend URL:

```javascript
// I backend/src/server.js
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://storage.googleapis.com', // Add this
    'https://ai-rookie-frontend-arcane-fire-467421-d1.storage.googleapis.com' // And this
  ],
  credentials: true
}));
```

## 💡 Tips

- **Builds kører automatisk** ved hver push til main branch
- **Check build logs** i Google Cloud Console
- **Bucket er offentligt** tilgængelig
- **Gratis hosting** for statiske websites
- **Global CDN** inkluderet med load balancer

**Nu har du automatisk deployment fra GitHub til Google Cloud! 🚀**