#!/bin/bash

echo "🔐 Secure Stripe Secret Key Setup"
echo "================================="
echo ""

# Get the secret key securely
echo "Please paste your Stripe Secret Key (sk_test_...):"
echo "(The input will be hidden for security)"
read -s STRIPE_SECRET_KEY

# Validate the key format
if [[ $STRIPE_SECRET_KEY != sk_test_* ]]; then
    echo "❌ Error: The key doesn't start with 'sk_test_'. Please check and try again."
    exit 1
fi

# Update the backend .env file
cd backend
if [[ -f ".env" ]]; then
    # Update existing line or add new line
    if grep -q "STRIPE_SECRET_KEY=" .env; then
        sed -i '' "s/STRIPE_SECRET_KEY=.*/STRIPE_SECRET_KEY=\"$STRIPE_SECRET_KEY\"/" .env
    else
        echo "STRIPE_SECRET_KEY=\"$STRIPE_SECRET_KEY\"" >> .env
    fi
    echo "✅ Successfully updated backend/.env with your Stripe secret key!"
else
    echo "❌ Error: backend/.env file not found"
    exit 1
fi

echo ""
echo "🎉 Your Stripe secret key has been securely added!"
echo "Next step: Set up webhooks"