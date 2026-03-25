/**
 * @example Multi-Channel Hearing Notification
 * @description Demonstrates sending a hearing reminder across multiple
 * channels (SMS, email, push, in-app) with escalation when unacknowledged.
 */

import { NotificationEngine } from '../src/engine/notification-engine';
import { NotificationScheduler } from '../src/engine/scheduler';
import { EscalationManager } from '../src/engine/escalation';
import { SMSChannel } from '../src/channels/sms';
import { EmailChannel } from '../src/channels/email';
import { PushChannel } from '../src/channels/push';
import { InAppChannel } from '../src/channels/in-app';
import { TemplateEngine } from '../src/templates/template-engine';
import { DeliveryTracker } from '../src/tracking/delivery-tracker';

async function main(): Promise<void> {
  // Set up notification channels
  const sms = new SMSChannel();
  const email = new EmailChannel();
  const push = new PushChannel();
  const inApp = new InAppChannel();
  const tracker = new DeliveryTracker();
  const templateEngine = new TemplateEngine();

  // Register a hearing reminder template
  templateEngine.register('hearing-reminder', {
    subject: 'Court Hearing Reminder: {{caseNumber}}',
    body: 'Your hearing for case {{caseNumber}} is scheduled for {{hearingDate}} at {{hearingTime}} in {{courtroom}}. Please arrive 15 minutes early.',
    smsBody: 'HEARING REMINDER: Case {{caseNumber}} on {{hearingDate}} at {{hearingTime}}, {{courtroom}}. Arrive 15 min early.',
  });

  // Set up the notification engine
  const engine = new NotificationEngine({
    channels: { sms, email, push, inApp },
    templateEngine,
    tracker,
  });

  // Define hearing data
  const hearingData = {
    caseNumber: 'FAM-2024-00456',
    hearingDate: 'March 28, 2024',
    hearingTime: '9:00 AM',
    courtroom: 'Courtroom 302, Family Court Building',
    judgeName: 'Hon. Sarah Mitchell',
  };

  // Send notifications across multiple channels
  console.log('--- Sending Multi-Channel Hearing Notifications ---\n');

  // 1. Send in-app notification immediately
  const inAppResult = await engine.send({
    userId: 'user-789',
    channel: 'in-app',
    template: 'hearing-reminder',
    data: hearingData,
    urgency: 'high',
    caseId: 'FAM-2024-00456',
    eventType: 'hearing-scheduled',
  });
  console.log('In-app notification:', inAppResult.status);

  // 2. Send push notification
  const pushResult = await engine.send({
    userId: 'user-789',
    channel: 'push',
    template: 'hearing-reminder',
    data: hearingData,
    urgency: 'high',
    caseId: 'FAM-2024-00456',
    eventType: 'hearing-scheduled',
  });
  console.log('Push notification:', pushResult.status);

  // 3. Send email
  const emailResult = await engine.send({
    userId: 'user-789',
    channel: 'email',
    template: 'hearing-reminder',
    data: hearingData,
    urgency: 'high',
    caseId: 'FAM-2024-00456',
    eventType: 'hearing-scheduled',
  });
  console.log('Email notification:', emailResult.status);

  // 4. Schedule SMS reminder for 24 hours before
  const scheduler = new NotificationScheduler({ engine });
  const scheduledSms = await scheduler.schedule({
    userId: 'user-789',
    channel: 'sms',
    template: 'hearing-reminder',
    data: hearingData,
    urgency: 'critical',
    caseId: 'FAM-2024-00456',
    eventType: 'hearing-scheduled',
    scheduledFor: new Date('2024-03-27T09:00:00'),
  });
  console.log('\nScheduled SMS for 24h before:', scheduledSms.id);

  // Set up escalation chain if unacknowledged
  const escalation = new EscalationManager({ engine, tracker });
  await escalation.createChain({
    notificationId: inAppResult.id,
    userId: 'user-789',
    steps: [
      { channel: 'push', delayMinutes: 60, urgency: 'high' },
      { channel: 'sms', delayMinutes: 180, urgency: 'critical' },
      { channel: 'email', delayMinutes: 360, urgency: 'critical' },
    ],
  });
  console.log('\nEscalation chain created for unacknowledged notifications');

  // Check delivery stats
  const stats = await tracker.getStats('user-789');
  console.log('\nDelivery stats:', stats);
}

main().catch(console.error);
