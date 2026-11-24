import mongoose from 'mongoose';
import { Company, Project, Ranking, Transaction, User, Wallet } from '../models/index.js';
import { listRecipientNotifications, unreadCountForRecipient } from '../services/notification.service.js';
import { paiseToInr } from '../services/wallet.service.js';

function publicWallet(wallet) {
  if (!wallet) return { coinBalance: 0, inrBalance: 0, pendingInrBalance: 0 };
  const { inrBalancePaise = 0, pendingInrBalancePaise = 0, ...rest } = wallet;
  return { ...rest, id: wallet._id, inrBalance: paiseToInr(inrBalancePaise), pendingInrBalance: paiseToInr(pendingInrBalancePaise) };
}

export async function userDashboard(req, res, next) {
  try {
    const [wallet, notifications, ranking, unreadCount] = await Promise.all([
      Wallet.findOne({ userId: req.user.id }).lean(),
      listRecipientNotifications({ role: 'user', recipientId: req.user.id, limit: 10 }),
      Ranking.findOne({ userId: req.user.id }).sort({ month: -1 }).lean(),
      unreadCountForRecipient({ role: 'user', recipientId: req.user.id })
    ]);
    res.json({ wallet: publicWallet(wallet), notifications, ranking, unreadCount });
  } catch (error) { next(error); }
}

export async function companyDashboard(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Invalid company session' });
    }
    const [projects, notifications, unreadCount] = await Promise.all([Project.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $lookup: {
          from: 'submissions',
          localField: '_id',
          foreignField: 'projectId',
          as: 'submissionsArr'
        }
      },
      { $addFields: { submissions: { $size: '$submissionsArr' } } },
      { $project: { submissionsArr: 0 } },
      { $sort: { createdAt: -1 } }
    ]), listRecipientNotifications({ role: 'company', recipientId: req.user.id, limit: 10 }), unreadCountForRecipient({ role: 'company', recipientId: req.user.id })]);
    res.json({ projects, notifications, unreadCount });
  } catch (error) { next(error); }
}

export async function adminDashboard(_req, res, next) {
  try {
    const [users, companies, pendingWithdrawals] = await Promise.all([
      User.countDocuments(),
      Company.countDocuments(),
      Transaction.countDocuments({ status: 'pending' })
    ]);
    res.json({ users, companies, pending_withdrawals: pendingWithdrawals });
  } catch (error) { next(error); }
}
