import crypto from 'crypto';
import { Transaction, Wallet } from '../models/index.js';
import { createPayPalOrder, createPayPalPayout } from '../services/paypal.service.js';
import { assertWholeCoinAmount, coinsToInr, coinsToInrPaise, paiseToInr } from '../services/wallet.service.js';

function publicWallet(wallet = {}) {
  const { inrBalancePaise = 0, pendingInrBalancePaise = 0, ...rest } = wallet;
  return {
    ...rest,
    id: wallet._id || wallet.id,
    inrBalance: paiseToInr(inrBalancePaise),
    pendingInrBalance: paiseToInr(pendingInrBalancePaise)
  };
}

function publicTransaction(transaction) {
  const { inrAmountPaise = 0, ...rest } = transaction;
  return { ...rest, id: transaction._id || transaction.id, inrAmount: paiseToInr(inrAmountPaise) };
}

export async function getWallet(req, res, next) {
  try {
    const [wallet, transactions] = await Promise.all([
      Wallet.findOne({ userId: req.user.id }).lean(),
      Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean()
    ]);
    const w = publicWallet(wallet || { coinBalance: 0, inrBalancePaise: 0, pendingInrBalancePaise: 0 });
    res.json({ ...w, convertedInr: coinsToInr(w.coinBalance), transactions: transactions.map(publicTransaction) });
  } catch (error) { next(error); }
}

export async function withdraw(req, res, next) {
  try {
    const { paypalEmail } = req.body;
    const coinAmount = assertWholeCoinAmount(req.body.coinAmount);
    const amountPaise = coinsToInrPaise(coinAmount);
    const idempotencyKey = String(req.get('Idempotency-Key') || crypto.randomUUID()).slice(0, 200);

    let transaction;
    try {
      transaction = await Transaction.create({
        userId: req.user.id,
        type: 'withdrawal',
        coinAmount,
        inrAmountPaise: amountPaise,
        provider: 'paypal',
        idempotencyKey,
        status: 'processing'
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      const existing = await Transaction.findOne({ idempotencyKey }).lean();
      if (existing?.userId?.toString() !== req.user.id) {
        const duplicate = new Error('Duplicate withdrawal request');
        duplicate.status = 409;
        throw duplicate;
      }
      return res.status(200).json({ transaction: publicTransaction(existing), replayed: true });
    }

    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user.id, coinBalance: { $gte: coinAmount } },
      { $inc: { coinBalance: -coinAmount, pendingInrBalancePaise: amountPaise } },
      { new: true }
    );

    if (!wallet) {
      await Transaction.findByIdAndUpdate(transaction._id, { status: 'failed' });
      const insufficient = new Error('Insufficient coin balance');
      insufficient.status = 422;
      throw insufficient;
    }

    try {
      const payout = await createPayPalPayout({ email: paypalEmail, amount: paiseToInr(amountPaise) });
      transaction = await Transaction.findByIdAndUpdate(
        transaction._id,
        { providerReference: payout.payoutBatchId, status: 'pending' },
        { new: true }
      ).lean();
      return res.status(201).json({ transaction: publicTransaction(transaction), payout });
    } catch (error) {
      await Wallet.findByIdAndUpdate(wallet._id, {
        $inc: { coinBalance: coinAmount, pendingInrBalancePaise: -amountPaise }
      });
      await Transaction.findByIdAndUpdate(transaction._id, { status: 'failed' });
      throw error;
    }
  } catch (error) { next(error); }
}

export async function createPurchase(req, res, next) {
  try {
    const order = await createPayPalOrder(req.body);
    res.status(201).json(order);
  } catch (error) { next(error); }
}
