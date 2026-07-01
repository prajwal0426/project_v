import { query } from '../config/db.js';

export async function userDashboard(req, res, next) {
  try {
    const [wallet, notifications, ranking] = await Promise.all([
      query('select * from wallets where user_id = $1', [req.user.id]),
      query('select * from notifications where user_id = $1 order by created_at desc limit 10', [req.user.id]),
      query('select * from rankings where user_id = $1 order by month desc limit 1', [req.user.id])
    ]);
    res.json({ wallet: wallet.rows[0], notifications: notifications.rows, ranking: ranking.rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function companyDashboard(req, res, next) {
  try {
    const { rows } = await query(
      `select p.*, count(s.id) as submissions
       from projects p
       left join submissions s on s.project_id = p.id
       where p.company_id = $1
       group by p.id
       order by p.created_at desc`,
      [req.user.id]
    );
    res.json({ projects: rows });
  } catch (error) {
    next(error);
  }
}

export async function adminDashboard(_req, res, next) {
  try {
    const { rows } = await query(`
      select
        (select count(*) from users) as users,
        (select count(*) from companies) as companies,
        (select count(*) from transactions where status = 'pending') as pending_withdrawals
    `);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}
