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
      coinReward: coinReward ?? 0,
      budgetInr: budgetInr ?? 0,
      rewardPoolInr: rewardPoolInr ?? 0,
      bonusInr: bonusInr ?? 0,
      paymentInr: paymentInr ?? 0
    });
    res.status(201).json({ ...project.toObject(), id: project._id });
  } catch (error) { next(error); }
}

export async function submitProject(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = await Project.findOne({ _id: req.params.id, status: 'open' }).select('_id').lean();
    if (!project) return res.status(404).json({ message: 'Project not found or unavailable for submissions' });

    const submission = await Submission.create({
      projectId: req.params.id,
      userId: req.user.id,
      fileUrl: req.file?.path,
      status: 'submitted'
    });
    res.status(201).json({ ...submission.toObject(), id: submission._id });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'You have already submitted this project' });
    return next(error);
  }
}

export async function reviewSubmission(req, res, next) {
  try {
    const { status, feedback, feedbackScore, starRating } = req.body;
    if (!mongoose.isValidObjectId(req.params.submissionId)) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const submission = await Submission.findById(req.params.submissionId).populate('projectId', 'companyId').lean();
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    if (req.user.role === 'company' && submission.projectId?.companyId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can review submissions only for your own projects' });
    }

    const updated = await Submission.findByIdAndUpdate(
      submission._id,
      { status, feedback, feedbackScore, starRating, reviewedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
    return res.json({ ...updated, id: updated._id });
  } catch (error) { next(error); }
}
