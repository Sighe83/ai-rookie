#!/bin/bash

# Setup script for deploying frontend to Google Cloud via GitHub

echo "🚀 Setting up AI Rookie Frontend deployment on Google Cloud..."

# Set your project ID (replace with your actual project ID)
PROJECT_ID="arcane-fire-467421-d1"
BUCKET_NAME="ai-rookie-frontend-$PROJECT_ID"
REGION="europe-north1"

echo "📝 Project ID: $PROJECT_ID"
echo "🪣 Bucket: $BUCKET_NAME"

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable compute.googleapis.com

# Create Cloud Storage bucket for static website hosting
echo "🪣 Creating Cloud Storage bucket..."
gsutil mb -p $PROJECT_ID -c standard -l $REGION gs://$BUCKET_NAME || echo "Bucket might already exist"

# Configure bucket for static website hosting
echo "🌐 Configuring bucket for static website hosting..."
gsutil web set -m index.html -e index.html gs://$BUCKET_NAME

# Make bucket publicly readable
echo "🔓 Making bucket publicly readable..."
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# Create Cloud Build trigger
echo "⚙️ Setting up Cloud Build trigger..."
echo "You need to do this manually in Google Cloud Console:"
echo ""
echo "1. Go to: https://console.cloud.google.com/cloud-build/triggers"
echo "2. Click 'Create Trigger'"
echo "3. Configure:"
echo "   - Name: ai-rookie-frontend"
echo "   - Event: Push to a branch"
echo "   - Source: Your GitHub repo (Sighe83/ai-rookie)"
echo "   - Branch: ^main$"
echo "   - Configuration: Cloud Build configuration file"
echo "   - Location: Repository"
echo "   - File: cloudbuild-frontend.yaml"
echo ""
echo "4. Click 'Create'"

echo ""
echo "🌍 Your frontend will be available at:"
echo "https://storage.googleapis.com/$BUCKET_NAME/index.html"
echo ""
echo "💡 For a custom domain, set up Cloud CDN:"
echo "https://cloud.google.com/storage/docs/hosting-static-website"

echo ""
echo "✅ Setup complete! Push changes to GitHub to trigger deployment."