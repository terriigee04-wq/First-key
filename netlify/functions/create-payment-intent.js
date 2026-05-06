// netlify/functions/create-payment-intent.js
// Creates a one-time $7 PaymentIntent for the FirstKey personal report.

const Stripe = require('stripe');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Stripe secret key not configured on server' }) };
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 700, // $7.00 in cents
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      description: 'FirstKey AI Personal Report',
      metadata: { product: 'firstkey_ai_report_v1' }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret })
    };
  } catch (error) {
    console.error('Stripe error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Payment initialization failed' })
    };
  }
};
