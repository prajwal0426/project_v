import mongoose from 'mongoose';
import { Project, Submission } from '../models/index.js';

export async function listProjects(_req, res, next) {
  try {
    const projects = await Project.find().sort({ createdAt: -1 }).lean();
    res.json(projects.map(p => ({ ...p, id: p._id })));
  } catch (error) { next(error); }
}

export async function createProject(req, res, next) {
  try {
    const { title, description, difficulty, coinReward, budgetInr, rewardPoolInr, bonusInr, paymentInr } = req.body;
    const project = await Project.create({
      companyId: req.user.id,
      title, description, difficulty,
      coinReward: coinReward || 0,
      budgetInr: budgetInr || 0,
      rewardPoolInr: rewardPoolInr || 0,
      bonusInr: bonusInr || 0,
      paymentInr: paymentInr || 0
    });
    res.status(201).json({ ...project.toObject(), id: project._id });
  } catch (error) { next(error); }
}

export async function submitProject(req, res, next) {
  try {
    const submission = await Submission.create({
      projectId: req.params.id,
      userId: req.user.id,
      fileUrl: req.file?.path,
      status: 'submitted'
    });
    res.status(201).json({ ...submission.toObject(), id: submission._id });
  } catch (error) { next(error); }
}

export async function reviewSubmission(req, res, next) {
  try {
    const { status, feedback, feedbackScore, starRating } = req.body;
    const submission = await Submission.findByIdAndUpdate(
      req.params.submissionId,
      { status, feedback, feedbackScore, starRating, reviewedAt: new Date() },
      { new: true }
    ).lean();
    res.json({ ...submission, id: submission._id });
  } catch (error) { next(error); }
}
