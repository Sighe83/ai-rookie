const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create payment intent
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { amount, currency = 'dkk', bookingId, metadata = {} } = req.body;

    // Validate required fields
    if (!amount || !bookingId) {
      return res.status(400).json({
        error: 'Amount and booking ID are required'
      });
    }

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: req.user.id
      },
      include: {
        tutor: {
          include: {
            user: true
          }
        },
        session: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found or access denied'
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to øre/cents
      currency: currency.toLowerCase(),
      metadata: {
        bookingId: bookingId.toString(),
        userId: req.user.id.toString(),
        tutorId: booking.tutorId.toString(),
        sessionTitle: booking.session?.title || 'AI Session',
        ...metadata
      },
      description: `AI Rookie Session: ${booking.session?.title || 'Learning Session'}`,
    });

    // Update booking with payment intent ID
    await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'PENDING'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({
      error: 'Failed to create payment intent',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Confirm payment
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Payment intent ID is required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update booking payment status
      const booking = await prisma.booking.update({
        where: { paymentIntentId },
        data: { 
          paymentStatus: 'COMPLETED',
          paidAt: new Date()
        },
        include: {
          tutor: {
            include: {
              user: true
            }
          },
          session: true,
          user: true
        }
      });

      res.json({
        success: true,
        booking,
        paymentStatus: 'completed'
      });
    } else {
      res.status(400).json({
        error: 'Payment not completed',
        status: paymentIntent.status
      });
    }

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      error: 'Failed to confirm payment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Webhook for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Update booking status
        await prisma.booking.updateMany({
          where: { paymentIntentId: paymentIntent.id },
          data: { 
            paymentStatus: 'COMPLETED',
            paidAt: new Date()
          }
        });
        
        console.log('Payment succeeded:', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        
        // Update booking status
        await prisma.booking.updateMany({
          where: { paymentIntentId: failedPayment.id },
          data: { paymentStatus: 'FAILED' }
        });
        
        console.log('Payment failed:', failedPayment.id);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get payment status
router.get('/status/:bookingId', auth, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        userId: req.user.id
      },
      select: {
        id: true,
        paymentStatus: true,
        paymentIntentId: true,
        paidAt: true,
        totalPrice: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found or access denied'
      });
    }

    res.json(booking);

  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({
      error: 'Failed to get payment status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;