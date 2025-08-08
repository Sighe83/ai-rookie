#!/bin/bash

echo "🎯 AI Rookie - Stripe Payment Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}This script will help you configure Stripe for your AI Rookie booking system.${NC}"
echo ""

# Step 1: Check if user has Stripe account
echo -e "${YELLOW}Step 1: Stripe Account Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Go to https://stripe.com and create an account (if you haven't already)"
echo "2. Complete the account verification process"
echo "3. Navigate to your Stripe Dashboard"
echo ""
read -p "Press Enter when you have completed account setup..."

# Step 2: Get API Keys
echo ""
echo -e "${YELLOW}Step 2: Get Your API Keys${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. In your Stripe Dashboard, go to 'Developers' > 'API keys'"
echo "2. You'll see two keys:"
echo "   - Publishable key (starts with pk_test_...)"
echo "   - Secret key (starts with sk_test_...)"
echo ""

# Get Secret Key
echo -e "${GREEN}Enter your Stripe Secret Key (sk_test_...):${NC}"
read -s STRIPE_SECRET_KEY
echo "Secret key received ✓"

# Get Publishable Key  
echo ""
echo -e "${GREEN}Enter your Stripe Publishable Key (pk_test_...):${NC}"
read STRIPE_PUBLIC_KEY
echo "Public key received ✓"

# Step 3: Webhook Setup
echo ""
echo -e "${YELLOW}Step 3: Webhook Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. In Stripe Dashboard, go to 'Developers' > 'Webhooks'"
echo "2. Click 'Add endpoint'"
echo "3. Enter this URL: http://localhost:8080/api/payments/webhook"
echo "   (For production, use: https://your-domain.com/api/payments/webhook)"
echo "4. Select these events:"
echo "   - checkout.session.completed"
echo "   - checkout.session.expired" 
echo "   - payment_intent.succeeded"
echo "   - payment_intent.payment_failed"
echo "5. Click 'Add endpoint'"
echo "6. Copy the 'Signing secret' (starts with whsec_...)"
echo ""
read -p "Press Enter when you have created the webhook..."

echo ""
echo -e "${GREEN}Enter your Webhook Signing Secret (whsec_...):${NC}"
read -s STRIPE_WEBHOOK_SECRET
echo "Webhook secret received ✓"

# Update environment files
echo ""
echo -e "${YELLOW}Step 4: Updating Environment Files${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Update backend .env
if [[ -f "backend/.env" ]]; then
    sed -i '' "s/STRIPE_SECRET_KEY=.*/STRIPE_SECRET_KEY=\"$STRIPE_SECRET_KEY\"/" backend/.env
    sed -i '' "s/STRIPE_WEBHOOK_SECRET=.*/STRIPE_WEBHOOK_SECRET=\"$STRIPE_WEBHOOK_SECRET\"/" backend/.env
    echo "✓ Updated backend/.env"
else
    echo -e "${RED}✗ backend/.env file not found${NC}"
fi

# Update frontend .env  
if [[ -f ".env" ]]; then
    # Check if VITE_STRIPE_PUBLIC_KEY exists, if not add it
    if grep -q "VITE_STRIPE_PUBLIC_KEY" .env; then
        sed -i '' "s/VITE_STRIPE_PUBLIC_KEY=.*/VITE_STRIPE_PUBLIC_KEY=\"$STRIPE_PUBLIC_KEY\"/" .env
    else
        echo "" >> .env
        echo "# Stripe Configuration (Frontend)" >> .env
        echo "VITE_STRIPE_PUBLIC_KEY=\"$STRIPE_PUBLIC_KEY\"" >> .env
    fi
    echo "✓ Updated .env"
else
    echo -e "${RED}✗ .env file not found${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Stripe Configuration Complete!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Test your configuration by running the backend:"
echo "   cd backend && npm run dev"
echo ""
echo "2. Test a booking to ensure payment redirection works"
echo ""
echo "3. Check webhook events in your Stripe Dashboard"
echo ""
echo -e "${YELLOW}Important Notes:${NC}"
echo "• You're currently using TEST keys - no real money will be processed"
echo "• Test card number: 4242 4242 4242 4242"
echo "• Use any future expiry date and any 3-digit CVC"
echo ""
echo -e "${RED}Security Reminder:${NC}"
echo "• Never commit your .env files to version control"
echo "• Keep your secret keys private"
echo "• For production, replace test keys with live keys"
echo ""