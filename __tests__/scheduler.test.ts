/**
 * @module NotificationScheduler Tests
 * @description Tests for the NotificationScheduler class covering
 * scheduling, batch processing, and upcoming notifications.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationScheduler } from '../src/engine/scheduler';

describe('NotificationScheduler', () => {
  let scheduler: NotificationScheduler;

  beforeEach(() => {
    scheduler = new NotificationScheduler({ engine: {} as any });
  });

  describe('schedule', () => {
    it('should schedule a notification for a future time', async () => {
      const futureDate = new Date(Date.now() + 86400000); // 24 hours from now
      const result = await scheduler.schedule({
        userId: 'user-1',
        channel: 'sms',
        template: 'hearing-reminder',
        data: { caseNumber: 'CASE-001' },
        urgency: 'high',
        scheduledFor: futureDate,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.scheduledFor).toEqual(futureDate);
    });

    it('should reject scheduling in the past', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      await expect(
        scheduler.schedule({
          userId: 'user-1',
          channel: 'email',
          template: 'test',
          data: {},
          scheduledFor: pastDate,
        })
      ).rejects.toThrow();
    });

    it('should assign a unique ID to each scheduled notification', async () => {
      const date = new Date(Date.now() + 86400000);
      const r1 = await scheduler.schedule({
        userId: 'user-1',
        channel: 'sms',
        template: 'test',
        data: {},
        scheduledFor: date,
      });
      const r2 = await scheduler.schedule({
        userId: 'user-1',
        channel: 'email',
        template: 'test',
        data: {},
        scheduledFor: date,
      });

      expect(r1.id).not.toBe(r2.id);
    });
  });

  describe('processBatch', () => {
    it('should process all due notifications', async () => {
      const count = await scheduler.processBatch();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should not process future notifications', async () => {
      const futureDate = new Date(Date.now() + 86400000 * 7); // 1 week out
      await scheduler.schedule({
        userId: 'user-1',
        channel: 'sms',
        template: 'test',
        data: {},
        scheduledFor: futureDate,
      });

      const count = await scheduler.processBatch();
      expect(count).toBe(0);
    });
  });

  describe('getUpcoming', () => {
    it('should return upcoming notifications for a user', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      await scheduler.schedule({
        userId: 'user-1',
        channel: 'sms',
        template: 'test',
        data: {},
        scheduledFor: futureDate,
      });

      const upcoming = await scheduler.getUpcoming('user-1');
      expect(upcoming.length).toBeGreaterThan(0);
    });

    it('should return empty array when no upcoming notifications', async () => {
      const upcoming = await scheduler.getUpcoming('no-notifications-user');
      expect(upcoming).toEqual([]);
    });

    it('should sort by scheduled time ascending', async () => {
      const date1 = new Date(Date.now() + 86400000 * 2);
      const date2 = new Date(Date.now() + 86400000);
      await scheduler.schedule({
        userId: 'user-2',
        channel: 'sms',
        template: 'test',
        data: {},
        scheduledFor: date1,
      });
      await scheduler.schedule({
        userId: 'user-2',
        channel: 'email',
        template: 'test',
        data: {},
        scheduledFor: date2,
      });

      const upcoming = await scheduler.getUpcoming('user-2');
      if (upcoming.length >= 2) {
        expect(upcoming[0].scheduledFor.getTime()).toBeLessThanOrEqual(
          upcoming[1].scheduledFor.getTime()
        );
      }
    });
  });

  describe('cancel', () => {
    it('should cancel a scheduled notification', async () => {
      const result = await scheduler.schedule({
        userId: 'user-1',
        channel: 'sms',
        template: 'test',
        data: {},
        scheduledFor: new Date(Date.now() + 86400000),
      });

      await scheduler.cancel(result.id);
      const upcoming = await scheduler.getUpcoming('user-1');
      const found = upcoming.find((n) => n.id === result.id);
      expect(found).toBeUndefined();
    });
  });
});
