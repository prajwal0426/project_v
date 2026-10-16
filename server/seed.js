
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';

// Load server/.env when this script is in server/scripts/
dotenv.config({
  path: fileURLToPath(new URL('./.env', import.meta.url))
});

// IMPORTANT: Adjust this import to the actual file containing
// the Mongoose models you shared.
import {
  User,
  Company,
  Project,
  Submission,
  Ranking,
  Wallet,
  Transaction,
  Notification,
  AuditLog,
  PasswordReset
} from './src/models/index.js'; // Adjust the path as necessary 

async function seedDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing from server/.env');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Demo-only credentials. Never use these in production.
  const userPasswordHash = await bcrypt.hash('Vertex@123', 12);
  const companyPasswordHash = await bcrypt.hash(
    'Vertex@123',
    12
  );

  const legalConsent = {
    privacyPolicyAccepted: true,
    termsAccepted: true,
    ageConfirmed: true,
    legalAcceptedAt: new Date(),
    privacyPolicyVersion: 'demo-v1',
    termsVersion: 'demo-v1'
  };

  // 1. Users
  const user1 = await User.findOneAndUpdate(
    { email: 'vertex@test.com' },
    {
      $set: {
        name: 'Prajwal',
        passwordHash: userPasswordHash,
        dateOfBirth: new Date('2002-05-15'),
        role: 'user',
        ...legalConsent
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  const user2 = await User.findOneAndUpdate(
    { email: 'demo.user2@example.com' },
    {
      $set: {
        name: 'Demo User Two',
        passwordHash: userPasswordHash,
        dateOfBirth: new Date('2003-08-20'),
        role: 'user',
        ...legalConsent
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  // 2. Company
  const company = await Company.findOneAndUpdate(
    { email: 'vertex@company.com' },
    {
      $set: {
        name: 'Vertex Demo Technologies',
        passwordHash: companyPasswordHash,
        profile: 'Sample company for testing VERTEX projects.',
        status: 'approved',
        role: 'company',
        ...legalConsent
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  // 3. Projects
  const project1 = await Project.findOneAndUpdate(
    {
      companyId: company._id,
      title: 'Portfolio Website',
    },
    {
      $set: {
        description: 'Build a responsive portfolio website.',
        difficulty: 'easy',
        coinReward: 100,
        budgetInr: 500,
        rewardPoolInr: 500,
        bonusInr: 0,
        paymentInr: 500,
        status: 'open'
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  const project2 = await Project.findOneAndUpdate(
    {
      companyId: company._id,
      title: 'Secure Login API',
    },
    {
      $set: {
        description: 'Build and test a secure authentication API.',
        difficulty: 'medium',
        coinReward: 250,
        budgetInr: 1500,
        rewardPoolInr: 1500,
        bonusInr: 100,
        paymentInr: 1500,
        status: 'open'
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  // 4. Project submissions
  const submission = await Submission.findOneAndUpdate(
    { projectId: project1._id, userId: user1._id },
    {
      $set: {
        fileUrl: 'https://example.com/demo-portfolio',
        status: 'approved',
        feedback: 'Good layout and responsive design.',
        feedbackScore: 90,
        starRating: 5,
        submittedAt: new Date(),
        reviewedAt: new Date()
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  // 5. Monthly ranking
  const month = new Date();
  month.setUTCDate(1);
  month.setUTCHours(0, 0, 0, 0);

  await Ranking.findOneAndUpdate(
    { userId: user1._id, month },
    {
      $set: {
        projectsCompleted: 1,
        feedbackScore: 90,
        starRating: 5,
        difficultyScore: 10,
        totalScore: 105,
        badge: 'Bronze'
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  await Ranking.findOneAndUpdate(
    { userId: user2._id, month },
    {
      $set: {
        projectsCompleted: 0,
        feedbackScore: 0,
        starRating: 0,
        difficultyScore: 0,
        totalScore: 0,
        badge: 'Bronze'
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  // 6. Wallets — INR monetary amounts are stored in paise.
  await Wallet.findOneAndUpdate(
    { userId: user1._id },
    {
      $set: {
        coinBalance: 150,
        inrBalancePaise: 125000,
        pendingInrBalancePaise: 0
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  await Wallet.findOneAndUpdate(
    { userId: user2._id },
    {
      $set: {
        coinBalance: 50,
        inrBalancePaise: 0,
        pendingInrBalancePaise: 0
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  await Wallet.findOneAndUpdate(
    { companyId: company._id },
    {
      $set: {
        coinBalance: 0,
        inrBalancePaise: 500000,
        pendingInrBalancePaise: 0
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  // 7. Example transaction. This is a test record, not a real payment.
  await Transaction.findOneAndUpdate(
    { idempotencyKey: 'vertex-demo-seed-transaction-001' },
    {
      $set: {
        userId: user1._id,
        type: 'demo_credit',
        coinAmount: 50,
        inrAmountPaise: 10000,
        provider: 'demo',
        providerReference: 'vertex-demo-reference-001',
        status: 'completed'
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  // 8. Notifications
  await Notification.findOneAndUpdate(
    { userId: user1._id, title: 'Welcome to VERTEX Demo' },
    {
      $set: {
        body: 'Your demo account is ready. Explore the sample projects.',
        isRead: false
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  // 9. Audit log — synthetic development-only record.
  await AuditLog.findOneAndUpdate(
    {
      adminId: 'seed-script',
      targetId: user1._id,
      action: 'DEMO_SEED',
      reason: 'Development test data'
    },
    {
      $set: {
        targetType: 'User',
        metadata: { source: 'seed-script' }
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  // 10. Expiring password-reset test record.
  // No usable reset token is generated.
  await PasswordReset.findOneAndUpdate(
    {
      targetId: user2._id,
      targetType: 'User',
      requestedBy: 'seed-script'
    },
    {
      $set: {
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: new Date(),
        tokenHash: undefined
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  console.log('Demo data inserted or updated successfully.');
  console.log({
    users: 2,
    companies: 1,
    projects: 2,
    submissions: 1,
    rankings: 2,
    wallets: 3,
    transactions: 1,
    notifications: 1,
    auditLogs: 1,
    passwordResetRecords: 1
  });
  console.log('Demo user email: demo.user1@example.com');
  console.log('Demo password: VertexDemo@123');
  console.log('Demo company email: demo.company@example.com');
  console.log('Demo company password: VertexCompany@123');
  console.log('Submission ID:', submission._id.toString());
}

seedDatabase()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
