import cron from 'node-cron';
import { Project, Ranking, Submission } from '../models/index.js';

export async function recalculateMonthlyRankings() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Aggregate approved submissions this month
  const results = await Submission.aggregate([
    { $match: { status: 'approved' } },
    {
      $lookup: {
        from: 'projects',
        localField: 'projectId',
        foreignField: '_id',
        as: 'project'
      }
    },
    { $unwind: '$project' },
    {
      $group: {
        _id: '$userId',
        projectsCompleted: { $sum: 1 },
        feedbackScore: { $avg: '$feedbackScore' },
        starRating: { $avg: '$starRating' },
        difficultyScore: {
          $sum: {
            $switch: {
              branches: [
                { case: { $eq: ['$project.difficulty', 'hard'] }, then: 30 },
                { case: { $eq: ['$project.difficulty', 'medium'] }, then: 20 }
              ],
              default: 10
            }
          }
        }
      }
    }
  ]);

  const ops = results.map(r => {
    const totalScore =
      r.projectsCompleted * 100 +
      (r.feedbackScore || 0) * 20 +
      (r.starRating || 0) * 25 +
      (r.difficultyScore || 0);

    const badge =
      totalScore >= 5000 ? 'Diamond' :
      r.projectsCompleted >= 20 ? 'Gold' :
      r.projectsCompleted >= 10 ? 'Silver' : 'Bronze';

    return {
      updateOne: {
        filter: { userId: r._id, month: startOfMonth },
        update: {
          $set: {
            projectsCompleted: r.projectsCompleted,
            feedbackScore: r.feedbackScore || 0,
            starRating: r.starRating || 0,
            difficultyScore: r.difficultyScore || 0,
            totalScore,
            badge
          }
        },
        upsert: true
      }
    };
  });

  if (ops.length > 0) {
    await Ranking.bulkWrite(ops);
  }
}

export function startRankingCron() {
  cron.schedule('0 2 1 * *', () => {
    recalculateMonthlyRankings().catch((error) => console.error('Ranking cron failed', error));
  });
}
