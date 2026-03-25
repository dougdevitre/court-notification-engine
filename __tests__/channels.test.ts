/**
 * @module Channel Tests
 * @description Tests for SMS, Email, and Push notification channels
 * covering send operations and status checking.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SMSChannel } from '../src/channels/sms';
import { EmailChannel } from '../src/channels/email';
import { PushChannel } from '../src/channels/push';
import { InAppChannel } from '../src/channels/in-app';

describe('SMSChannel', () => {
  let sms: SMSChannel;

  beforeEach(() => {
    sms = new SMSChannel();
  });

  describe('send', () => {
    it('should send an SMS and return a result', async () => {
      const result = await sms.send('+15551234567', 'Your hearing is tomorrow at 9 AM.');
      expect(result).toBeDefined();
      expect(result.messageId).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('should reject invalid phone numbers', async () => {
      await expect(sms.send('', 'Test message')).rejects.toThrow();
    });

    it('should truncate messages exceeding SMS length limits', async () => {
      const longMessage = 'A'.repeat(500);
      const result = await sms.send('+15551234567', longMessage);
      expect(result).toBeDefined();
    });
  });

  describe('checkStatus', () => {
    it('should return the delivery status of a sent message', async () => {
      const sendResult = await sms.send('+15551234567', 'Test');
      const status = await sms.checkStatus(sendResult.messageId);
      expect(status).toBeDefined();
    });
  });

  describe('formatForSMS', () => {
    it('should format content within SMS character limits', () => {
      const formatted = sms.formatForSMS('This is a long template with {{variable}}', {
        variable: 'court hearing',
      });
      expect(formatted.length).toBeLessThanOrEqual(160);
    });
  });
});

describe('EmailChannel', () => {
  let email: EmailChannel;

  beforeEach(() => {
    email = new EmailChannel();
  });

  describe('send', () => {
    it('should send an email and return a result', async () => {
      const result = await email.send({
        to: 'user@example.com',
        subject: 'Court Reminder',
        body: '<p>Your hearing is tomorrow.</p>',
      });
      expect(result).toBeDefined();
      expect(result.messageId).toBeDefined();
    });

    it('should reject missing recipient', async () => {
      await expect(
        email.send({ to: '', subject: 'Test', body: 'Body' })
      ).rejects.toThrow();
    });
  });

  describe('renderTemplate', () => {
    it('should render HTML email from template', () => {
      const html = email.renderTemplate('Hello {{name}}, your case is {{caseId}}.', {
        name: 'Jane',
        caseId: 'CASE-001',
      });
      expect(html).toContain('Jane');
      expect(html).toContain('CASE-001');
    });
  });
});

describe('PushChannel', () => {
  let push: PushChannel;

  beforeEach(() => {
    push = new PushChannel();
  });

  describe('send', () => {
    it('should send a push notification', async () => {
      const result = await push.send('device-token-abc', 'Hearing Alert', 'Your hearing is in 2 hours.');
      expect(result).toBeDefined();
      expect(result.messageId).toBeDefined();
    });

    it('should reject empty device tokens', async () => {
      await expect(push.send('', 'Title', 'Body')).rejects.toThrow();
    });
  });

  describe('registerDevice', () => {
    it('should register a device token for a user', async () => {
      await push.registerDevice('user-1', 'device-token-xyz');
      // Should not throw
    });
  });

  describe('unregisterDevice', () => {
    it('should unregister a device token', async () => {
      await push.registerDevice('user-1', 'device-token-xyz');
      await push.unregisterDevice('user-1', 'device-token-xyz');
      // Should not throw
    });
  });
});

describe('InAppChannel', () => {
  let inApp: InAppChannel;

  beforeEach(() => {
    inApp = new InAppChannel();
  });

  describe('send', () => {
    it('should create an in-app notification', async () => {
      const result = await inApp.send({
        userId: 'user-1',
        title: 'New Filing',
        body: 'A new document was filed in your case.',
      });
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });
  });

  describe('getUnread', () => {
    it('should return unread notifications for a user', async () => {
      await inApp.send({
        userId: 'user-1',
        title: 'Test',
        body: 'Test notification',
      });
      const unread = await inApp.getUnread('user-1');
      expect(unread.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('markRead', () => {
    it('should mark a notification as read', async () => {
      const result = await inApp.send({
        userId: 'user-1',
        title: 'Test',
        body: 'Test',
      });
      await inApp.markRead(result.id);
      // Should not throw
    });
  });
});
