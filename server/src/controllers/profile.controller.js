import { Company, User } from '../models/index.js';

function profileModel(role) {
  return role === 'company' ? Company : role === 'user' ? User : null;
}

function serializeProfile(account, role) {
  return {
    id: account._id,
    name: account.name,
    email: account.email,
    role,
    accountStatus: account.accountStatus || 'ACTIVE',
    createdAt: account.createdAt
  };
}

export async function getProfile(req, res, next) {
  try {
    const Model = profileModel(req.user.role);
    if (!Model) return res.status(403).json({ message: 'Profile is not available for this account' });
    const account = await Model.findById(req.user.id).select('name email accountStatus createdAt').lean();
    if (!account) return res.status(404).json({ message: 'Account not found' });
    return res.json({ profile: serializeProfile(account, req.user.role) });
  } catch (error) {
    return next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const Model = profileModel(req.user.role);
    if (!Model) return res.status(403).json({ message: 'Profile is not available for this account' });
    const name = String(req.body?.name || '').trim();
    if (!name || name.length > 160) {
      return res.status(422).json({ message: 'Name must be between 1 and 160 characters' });
    }
    const account = await Model.findByIdAndUpdate(
      req.user.id,
      { $set: { name } },
      { new: true, runValidators: true, select: 'name email accountStatus createdAt' }
    ).lean();
    if (!account) return res.status(404).json({ message: 'Account not found' });
    return res.json({ profile: serializeProfile(account, req.user.role) });
  } catch (error) {
    return next(error);
  }
}
