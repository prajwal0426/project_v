import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const money = {
  type: Number,
  default: 0,
  min: 0,
  set: (value) => Math.round(Number(value || 0) * 100) / 100
};

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
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
    passwordHash: { type: String, required: function passwordRequired() { return !this.googleSubject; }, select: false },
    googleSubject: { type: String, unique: true, sparse: true, select: false },
    legacyPostgresId: { type: String, unique: true, sparse: true, select: false },
    dateOfBirth: { type: Date, required: function dateOfBirthRequired() { return !this.googleSubject; } },
    governmentIdFile: String,
    idVerificationStatus: { type: String, default: 'pending' },
    role: { type: String, default: 'user' },
    ...legalConsent,
    ...accountControl
  },
  { timestamps: true }
);
userSchema.index({ accountStatus: 1, createdAt: -1 });

// ─── Company ─────────────────────────────────────────────────────────────────
const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 180 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
    passwordHash: { type: String, required: true, select: false },
    legacyPostgresId: { type: String, unique: true, sparse: true, select: false },
    verificationFile: String,
    profile: String,
    status: { type: String, default: 'pending' },
    role: { type: String, default: 'company' },
    ...legalConsent,
    ...accountControl
  },
  { timestamps: true }
);
companySchema.index({ accountStatus: 1, createdAt: -1 });

// ─── Project ──────────────────────────────────────────────────────────────────
const projectSchema = new mongoose.Schema(
  {
    companyId: { type: ObjectId, ref: 'Company', required: true, index: true },
    title: { type: String, required: true, maxlength: 180 },
    description: String,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    coinReward: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    budgetInr: money,
    rewardPoolInr: money,
    bonusInr: money,
    paymentInr: money,
    status: { type: String, enum: ['open', 'closed', 'draft'], default: 'open' },
    legacyPostgresId: { type: String, unique: true, sparse: true, select: false }
  },
  { timestamps: true }
);
projectSchema.index({ status: 1, createdAt: -1 });

// ─── Submission ───────────────────────────────────────────────────────────────
const submissionSchema = new mongoose.Schema(
  {
    projectId: { type: ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: ObjectId, ref: 'User', required: true, index: true },
    fileUrl: String,
    status: { type: String, enum: ['submitted', 'approved', 'rejected'], default: 'submitted' },
    feedback: String,
    feedbackScore: { type: Number, default: 0 },
    starRating: { type: Number, default: 0, min: 0, max: 5 },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: Date
  },
  { timestamps: true }
);
submissionSchema.index({ projectId: 1, userId: 1 }, { unique: true });
submissionSchema.index({ status: 1, reviewedAt: -1 });

// ─── Ranking ─────────────────────────────────────────────────────────────────
const rankingSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: 'User', required: true },
    month: { type: Date, required: true },
    projectsCompleted: { type: Number, default: 0 },
    feedbackScore: { type: Number, default: 0 },
    starRating: { type: Number, default: 0 },
    difficultyScore: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0, min: 0 },
    badge: { type: String, default: 'Bronze' }
  },
  { timestamps: true }
);
rankingSchema.index({ userId: 1, month: 1 }, { unique: true });
rankingSchema.index({ month: 1, totalScore: -1 });

// ─── Wallet ──────────────────────────────────────────────────────────────────
const walletSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: 'User', unique: true, sparse: true },
    companyId: { type: ObjectId, ref: 'Company', unique: true, sparse: true },
    coinBalance: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    // Monetary balances are stored in paise. Controllers expose INR decimals to the existing client API.
    inrBalancePaise: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    pendingInrBalancePaise: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    legacyPostgresId: { type: String, unique: true, sparse: true, select: false }
  },
  { timestamps: true }
);
walletSchema.pre('validate', function requireWalletOwner() {
  if (!this.userId && !this.companyId) {
    throw new Error('A wallet requires a user or company owner');
  }
});

// ─── Transaction ─────────────────────────────────────────────────────────────
const transactionSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: 'User', index: true },
    companyId: { type: ObjectId, ref: 'Company', index: true },
    type: { type: String, required: true },
    coinAmount: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    inrAmountPaise: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    provider: { type: String, default: 'paypal' },
    providerReference: { type: String, unique: true, sparse: true },
    idempotencyKey: { type: String, unique: true, sparse: true, select: false },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'], default: 'pending' },
    legacyPostgresId: { type: String, unique: true, sparse: true, select: false }
  },
  { timestamps: true }
);
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });

// ─── Notification ─────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['broadcast', 'individual'], default: 'individual', index: true },
    userId: { type: ObjectId, ref: 'User' },
    companyId: { type: ObjectId, ref: 'Company' },
    recipientId: { type: ObjectId },
    recipientRole: { type: String, enum: ['user', 'company'] },
    audienceRoles: [{ type: String, enum: ['user', 'company'] }],
    adminId: String,
    senderAdminId: String,
    title: { type: String, required: true, maxlength: 180 },
    body: { type: String, maxlength: 10000 },
    category: { type: String, default: 'general', maxlength: 80 },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    isRead: { type: Boolean, default: false },
    viewedAt: Date,
    expiresAt: Date,
    deletedAt: Date
  },
  { timestamps: true }
);
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ companyId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, recipientId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, audienceRoles: 1, expiresAt: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 });

const notificationReceiptSchema = new mongoose.Schema(
  {
    notificationId: { type: ObjectId, ref: 'Notification', required: true },
    recipientId: { type: ObjectId, required: true },
    recipientRole: { type: String, enum: ['user', 'company'], required: true },
    viewedAt: { type: Date, required: true, default: Date.now }
  },
  { timestamps: true }
);
notificationReceiptSchema.index({ notificationId: 1, recipientRole: 1, recipientId: 1 }, { unique: true });
notificationReceiptSchema.index({ recipientRole: 1, recipientId: 1, viewedAt: -1 });

const adminSessionSchema = new mongoose.Schema(
  {
    sessionIdHash: { type: String, required: true, unique: true, select: false },
    username: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: Date
  },
  { timestamps: true }
);
adminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ─── AdminAuditLog ────────────────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema(
  {
    adminId: { type: String, required: true },
    targetId: { type: ObjectId, required: true },
    targetType: { type: String, required: true },
    action: { type: String, required: true },
    reason: String,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

// ─── PasswordResetRequest ─────────────────────────────────────────────────────
const passwordResetSchema = new mongoose.Schema(
  {
    targetId: { type: ObjectId, required: true },
    targetType: { type: String, required: true },
    requestedBy: { type: String, required: true },
    tokenHash: String,
    expiresAt: { type: Date, required: true },
    usedAt: Date
  },
  { timestamps: true }
);
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const User = mongoose.model('User', userSchema);
export const Company = mongoose.model('Company', companySchema);
export const Project = mongoose.model('Project', projectSchema);
export const Submission = mongoose.model('Submission', submissionSchema);
export const Ranking = mongoose.model('Ranking', rankingSchema);
export const Wallet = mongoose.model('Wallet', walletSchema);
export const Transaction = mongoose.model('Transaction', transactionSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
export const NotificationReceipt = mongoose.model('NotificationReceipt', notificationReceiptSchema);
export const AdminSession = mongoose.model('AdminSession', adminSessionSchema);
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);
