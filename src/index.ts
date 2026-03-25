/**
 * @module @justice-os/notifications
 * @description Smart Court Notification Engine — multi-channel deadline reminders
 * with escalation chains and missed-action recovery.
 */

export { NotificationEngine } from './engine/notification-engine';
export { NotificationScheduler } from './engine/scheduler';
export { EscalationManager } from './engine/escalation';
export { SMSChannel } from './channels/sms';
export { EmailChannel } from './channels/email';
export { PushChannel } from './channels/push';
export { InAppChannel } from './channels/in-app';
export { TemplateEngine } from './templates/template-engine';
export { RecoveryAdvisor } from './recovery/recovery-advisor';
export { DeliveryTracker } from './tracking/delivery-tracker';

export type {
  NotificationChannel,
  UrgencyLevel,
  DeliveryStatus,
  CourtEventType,
  Notification,
  SendNotificationInput,
  UserPreferences,
  EscalationStep,
  EscalationChainConfig,
  EscalationChain,
  DeliveryRecord,
  RecoverySuggestion,
  NotificationEngineConfig,
} from './types';
