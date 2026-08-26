import { Ranking } from '../models/index.js';
import { recalculateMonthlyRankings } from '../services/ranking.service.js';

export async function getRankings(_req, res, next) {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const rows = await Ranking.find({ month: { $gte: startOfMonth, $lt: endOfMonth } })
      .populate('userId', 'name email')
      .sort({ totalScore: -1 })
      .limit(100)
      .lean();

    res.json(rows.map(r => ({ ...r, id: r._id, name: r.userId?.name })));
  } catch (error) { next(error); }
}

export async function refreshRankings(_req, res, next) {
  try {
    await recalculateMonthlyRankings();
    res.json({ message: 'Rankings refreshed' });
  } catch (error) { next(error); }
}
