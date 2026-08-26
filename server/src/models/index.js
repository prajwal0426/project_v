import mongoose from 'mongoose';

const legalConsent = {
  privacyPolicyAccepted: { type: Boolean, default: false },
  termsAccepted: { type: Boolean, default: false },
  ageConfirmed: { type: Boolean, default: false },
  legalAcceptedAt: { type: Date },
  privacyPolicyVersion: { type: String, default: '' },
  termsVersion: { type: String, default: '' }
};

const accountControl = {
  accountStatus: { type: String, enum: ['ACTIVE', 'BLOCKED', 'RESTRICTED', 'SUSPENDED'], default: 'ACTIVE' },
  blockedAt: Date,
  blockedBy: String,
  restrictedAt: Date,
  restrictedBy: String,
  restrictionData: { type: Map, of: Boolean, default: {} },
  suspendedAt: Date,
  suspendedBy: String,
  suspensionReason: String,
  suspensionUntil: Date,
  tokenVersion: { type: Number, default: 0 },
  lastLoginAt: Date,
  passwordResetRequestedAt: Date
};

// ─── User ────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 160 },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    governmentIdFile: String,
    idVerificationStatus: { type: String, default: 'pending' },
    role: { type: String, default: 'user' },
    ...legalConsent,
    ...accountControl
  },
  { timestamps: true }
);

// ─── Company ─────────────────────────────────────────────────────────────────
const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 180 },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    verificationFile: String,
    profile: String,
    status: { type: String, default: 'pending' },
    role: { type: String, default: 'company' },
    ...legalConsent,
    ...accountControl
  },
  { timestamps: true }
);

// ─── Project ──────────────────────────────────────────────────────────────────
const projectSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    title: { type: String, required: true, maxlength: 180 },
    description: String,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    coinReward: { type: Number, default: 0 },
    budgetInr: { type: Number, default: 0 },
    rewardPoolInr: { type: Number, default: 0 },
    bonusInr: { type: Number, default: 0 },
    paymentInr: { type: Number, default: 0 },
    status: { type: String, default: 'open' }
  },
  { timestamps: true }
);

// ─── Submission ───────────────────────────────────────────────────────────────
const submissionSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: String,
    status: { type: String, default: 'submitted' },
    feedback: String,
    feedbackScore: { type: Number, default: 0 },
    starRating: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: Date
  },
  { timestamps: true }
);

// ─── Ranking ─────────────────────────────────────────────────────────────────
const rankingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Date, required: true },
    projectsCompleted: { type: Number, default: 0 },
    feedbackScore: { type: Number, default: 0 },
    starRating: { type: Number, default: 0 },
    difficultyScore: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    badge: { type: String, default: 'Bronze' }
  },
  { timestamps: true }
);
rankingSchema.index({ userId: 1, month: 1 }, { unique: true });

// ─── Wallet ──────────────────────────────────────────────────────────────────
const walletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', unique: true, sparse: true },
    coinBalance: { type: Number, default: 0 },
    inrBalance: { type: Number, default: 0 },
    pendingInrBalance: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// ─── Transaction ─────────────────────────────────────────────────────────────
const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    type: { type: String, required: true },
    coinAmount: { type: Number, default: 0 },
    inrAmount: { type: Number, default: 0 },
    provider: { type: String, default: 'paypal' },
    providerReference: String,
    status: { type: String, default: 'pending' }
  },
  { timestamps: true }
);

// ─── Notification ─────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    title: { type: String, required: true, maxlength: 180 },
    body: String,
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// ─── AdminAuditLog ────────────────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema(
  {
    adminId: { type: String, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetType: { type: String, required: true },
    action: { type: String, required: true },
    reason: String,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// ─── PasswordResetRequest ─────────────────────────────────────────────────────
const passwordResetSchema = new mongoose.Schema(
  {
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetType: { type: String, required: true },
    requestedBy: { type: String, required: true },
    tokenHash: String,
    expiresAt: { type: Date, required: true },
    usedAt: Date
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
export const Company = mongoose.model('Company', companySchema);
export const Project = mongoose.model('Project', projectSchema);
export const Submission = mongoose.model('Submission', submissionSchema);
export const Ranking = mongoose.model('Ranking', rankingSchema);
export const Wallet = mongoose.model('Wallet', walletSchema);
export const Transaction = mongoose.model('Transaction', transactionSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);
