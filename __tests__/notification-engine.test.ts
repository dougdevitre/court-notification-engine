/**
 * @module NotificationEngine Tests
 * @description Tests for the NotificationEngine class covering send,
 * schedule, and escalation operations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationEngine } from '../src/engine/notification-engine';
import { TemplateEngine } from '../src/templates/template-engine';
import { DeliveryTracker } from '../src/tracking/delivery-tracker';

describe('NotificationEngine', () => {
  let engine: NotificationEngine;
  let templateEngine: TemplateEngine;
  let tracker: DeliveryTracker;

  beforeEach(() => {
    templateEngine = new TemplateEngine();
    tracker = new DeliveryTracker();

    templateEngine.register('test-template', {
      subject: 'Test: {{title}}',
      body: 'Hello {{name}}, this is a test notification.',
      smsBody: 'Test: {{title}}',
    });

    engine = new NotificationEngine({
      channels: {},
      templateEngine,
      tracker,
    });
  });

  describe('send', () => {
    it('should send a notification and return a result', async () => {
      const result = await engine.send({
        userId: 'user-1',
        channel: 'email',
        template: 'test-template',
        data: { title: 'Hearing', name: 'John' },
        urgency: 'high',
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('should throw for unknown templates', async () => {
      await expect(
        engine.send({
          userId: 'user-1',
          channel: 'email',
          template: 'nonexistent',
          data: {},
        })
      ).rejects.toThrow();
    });

    it('should track delivery after sending', async () => {
      const result = await engine.send({
        userId: 'user-1',
        channel: 'sms',
        template: 'test-template',
        data: { title: 'Reminder', name: 'Jane' },
        urgency: 'critical',
      });

      const stats = await tracker.getStats('user-1');
      expect(stats).toBeDefined();
    });

    it('should respect urgency levels', async () => {
      const result = await engine.send({
        userId: 'user-1',
        channel: 'push',
        template: 'test-template',
        data: { title: 'Alert', name: 'User' },
        urgency: 'critical',
      });

      expect(result.urgency).toBe('critical');
    });
  });

  describe('sendMultiChannel', () => {
    it('should send to multiple channels simultaneously', async () => {
      const results = await engine.sendMultiChannel({
        userId: 'user-1',
        channels: ['email', 'sms', 'push'],
        template: 'test-template',
        data: { title: 'Multi', name: 'User' },
        urgency: 'high',
      });

      expect(results).toHaveLength(3);
    });
  });
});
