import { query } from '../config/db.js';

export async function listProjects(_req, res, next) {
  try {
    const { rows } = await query('select * from projects order by created_at desc');
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function createProject(req, res, next) {
  try {
    const { title, description, difficulty, coinReward, budgetInr, rewardPoolInr, bonusInr, paymentInr } = req.body;
    const { rows } = await query(
      `insert into projects (company_id, title, description, difficulty, coin_reward, budget_inr, reward_pool_inr, bonus_inr, payment_inr)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *`,
      [req.user.id, title, description, difficulty, coinReward, budgetInr || 0, rewardPoolInr || 0, bonusInr || 0, paymentInr || 0]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
}

export async function submitProject(req, res, next) {
  try {
    const { rows } = await query(
      'insert into submissions (project_id, user_id, file_url, status) values ($1, $2, $3, $4) returning *',
      [req.params.id, req.user.id, req.file?.path, 'submitted']
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
}

export async function reviewSubmission(req, res, next) {
  try {
    const { status, feedback, feedbackScore, starRating } = req.body;
    const { rows } = await query(
      `update submissions
       set status = $1, feedback = $2, feedback_score = $3, star_rating = $4, reviewed_at = now()
       where id = $5 returning *`,
      [status, feedback, feedbackScore, starRating, req.params.submissionId]
    );
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}
