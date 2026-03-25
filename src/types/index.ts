/**
 * @module @justice-os/notifications/types
 * @description Core type definitions for the Court Notification Engine.
 * Defines notification channels, templates, escalation chains,
 * delivery tracking, and recovery structures.
 */

/** Supported notification delivery channels */
export type NotificationChannel = 'sms' | 'email' | 'push' | 'in-app';

/** Urgency level for a notification */
export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

/** Delivery status of a notification */
export type DeliveryStatus =
  | 'pending'
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'acknowledged'
  | 'failed'
  | 'bounced';

/** Event types that trigger notifications */
export type CourtEventType =
  | 'hearing-scheduled'
  | 'hearing-rescheduled'
  | 'hearing-cancelled'
  | 'deadline-approaching'
  | 'filing-received'
  | 'case-update'
  | 'payment-due'
  | 'document-available';

/**
 * A notification to be sent to a user.
 */
export interface Notification {
  /** Unique notification ID */
  id: string;
  /** Target user ID */
  userId: string;
  /** Delivery channel */
  channel: NotificationChannel;
  /** Template identifier for rendering */
  template: string;
  /** Data to inject into the template */
  data: Record<string, unknown>;
  /** Urgency level */
  urgency: UrgencyLevel;
  /** When the notification was created */
  createdAt: Date;
  /** When to send (undefined = immediately) */
  scheduledFor?: Date;
  /** Current delivery status */
  status: DeliveryStatus;
  /** Related court event type */
  eventType?: CourtEventType;
  /** Related case ID */
  caseId?: string;
}

/**
 * Input for sending a notification.
 */
export interface SendNotificationInput {
  userId: string;
  channel: NotificationChannel;
  template: string;
  data: Record<string, unknown>;
  urgency?: UrgencyLevel;
  scheduledFor?: Date;
  eventType?: CourtEventType;
  caseId?: string;
}

/**
 * User notification preferences.
 */
export interface UserPreferences {
  /** The user ID */
  userId: string;
  /** Preferred channel for each urgency level */
  channelByUrgency: Record<UrgencyLevel, NotificationChannel>;
  /** Quiet hours (no non-critical notifications) */
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string;
  /** User's timezone */
  timezone: string;
  /** Preferred language */
  language: string;
  /** Opted-out channels */
  optedOut: NotificationChannel[];
}

/**
 * A single step in an escalation reminder chain.
 */
export interface EscalationStep {
  /** Days before the event to send this reminder */
  daysBefore: number;
  /** Channel to use for this step */
  channel: NotificationChannel;
  /** Template to use */
  template: string;
  /** Urgency level for this step */
  urgency?: UrgencyLevel;
}

/**
 * Configuration for an escalation reminder chain.
 */
export interface EscalationChainConfig {
  /** Related event identifier */
  eventId: string;
  /** The date of the event */
  eventDate: Date;
  /** Target user ID */
  userId: string;
  /** Ordered list of reminder steps */
  reminders: EscalationStep[];
  /** Related case ID */
  caseId?: string;
}

/**
 * An active escalation chain being tracked.
 */
export interface EscalationChain {
  /** Unique chain ID */
  id: string;
  /** Configuration */
  config: EscalationChainConfig;
  /** Index of the next reminder to send */
  nextStepIndex: number;
  /** Whether the chain is active */
  active: boolean;
  /** Whether the user acknowledged any reminder */
  acknowledged: boolean;
  /** When the chain was created */
  createdAt: Date;
}

/**
 * Delivery tracking record for a sent notification.
 */
export interface DeliveryRecord {
  /** The notification ID */
  notificationId: string;
  /** The user ID */
  userId: string;
  /** Channel used */
  channel: NotificationChannel;
  /** When the notification was sent */
  sentAt: Date;
  /** When it was delivered (if known) */
  deliveredAt?: Date;
  /** When the user opened it (if trackable) */
  openedAt?: Date;
  /** When the user acknowledged it */
  acknowledgedAt?: Date;
  /** Provider-specific message ID */
  providerMessageId?: string;
  /** Error details if failed */
  error?: string;
}

/**
 * A recovery suggestion for a missed action.
 */
export interface RecoverySuggestion {
  /** What was missed */
  missedAction: string;
  /** Event type that was missed */
  eventType: CourtEventType;
  /** Plain-language description of what to do now */
  suggestion: string;
  /** Urgency of the recovery action */
  urgency: UrgencyLevel;
  /** Relevant resources or links */
  resources: Array<{ title: string; url: string }>;
}

/**
 * Configuration for the notification engine.
 */
export interface NotificationEngineConfig {
  /** Default channel when no preference is set */
  defaultChannel: NotificationChannel;
  /** Default timezone */
  timezone: string;
  /** Maximum retry attempts for failed deliveries */
  maxRetries?: number;
  /** Batch digest interval in minutes */
  digestIntervalMinutes?: number;
}
