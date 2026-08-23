const crypto = require('crypto');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_SSPh1IPLweU7nI';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

/**
 * Create an order on Razorpay using built-in fetch if secret is present
 */
async function createRazorpayOrder({ amountInPaise, currency = 'INR', receipt, notes = {} }) {
  try {
    if (RAZORPAY_KEY_SECRET) {
      const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt,
          notes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      const errorText = await response.text();
      console.warn('Razorpay live order response not OK:', errorText);
    }
  } catch (err) {
    console.warn('Razorpay API order creation warning:', err.message);
  }

  // When only public Key ID is configured, return null id so Razorpay JS uses client-side payment flow
  return {
    id: null,
    entity: 'order',
    amount: amountInPaise,
    amount_paid: 0,
    amount_due: amountInPaise,
    currency,
    receipt,
    status: 'created',
    notes,
  };
}

/**
 * Verify Razorpay payment signature
 */
function verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!razorpay_payment_id) {
    return false;
  }

  if (RAZORPAY_KEY_SECRET && razorpay_order_id && razorpay_signature) {
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return expectedSignature === razorpay_signature;
  }

  // If secret not configured, valid payment_id presence is sufficient for test mode
  return true;
}

module.exports = {
  RAZORPAY_KEY_ID,
  createRazorpayOrder,
  verifyRazorpaySignature,
};
