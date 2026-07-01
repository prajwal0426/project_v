import cron from 'node-cron';
import { query } from '../config/db.js';

export async function recalculateMonthlyRankings() {
  await query(`
    insert into rankings (user_id, month, projects_completed, feedback_score, star_rating, difficulty_score, total_score, badge)
    select
      s.user_id,
      date_trunc('month', now())::date as month,
      count(*) filter (where s.status = 'approved') as projects_completed,
      coalesce(avg(s.feedback_score), 0) as feedback_score,
      coalesce(avg(s.star_rating), 0) as star_rating,
      coalesce(sum(case p.difficulty when 'hard' then 30 when 'medium' then 20 else 10 end), 0) as difficulty_score,
      (
        count(*) filter (where s.status = 'approved') * 100
        + coalesce(avg(s.feedback_score), 0) * 20
        + coalesce(avg(s.star_rating), 0) * 25
        + coalesce(sum(case p.difficulty when 'hard' then 30 when 'medium' then 20 else 10 end), 0)
      ) as total_score,
      case
        when (
          count(*) filter (where s.status = 'approved') * 100
          + coalesce(avg(s.feedback_score), 0) * 20
          + coalesce(avg(s.star_rating), 0) * 25
          + coalesce(sum(case p.difficulty when 'hard' then 30 when 'medium' then 20 else 10 end), 0)
        ) >= 5000 then 'Diamond'
        when count(*) filter (where s.status = 'approved') >= 20 then 'Gold'
        when count(*) filter (where s.status = 'approved') >= 10 then 'Silver'
        else 'Bronze'
      end as badge
    from submissions s
    join projects p on p.id = s.project_id
    group by s.user_id
    on conflict (user_id, month) do update set
      projects_completed = excluded.projects_completed,
      feedback_score = excluded.feedback_score,
      star_rating = excluded.star_rating,
      difficulty_score = excluded.difficulty_score,
      total_score = excluded.total_score,
      badge = excluded.badge,
      updated_at = now()
  `);
}

export function startRankingCron() {
  cron.schedule('0 2 1 * *', () => {
    recalculateMonthlyRankings().catch((error) => console.error('Ranking cron failed', error));
  });
}
