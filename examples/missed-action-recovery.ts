/**
 * @example Missed Action Recovery Flow
 * @description Demonstrates the recovery flow when a user misses a court
 * deadline, including analysis, suggested recovery actions, and creating
 * a recovery plan.
 */

import { RecoveryAdvisor } from '../src/recovery/recovery-advisor';
import { NotificationEngine } from '../src/engine/notification-engine';
import { DeliveryTracker } from '../src/tracking/delivery-tracker';
import { TemplateEngine } from '../src/templates/template-engine';

async function main(): Promise<void> {
  const tracker = new DeliveryTracker();
  const templateEngine = new TemplateEngine();
  const engine = new NotificationEngine({
    channels: {},
    templateEngine,
    tracker,
  });

  const advisor = new RecoveryAdvisor({ tracker });

  // Register recovery notification templates
  templateEngine.register('missed-deadline-alert', {
    subject: 'URGENT: Missed Deadline for Case {{caseNumber}}',
    body: 'You have missed the deadline for "{{actionName}}" in case {{caseNumber}}. The deadline was {{deadline}}. Please take immediate action.',
    smsBody: 'URGENT: Missed deadline for {{actionName}} in case {{caseNumber}}. Take action now.',
  });

  templateEngine.register('recovery-plan', {
    subject: 'Recovery Plan: Case {{caseNumber}}',
    body: 'A recovery plan has been created for your missed deadline in case {{caseNumber}}.\n\nSteps:\n{{#each steps}}\n{{@index}}. {{this.action}} (Due: {{this.dueDate}})\n{{/each}}',
  });

  console.log('--- Missed Action Recovery Flow ---\n');

  // Simulate a missed deadline
  const missedAction = {
    userId: 'user-123',
    caseId: 'CIV-2024-00789',
    actionName: 'File Answer to Complaint',
    deadline: new Date('2024-03-15'),
    missedAt: new Date('2024-03-16'),
  };

  // 1. Analyze the situation
  console.log('1. Analyzing missed deadline...');
  const analysis = await advisor.analyze({
    userId: missedAction.userId,
    caseId: missedAction.caseId,
    missedAction: missedAction.actionName,
    originalDeadline: missedAction.deadline,
  });
  console.log('   Severity:', analysis.severity);
  console.log('   Can recover:', analysis.canRecover);
  console.log('   Time since missed:', analysis.timeSinceMissed);

  // 2. Get recovery suggestions
  console.log('\n2. Getting recovery suggestions...');
  const suggestions = await advisor.suggest({
    userId: missedAction.userId,
    caseId: missedAction.caseId,
    missedAction: missedAction.actionName,
    jurisdiction: 'CA',
  });
  console.log('   Suggestions:');
  for (const suggestion of suggestions) {
    console.log(`   - ${suggestion.action} (urgency: ${suggestion.urgency})`);
  }

  // 3. Create a recovery plan
  console.log('\n3. Creating recovery plan...');
  const plan = await advisor.createPlan({
    userId: missedAction.userId,
    caseId: missedAction.caseId,
    suggestions,
  });
  console.log('   Plan ID:', plan.id);
  console.log('   Steps:', plan.steps.length);

  // 4. Send urgent recovery notification
  console.log('\n4. Sending recovery notifications...');
  await engine.send({
    userId: missedAction.userId,
    channel: 'sms',
    template: 'missed-deadline-alert',
    data: {
      caseNumber: missedAction.caseId,
      actionName: missedAction.actionName,
      deadline: missedAction.deadline.toLocaleDateString(),
    },
    urgency: 'critical',
    caseId: missedAction.caseId,
    eventType: 'deadline-approaching',
  });
  console.log('   Sent critical SMS alert');

  await engine.send({
    userId: missedAction.userId,
    channel: 'email',
    template: 'recovery-plan',
    data: {
      caseNumber: missedAction.caseId,
      steps: plan.steps,
    },
    urgency: 'high',
    caseId: missedAction.caseId,
  });
  console.log('   Sent recovery plan via email');

  console.log('\nRecovery flow complete.');
}

main().catch(console.error);
