export async function createPayPalOrder({ amount, purpose }) {
  return {
    provider: 'paypal',
    mode: process.env.PAYPAL_MODE || 'sandbox',
    orderId: `PAYPAL-${Date.now()}`,
    amount,
    purpose,
    status: 'created'
  };
}

export async function createPayPalPayout({ email, amount }) {
  return {
    provider: 'paypal',
    payoutBatchId: `PAYOUT-${Date.now()}`,
    email,
    amount,
    status: 'pending_approval'
  };
}
