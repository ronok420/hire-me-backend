import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// For testing purposes, 
const USE_FAKE_PAYMENT = true; // Set to false to use real Stripe

const stripe = USE_FAKE_PAYMENT ? null : new Stripe(process.env.STRIPE_SECRET_KEY);

// Store fake payment intents
const fakePaymentIntents = new Map();

export const createPaymentIntent = async (amount) => {
  try {
    if (USE_FAKE_PAYMENT) {
      // Generate a fake payment intent ID
      const fakePaymentIntentId = `pi_fake_${Date.now()}`;
      const fakeClientSecret = `pi_fake_secret_${Date.now()}`;
      
      // Store the fake payment intent
      fakePaymentIntents.set(fakePaymentIntentId, {
        id: fakePaymentIntentId,
        status: 'requires_confirmation',
        amount: amount * 100,
        client_secret: fakeClientSecret
      });

      return {
        clientSecret: fakeClientSecret,
        paymentIntentId: fakePaymentIntentId
      };
    }

    // Real Stripe implementation
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'bdt',
      payment_method_types: ['card'],
      metadata: {
        application_fee: '100'
      }
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    throw new Error(`Payment intent creation failed: ${error.message}`);
  }
};

export const confirmPayment = async (paymentIntentId) => {
  try {
    if (USE_FAKE_PAYMENT) {
      // Get the fake payment intent
      const fakePaymentIntent = fakePaymentIntents.get(paymentIntentId);
      
      if (!fakePaymentIntent) {
        throw new Error('Payment intent not found');
      }

      // Simulate a successful payment
      fakePaymentIntent.status = 'succeeded';
      fakePaymentIntents.set(paymentIntentId, fakePaymentIntent);
      
      return true;
    }

    // Real Stripe implementation
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      throw new Error('Payment intent not found');
    }

    if (paymentIntent.status === 'succeeded') {
      return true;
    }

    if (paymentIntent.status === 'requires_confirmation') {
      const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntentId);
      return confirmedIntent.status === 'succeeded';
    }

    return false;
  } catch (error) {
    console.error('Payment confirmation failed:', error);
    throw new Error(`Payment confirmation failed: ${error.message}`);
  }
}; 