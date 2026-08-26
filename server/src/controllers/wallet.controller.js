import { Transaction, Wallet } from '../models/index.js';
import { createPayPalOrder, createPayPalPayout } from '../services/paypal.service.js';
import { coinsToInr } from '../services/wallet.service.js';

export async function getWallet(req, res, next) {
  try {
    const [wallet, transactions] = await Promise.all([
      Wallet.findOne({ userId: req.user.id }).lean(),
      Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean()
    ]);
    const w = wallet || { coinBalance: 0, inrBalance: 0, pendingInrBalance: 0 };
    res.json({ ...w, convertedInr: coinsToInr(w.coinBalance), transactions });
  } catch (error) { next(error); }
}

export async function withdraw(req, res, next) {
  try {
    const { paypalEmail, coinAmount } = req.body;
    const amount = coinsToInr(coinAmount);
    const payout = await createPayPalPayout({ email: paypalEmail, amount });
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'withdrawal',
      coinAmount,
      inrAmount: amount,
      provider: 'paypal',
      providerReference: payout.payoutBatchId,
      status: 'pending'
    });
    res.status(201).json({ transaction: { ...transaction.toObject(), id: transaction._id }, payout });
  } catch (error) { next(error); }
}

export async function createPurchase(req, res, next) {
  try {
    const order = await createPayPalOrder(req.body);
    res.status(201).json(order);
  } catch (error) { next(error); }
}
