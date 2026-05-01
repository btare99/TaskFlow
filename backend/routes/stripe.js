const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

let stripe;
try {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} catch (e) {
  console.warn('Stripe not configured.');
}

const PLANS = {
  pro: { priceId: process.env.STRIPE_PRICE_PRO, name: 'Pro' },
  team: { priceId: process.env.STRIPE_PRICE_TEAM, name: 'Team' },
};

// ─── GET SUBSCRIPTION STATUS ───────────────────────────────────────────────
router.get('/status', protect, (req, res) => {
  res.json({ subscription: req.user.subscription });
});

// ─── CREATE CHECKOUT SESSION ───────────────────────────────────────────────
router.post('/create-checkout', protect, async (req, res) => {
  try {
    console.log(`[Stripe] User ${req.user.email} kërkon checkout për planin: ${req.body.plan}`);
    
    if (!stripe) return res.status(503).json({ message: 'Stripe nuk është konfiguruar.' });
    
    const { plan } = req.body;
    const planConfig = PLANS[plan];
    
    if (!planConfig || !planConfig.priceId || planConfig.priceId.includes('your_')) {
      return res.status(400).json({ message: `ID e planit "${plan}" nuk është e saktë në .env.` });
    }

    let customerId = req.user.subscription?.stripeCustomerId;
    console.log(`[Stripe] Customer ID ekzistues: ${customerId || 'asnjë'}`);
    
    // Validate or create customer
    if (customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) customerId = null;
      } catch (e) {
        console.warn(`[Stripe] Customer ID ${customerId} ishte i pavlefshëm, po krijojmë një të ri.`);
        customerId = null; 
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: { userId: req.user._id.toString() },
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(req.user._id, { 'subscription.stripeCustomerId': customerId });
      console.log(`[Stripe] Customer i ri u krijua: ${customerId}`);
    }

    console.log(`[Stripe] Duke krijuar session për Price: ${planConfig.priceId}`);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      automatic_payment_methods: { enabled: true },
      success_url: `${process.env.CLIENT_URL}/settings/billing?success=true&plan=${plan}`,
      cancel_url: `${process.env.CLIENT_URL}/pricing?canceled=true`,
      metadata: { userId: req.user._id.toString(), plan },
    });

    console.log(`[Stripe] Session u krijua me sukses: ${session.id}`);
    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe Checkout Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── CREATE CUSTOMER PORTAL ────────────────────────────────────────────────
router.post('/portal', protect, async (req, res) => {
  try {
    if (!stripe) return res.status(503).json({ message: 'Stripe nuk është konfiguruar.' });
    const customerId = req.user.subscription?.stripeCustomerId;
    if (!customerId) return res.status(400).json({ message: 'Nuk keni abonament aktiv.' });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.CLIENT_URL}/settings/billing`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── CANCEL SUBSCRIPTION ───────────────────────────────────────────────────
router.post('/cancel', protect, async (req, res) => {
  try {
    if (!stripe) return res.status(503).json({ message: 'Stripe nuk është konfiguruar.' });
    const subId = req.user.subscription?.stripeSubscriptionId;
    if (!subId) return res.status(400).json({ message: 'Nuk keni abonament aktiv.' });

    await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
    await User.findByIdAndUpdate(req.user._id, { 'subscription.status': 'canceled' });
    res.json({ message: 'Abonimet do të anulohet në fund të periudhës aktuale.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── STRIPE WEBHOOK ────────────────────────────────────────────────────────
router.post('/webhook', async (req, res) => {
  if (!stripe) return res.status(503).end();

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Stripe Webhook Verification Failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const getUser = async (customerId) => User.findOne({ 'subscription.stripeCustomerId': customerId });

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const user = await User.findById(session.metadata.userId);
      if (user) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        user.subscription.plan = session.metadata.plan;
        user.subscription.stripeSubscriptionId = session.subscription;
        user.subscription.status = 'active';
        user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        await user.save({ validateBeforeSave: false });
      }
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const user = await getUser(invoice.customer);
      if (user) {
        user.subscription.status = 'past_due';
        await user.save({ validateBeforeSave: false });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const user = await getUser(sub.customer);
      if (user) {
        user.subscription.plan = 'free';
        user.subscription.status = 'inactive';
        user.subscription.stripeSubscriptionId = null;
        await user.save({ validateBeforeSave: false });
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const user = await getUser(sub.customer);
      if (user) {
        user.subscription.status = sub.status === 'active' ? 'active' : 'past_due';
        user.subscription.currentPeriodEnd = new Date(sub.current_period_end * 1000);
        await user.save({ validateBeforeSave: false });
      }
      break;
    }
  }

  res.json({ received: true });
});

module.exports = router;
