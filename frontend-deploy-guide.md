# Frontend Deployment Guide

## Din situation:
- ✅ Backend kører på: `https://ai-rookie-774363048882.europe-north1.run.app/`
- ❌ Frontend er ikke deployed endnu

## Option 1: Firebase Hosting (Anbefalet)

### 1. Install Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
```

### 2. Initialize Firebase:
```bash
firebase init hosting
# Vælg:
# - Use existing project eller create new
# - Public directory: dist
# - Single-page app: Yes
# - Overwrite index.html: No
```

### 3. Deploy:
```bash
npm run deploy
```

### 4. Din frontend vil være tilgængelig på:
`https://your-project-id.web.app`

## Option 2: Google Cloud Storage + CDN

### 1. Build frontend:
```bash
npm run build
```

### 2. Deploy til Cloud Storage:
```bash
# Create bucket
gsutil mb gs://ai-rookie-frontend

# Upload files
gsutil -m cp -r dist/* gs://ai-rookie-frontend/

# Make public
gsutil -m acl set -R -a public-read gs://ai-rookie-frontend/
```

## Option 3: Netlify (Gratis)

### 1. Build:
```bash
npm run build
```

### 2. Drag & drop `dist` folder til netlify.com

## Vigtige noter:

### Environment Variables:
Din frontend bruger: `VITE_API_URL=https://ai-rookie-774363048882.europe-north1.run.app/api`

### CORS Setup:
Backend skal tillade din frontend domain i CORS:

```javascript
// I backend/src/server.js
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-firebase-domain.web.app', // Add this
    'https://ai-rookie.web.app' // Or whatever domain you get
  ],
  credentials: true
}));
```

## Test lokal frontend:
```bash
npm run dev
# Åbn http://localhost:3000
```

**Anbefaling**: Start med Firebase Hosting - det er nemt og gratis for små projekter.