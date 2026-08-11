import { Router } from 'express';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = Router();

const PRICING = {
  NG: { currency: 'NGN', amount: 299900, display: '₦2,999' },
  GH: { currency: 'GHS', amount: 3500, display: 'GH₵35' },
  KE: { currency: 'KES', amount: 45000, display: 'KSh450' },
  GB: { currency: 'USD', amount: 599, display: '$5.99' }, // Paystack doesn't support GBP
  US: { currency: 'USD', amount: 599, display: '$5.99' },
  AE: { currency: 'USD', amount: 599, display: '$5.99' },
};
const DEFAULT_PRICE = { currency: 'USD', amount: 599, display: '$5.99' };

// GET /payment/pricing - get pricing for a country
router.get('/pricing', (req, res) => {
  const country = (req.query.country || 'US').toUpperCase();
  const price = PRICING[country] || DEFAULT_PRICE;
  res.json({ ...price, country });
});

// POST /payment/initiate - create Paystack transaction
router.post('/initiate', async (req, res) => {
  const { userId, email, country } = req.body;
  if (!userId || !email) {
    return res.status(422).json({ error: 'userId and email are required' });
  }

  const PAYSTACK_KEY = process.env.PAYSTACK_SECRET_KEY;
  const countryUpper = (country || 'US').toUpperCase();
  const price = PRICING[countryUpper] || DEFAULT_PRICE;

  // Demo mode: if key is placeholder, return demo URL
  if (!PAYSTACK_KEY || PAYSTACK_KEY.includes('REPLACE_WITH')) {
    return res.json({
      demo: true,
      authorization_url: null,
      reference: `demo_${Date.now()}_${userId}`,
      price,
    });
  }

  const reference = `testnia_${Date.now()}_${userId}`;
  const callbackUrl = process.env.WEBSITE_URL
    ? `${process.env.WEBSITE_URL}/payment/callback`
    : `${req.protocol}://${req.get('host')}/payment/callback`;

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: price.amount,
      currency: price.currency,
      reference,
      callback_url: callbackUrl,
      metadata: { userId, country: countryUpper },
    }),
  });

  if (!response.ok) {
    throw new Error(`Paystack init failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.status) {
    throw new Error(`Paystack init error: ${data.message}`);
  }

  res.json({
    authorization_url: data.data.authorization_url,
    reference: data.data.reference,
    price,
  });
});

// POST /payment/verify - verify and activate subscription
router.post('/verify', async (req, res) => {
  const { reference, userId } = req.body;
  if (!reference || !userId) {
    return res.status(422).json({ error: 'reference and userId are required' });
  }

  const PAYSTACK_KEY = process.env.PAYSTACK_SECRET_KEY;

  // Demo mode
  if (!PAYSTACK_KEY || PAYSTACK_KEY.includes('REPLACE_WITH') || reference.startsWith('demo_')) {
    const pb = pocketbaseClient;
    await activateSubscription(pb, userId, 'demo', reference, 599, 'USD');
    return res.json({ success: true, demo: true });
  }

  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_KEY}` },
  });

  if (!verifyRes.ok) {
    throw new Error(`Paystack verify failed: ${verifyRes.status} ${verifyRes.statusText}`);
  }

  const data = await verifyRes.json();
  if (!data.status || data.data.status !== 'success') {
    return res.status(402).json({ error: 'Payment not completed', status: data.data?.status });
  }

  const txn = data.data;
  const pb = pocketbaseClient;
  await activateSubscription(pb, userId, 'paystack', reference, txn.amount, txn.currency);

  // Record payment
  try {
    await pb.collection('payments').create({
      user: userId,
      amount_cents: txn.amount,
      currency: txn.currency,
      status: 'paid',
      provider: 'paystack',
      provider_ref: reference,
      paid_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Failed to save payment record', err);
  }

  res.json({ success: true });
});

async function activateSubscription(pb, userId, provider, reference, amountCents, currency) {
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  // Create or update subscription
  let existing = null;
  try {
    const results = await pb.collection('subscriptions').getFullList({
      filter: `user = "${userId}"`,
      sort: '-created',
    });
    existing = results[0];
  } catch (_) {}

  const subData = {
    user: userId,
    plan: 'pro',
    status: 'active',
    current_period_end: thirtyDays.toISOString(),
    provider,
    provider_ref: reference,
    auto_renew: true,
    start_date: new Date().toISOString(),
  };

  if (existing) {
    await pb.collection('subscriptions').update(existing.id, subData);
  } else {
    await pb.collection('subscriptions').create(subData);
  }

  // Record payment for demo mode
  if (provider === 'demo') {
    try {
      await pb.collection('payments').create({
        user: userId,
        amount_cents: amountCents,
        currency,
        status: 'paid',
        provider: 'demo',
        provider_ref: reference,
        paid_at: new Date().toISOString(),
      });
    } catch (_) {}
  }
}

export default router;
