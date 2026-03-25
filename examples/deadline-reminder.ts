/**
 * @example Deadline Reminder with Escalation
 * @description Demonstrates setting up hearing reminders with an escalation
 * chain that sends progressively urgent reminders as the hearing date
 * approaches. Also shows recovery suggestions for missed hearings.
 *
 * Run: npx ts-node examples/deadline-reminder.ts
 */

import {
  NotificationEngine,
  EscalationManager,
  TemplateEngine,
  DeliveryTracker,
  RecoveryAdvisor,
} from '../src';

// ── 1. Set up the template engine ───────────────────────────────────

const templates = new TemplateEngine();

templates.register('hearing-reminder-7day', {
  subject: 'Reminder: Court Hearing in 7 Days — {{caseName}}',
  body:
    'Hello {{name}},\n\n' +
    'This is a reminder that you have a court hearing in 7 days.\n\n' +
    'Date: {{date}}\n' +
    'Time: {{time}}\n' +
    'Location: {{courtroom}}\n\n' +
    'What to bring:\n' +
    '- Photo ID\n' +
    '- All documents related to your case\n' +
    '- Any evidence you want the judge to see\n\n' +
    'Need help preparing? Contact legal aid: {{legalAidPhone}}',
  smsBody: 'Court hearing in 7 days: {{date}} at {{time}}, {{courtroom}}. Bring ID + documents.',
});

templates.register('hearing-reminder-1day', {
  subject: 'TOMORROW: Court Hearing — {{caseName}}',
  body:
    'Hello {{name}},\n\n' +
    'Your court hearing is TOMORROW.\n\n' +
    'Date: {{date}}\n' +
    'Time: {{time}}\n' +
    'Location: {{courtroom}}\n\n' +
    'Arrive 15 minutes early. Bring your ID and all case documents.',
  smsBody: 'TOMORROW: Court hearing at {{time}}, {{courtroom}}. Arrive 15 min early with ID.',
});

templates.register('hearing-reminder-today', {
  subject: 'TODAY: Court Hearing in {{hoursUntil}} Hours',
  body:
    'Your court hearing is TODAY at {{time}} in {{courtroom}}.\n' +
    'Leave now to arrive on time.',
  smsBody: 'TODAY: Hearing at {{time}}, {{courtroom}}. Leave now!',
});

// ── 2. Set up escalation ────────────────────────────────────────────

const escalation = new EscalationManager();

const hearingDate = new Date();
hearingDate.setDate(hearingDate.getDate() + 7); // 7 days from now
hearingDate.setHours(9, 0, 0, 0);

const chain = escalation.createChain({
  eventId: 'hearing-2024-001',
  eventDate: hearingDate,
  userId: 'user-123',
  caseId: 'case-eviction-456',
  reminders: [
    { daysBefore: 7, channel: 'email', template: 'hearing-reminder-7day', urgency: 'medium' },
    { daysBefore: 3, channel: 'sms', template: 'hearing-reminder-3day', urgency: 'high' },
    { daysBefore: 1, channel: 'sms', template: 'hearing-reminder-1day', urgency: 'high' },
    { daysBefore: 0, channel: 'push', template: 'hearing-reminder-today', urgency: 'critical' },
  ],
});

console.log('=== Escalation Chain Created ===');
console.log(`Chain ID: ${chain.id}`);
console.log(`Event: hearing-2024-001`);
console.log(`Hearing date: ${hearingDate.toISOString()}`);
console.log(`Reminder steps: ${chain.config.reminders.length}`);

// ── 3. Simulate sending reminders ───────────────────────────────────

const engine = new NotificationEngine({
  defaultChannel: 'sms',
  timezone: 'America/Chicago',
});

const tracker = new DeliveryTracker();

// Render the 7-day reminder
const rendered = templates.render('hearing-reminder-7day', {
  name: 'Jane',
  caseName: 'Smith v. Landlord',
  date: hearingDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
  time: '9:00 AM',
  courtroom: 'Room 302, Municipal Court',
  legalAidPhone: '1-800-LEGAL-AID',
});

console.log('\n=== 7-Day Reminder (Email) ===');
console.log(`Subject: ${rendered.subject}`);
console.log(`Body:\n${rendered.body}`);
console.log(`SMS: ${rendered.smsBody}`);

// ── 4. Simulate a missed hearing ────────────────────────────────────

console.log('\n=== Recovery Suggestion (Missed Hearing) ===');
const advisor = new RecoveryAdvisor();
const recovery = advisor.getSuggestion('hearing-scheduled', {
  caseType: 'eviction',
  daysMissedBy: 1,
});

console.log(`Missed: ${recovery.missedAction}`);
console.log(`Urgency: ${recovery.urgency}`);
console.log(`Suggestion: ${recovery.suggestion}`);
console.log('Resources:');
for (const resource of recovery.resources) {
  console.log(`  - ${resource.title}: ${resource.url}`);
}

// ── 5. Delivery tracking ────────────────────────────────────────────

tracker.recordSent('notif-001', 'user-123', 'email', 'ses-msg-abc');
tracker.recordDelivered('notif-001');
tracker.recordOpened('notif-001');
tracker.recordSent('notif-002', 'user-123', 'sms', 'twilio-msg-xyz');
tracker.recordDelivered('notif-002');

console.log('\n=== Delivery Stats ===');
const stats = tracker.getStats('user-123');
console.log(`Total sent: ${stats.total}`);
console.log(`Delivered: ${stats.delivered}`);
console.log(`Opened: ${stats.opened}`);
console.log(`Acknowledged: ${stats.acknowledged}`);
console.log(`Failed: ${stats.failed}`);
