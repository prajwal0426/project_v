import mongoose from 'mongoose';
import { Company, Notification, Project, Ranking, Transaction, User, Wallet } from '../models/index.js';
import { paiseToInr } from '../services/wallet.service.js';

function publicWallet(wallet) {
  if (!wallet) return { coinBalance: 0, inrBalance: 0, pendingInrBalance: 0 };
  const { inrBalancePaise = 0, pendingInrBalancePaise = 0, ...rest } = wallet;
  return { ...rest, id: wallet._id, inrBalance: paiseToInr(inrBalancePaise), pendingInrBalance: paiseToInr(pendingInrBalancePaise) };
}

export async function userDashboard(req, res, next) {
  try {
    const [wallet, notifications, ranking] = await Promise.all([
      Wallet.findOne({ userId: req.user.id }).lean(),
      Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(10).lean(),
      Ranking.findOne({ userId: req.user.id }).sort({ month: -1 }).lean()
    ]);
    res.json({ wallet: publicWallet(wallet), notifications, ranking });
  } catch (error) { next(error); }
}

export async function companyDashboard(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: 'Invalid company session' });
    }
    const projects = await Project.aggregate([
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
    ]);
    res.json({ projects });
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
