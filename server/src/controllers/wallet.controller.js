import { query } from '../config/db.js';
import { createPayPalOrder, createPayPalPayout } from '../services/paypal.service.js';
import { coinsToInr } from '../services/wallet.service.js';

export async function getWallet(req, res, next) {
  try {
    const [walletResult, transactionResult] = await Promise.all([
      query('select * from wallets where user_id = $1', [req.user.id]),
      query('select * from transactions where user_id = $1 order by created_at desc', [req.user.id])
    ]);
    const wallet = walletResult.rows[0] || { coin_balance: 0, inr_balance: 0, pending_inr_balance: 0 };
    res.json({ ...wallet, convertedInr: coinsToInr(wallet.coin_balance), transactions: transactionResult.rows });
  } catch (error) {
    next(error);
  }
}

export async function withdraw(req, res, next) {
  try {
    const { paypalEmail, coinAmount } = req.body;
    const amount = coinsToInr(coinAmount);
    const payout = await createPayPalPayout({ email: paypalEmail, amount });
    const { rows } = await query(
      `insert into transactions (user_id, type, coin_amount, inr_amount, provider, provider_reference, status)
       values ($1, 'withdrawal', $2, $3, 'paypal', $4, 'pending') returning *`,
      [req.user.id, coinAmount, amount, payout.payoutBatchId]
    );
    res.status(201).json({ transaction: rows[0], payout });
  } catch (error) {
    next(error);
  }
}

export async function createPurchase(req, res, next) {
  try {
    const order = await createPayPalOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
}
