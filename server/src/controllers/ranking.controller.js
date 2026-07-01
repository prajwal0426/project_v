import { query } from '../config/db.js';
import { recalculateMonthlyRankings } from '../services/ranking.service.js';

export async function getRankings(_req, res, next) {
  try {
    const { rows } = await query(
      `select r.*, u.name
       from rankings r
       join users u on u.id = r.user_id
       where r.month = date_trunc('month', now())::date
       order by r.total_score desc
       limit 100`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function refreshRankings(_req, res, next) {
  try {
    await recalculateMonthlyRankings();
    res.json({ message: 'Rankings refreshed' });
  } catch (error) {
    next(error);
  }
}
