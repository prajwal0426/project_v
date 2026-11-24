import test from 'node:test';
import assert from 'node:assert/strict';
import {
  broadcastExpiry,
  individualExpiry,
  isNotificationVisible,
  notificationQueryForRecipient
} from '../src/services/notification.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

test('broadcast expiration is exactly 24 hours after creation', () => {
  const createdAt = new Date('2026-11-22T10:00:00.000Z');
  assert.equal(broadcastExpiry(createdAt).toISOString(), '2026-11-23T10:00:00.000Z');
  assert.equal(broadcastExpiry(createdAt).getTime() - createdAt.getTime(), DAY_MS);
});

test('an unread individual notification never expires based on send time', () => {
  const now = new Date('2026-11-30T10:00:00.000Z');
  const notification = { type: 'individual', createdAt: new Date('2026-11-22T10:00:00.000Z'), viewedAt: null, expiresAt: null };
  assert.equal(isNotificationVisible(notification, now), true);
});

test('an individual notification expires exactly 24 hours after first view', () => {
  const viewedAt = new Date('2026-11-27T15:00:00.000Z');
  const expiresAt = individualExpiry(viewedAt);
  assert.equal(expiresAt.toISOString(), '2026-11-28T15:00:00.000Z');
  assert.equal(isNotificationVisible({ type: 'individual', viewedAt, expiresAt }, expiresAt), false);
  assert.equal(isNotificationVisible({ type: 'individual', viewedAt, expiresAt }, new Date(expiresAt.getTime() - 1)), true);
});

test('expired broadcasts and admin-deleted notifications are not visible', () => {
  const now = new Date('2026-11-23T10:00:00.000Z');
  assert.equal(isNotificationVisible({ type: 'broadcast', expiresAt: now }, now), false);
  assert.equal(isNotificationVisible({ type: 'individual', deletedAt: new Date() }, now), false);
});

test('recipient query scopes broadcasts and individual records to the role and id', () => {
  const query = notificationQueryForRecipient('user', '507f1f77bcf86cd799439011', new Date('2026-11-22T00:00:00.000Z'));
  assert.equal(query.deletedAt, null);
  assert.equal(query.$or[0].type, 'broadcast');
  assert.equal(query.$or[0].audienceRoles, 'user');
  assert.equal(String(query.$or[1].recipientId), '507f1f77bcf86cd799439011');
  assert.equal(query.$or[2].userId.toString(), '507f1f77bcf86cd799439011');
});
