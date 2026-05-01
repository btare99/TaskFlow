require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function test() {
  try {
    console.log('Testing Stripe with key:', process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...');
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test User',
    });
    console.log('✅ Customer created:', customer.id);
    
    console.log('Testing Price ID:', process.env.STRIPE_PRICE_PRO);
    const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_PRO);
    console.log('✅ Price found:', price.id);
  } catch (err) {
    console.error('❌ Test Failed:', err.message);
  }
}

test();
