# Stripe Payment Integration Setup

## Overview

This document outlines the Stripe payment integration implemented for the AI Rookie booking system. The integration includes:

- **Automatic payment redirection** after booking creation
- **5-minute payment timeout** with automatic booking cancellation
- **Stripe Checkout** for secure payment processing
- **Webhook handling** for payment confirmation
- **Automatic time slot management** based on payment status

## Required Environment Variables

### Backend (.env)

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL for payment redirects
FRONTEND_URL=http://localhost:3000

# Database Configuration
DATABASE_URL=your_database_connection_string
```

### Frontend (.env)

```bash
# Backend API URL
VITE_API_URL=http://localhost:8080

# Optional: Stripe public key (if needed for frontend)
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key_here
```

## Stripe Setup Instructions

### 1. Create Stripe Account
1. Sign up at [https://stripe.com](https://stripe.com)
2. Complete account verification
3. Navigate to the Dashboard

### 2. Get API Keys
1. Go to **Developers** > **API keys**
2. Copy the **Secret key** (starts with `sk_test_` or `sk_live_`)
3. Copy the **Publishable key** (starts with `pk_test_` or `pk_live_`)

### 3. Set Up Webhooks
1. Go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to: `https://your-backend-domain.com/api/payments/webhook`
4. Select the following events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)

### 4. Configure Products (Optional)
If you want to use Stripe Products instead of dynamic pricing:
1. Go to **Products**
2. Create products for your sessions
3. Note the Price IDs for use in your application

## Implementation Details

### Booking Flow

1. **Customer selects time and confirms booking**
   - Booking is created with status `AWAITING_PAYMENT`
   - Time slot is marked as reserved (temporarily unavailable)
   - Payment expires 5 minutes after booking creation

2. **Automatic redirect to Stripe Checkout**
   - Backend creates Stripe Checkout session
   - Customer is redirected to Stripe payment page
   - Session expires after 5 minutes

3. **Payment completion**
   - **Success**: Booking status → `CONFIRMED`, time slot → permanently booked
   - **Failure/Timeout**: Booking status → `CANCELLED`, time slot → released

### Automatic Cleanup Service

The backend runs a cleanup service that:
- Runs every minute
- Finds bookings with expired payments
- Cancels expired bookings
- Releases reserved time slots
- Logs cleanup activities

### Webhook Security

Webhooks are secured using Stripe's signature verification:
- Validates the webhook signature
- Prevents unauthorized webhook calls
- Ensures data integrity

## Database Schema Changes

```sql
-- New field added to bookings table
ALTER TABLE "bookings" ADD COLUMN "payment_expires_at" TIMESTAMPTZ;
```

### New Booking Statuses

- `AWAITING_PAYMENT`: Initial status, payment not yet completed
- `CONFIRMED`: Payment completed successfully
- `CANCELLED`: Booking cancelled (payment expired or manual cancellation)

### Payment Statuses

- `PENDING`: Payment not yet processed
- `COMPLETED`: Payment successful
- `FAILED`: Payment failed
- `EXPIRED`: Payment window expired

## Frontend Components

### PaymentSuccess (`/payment/success`)
- Shows booking confirmation
- Displays payment details
- Provides navigation to dashboard or new bookings

### PaymentCancelled (`/payment/cancelled`)
- Shows cancellation message
- Option to retry payment
- Explains time slot release

## API Endpoints

### POST `/api/bookings`
**Enhanced to include payment flow:**
```json
{
  "success": true,
  "data": {
    "id": "booking-uuid",
    "status": "AWAITING_PAYMENT",
    // ... other booking data
  },
  "paymentUrl": "https://checkout.stripe.com/pay/...",
  "paymentExpiresAt": "2024-01-07T15:05:00.000Z"
}
```

### POST `/api/payments/webhook`
**Handles Stripe events:**
- `checkout.session.completed` → Confirm booking
- `checkout.session.expired` → Cancel booking
- Other payment events

## Testing

### Test Cards (Stripe Test Mode)
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
```

### Testing Webhook Events
1. Use Stripe CLI: `stripe listen --forward-to localhost:8080/api/payments/webhook`
2. Trigger events: `stripe trigger checkout.session.completed`

## Production Deployment

### Environment Variables
- Replace test keys with live keys
- Set `FRONTEND_URL` to production domain
- Update webhook endpoint URL

### Webhook Configuration
- Update webhook URL to production backend
- Ensure webhook endpoint is publicly accessible
- Verify SSL certificate

### Database Migration
```bash
cd backend
npx prisma migrate deploy
```

## Monitoring & Logs

The system logs the following events:
- Booking creation with payment URL
- Payment completions and failures  
- Automatic booking cancellations
- Time slot releases
- Webhook processing

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Webhook Signatures**: Always verify webhook signatures
3. **CORS**: Configure CORS properly for frontend domain
4. **Rate Limiting**: API endpoints are rate-limited
5. **Input Validation**: All booking data is validated

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is accessible
   - Verify webhook secret matches
   - Check Stripe Dashboard webhook logs

2. **Payment redirects failing**
   - Verify `FRONTEND_URL` environment variable
   - Check CORS configuration

3. **Bookings not being cancelled**
   - Check cleanup service logs
   - Verify database connection
   - Check `paymentExpiresAt` values

4. **Time slots not being released**
   - Check availability table structure
   - Verify cleanup service is running
   - Check database permissions

### Debug Commands

```bash
# Check cleanup service status
curl http://localhost:8080/api/admin/cleanup-status

# View recent bookings
curl http://localhost:8080/api/bookings

# Check webhook events
curl -X POST http://localhost:8080/api/payments/webhook/test
```