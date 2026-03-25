/**
 * @module NotificationEngine
 * @description Core notification processing engine. Accepts notification requests,
 * applies user preferences and urgency routing, renders templates, dispatches
 * to the appropriate channel, and records delivery status.
 *
 * @example
 * ```typescript
 * const engine = new NotificationEngine({
 *   defaultChannel: 'sms',
 *   timezone: 'America/Chicago',
 * });
 *
 * await engine.send({
 *   userId: 'user-123',
 *   channel: 'sms',
 *   template: 'deadline-approaching',
 *   data: { deadline: 'File your answer', dueDate: '2024-04-10' },
 * });
 * ```
 */

import type {
  Notification,
  SendNotificationInput,
  NotificationEngineConfig,
  DeliveryStatus,
  UrgencyLevel,
  NotificationChannel,
  UserPreferences,
} from '../types';

export class NotificationEngine {
  private config: NotificationEngineConfig;

  /** Sent notifications, keyed by notification ID */
  private notifications: Map<string, Notification> = new Map();

  /** User preferences, keyed by user ID */
  private preferences: Map<string, UserPreferences> = new Map();

  /** Queue of pending notifications */
  private queue: Notification[] = [];

  /**
   * Create a new NotificationEngine.
   * @param config - Engine configuration
   */
  constructor(config: NotificationEngineConfig) {
    this.config = config;
  }

  /**
   * Send a notification to a user.
   * Applies user preferences, selects channel, renders template, and dispatches.
   * @param input - Notification details
   * @returns The created notification record
   */
  async send(input: SendNotificationInput): Promise<Notification> {
    const urgency = input.urgency ?? 'medium';
    const channel = this.resolveChannel(input.userId, input.channel, urgency);

    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: input.userId,
      channel,
      template: input.template,
      data: input.data,
      urgency,
      createdAt: new Date(),
      scheduledFor: input.scheduledFor,
      status: 'pending',
      eventType: input.eventType,
      caseId: input.caseId,
    };

    this.notifications.set(notification.id, notification);

    if (input.scheduledFor && input.scheduledFor > new Date()) {
      notification.status = 'queued';
      this.queue.push(notification);
    } else {
      await this.dispatch(notification);
    }

    return notification;
  }

  /**
   * Send a batch of notifications (e.g., daily digest).
   * @param inputs - Array of notification inputs
   * @returns Array of created notifications
   */
  async sendBatch(inputs: SendNotificationInput[]): Promise<Notification[]> {
    return Promise.all(inputs.map((input) => this.send(input)));
  }

  /**
   * Set user notification preferences.
   * @param preferences - The user's preferences
   */
  setUserPreferences(preferences: UserPreferences): void {
    this.preferences.set(preferences.userId, preferences);
  }

  /**
   * Get a notification by ID.
   */
  getNotification(id: string): Notification | undefined {
    return this.notifications.get(id);
  }

  /**
   * Update the delivery status of a notification.
   */
  updateStatus(notificationId: string, status: DeliveryStatus): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;
    notification.status = status;
    return true;
  }

  /**
   * Get all notifications for a user.
   */
  getNotificationsForUser(userId: string): Notification[] {
    return Array.from(this.notifications.values())
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Process the pending notification queue.
   * Sends any notifications whose scheduled time has arrived.
   */
  async processQueue(): Promise<number> {
    const now = new Date();
    let sent = 0;

    const ready = this.queue.filter(
      (n) => !n.scheduledFor || n.scheduledFor <= now
    );

    for (const notification of ready) {
      await this.dispatch(notification);
      sent++;
    }

    this.queue = this.queue.filter(
      (n) => n.scheduledFor && n.scheduledFor > now
    );

    return sent;
  }

  /**
   * Resolve the best delivery channel based on user preferences and urgency.
   */
  private resolveChannel(
    userId: string,
    requestedChannel: NotificationChannel,
    urgency: UrgencyLevel
  ): NotificationChannel {
    const prefs = this.preferences.get(userId);
    if (!prefs) return requestedChannel;

    // Check opt-outs
    if (prefs.optedOut.includes(requestedChannel)) {
      return prefs.channelByUrgency[urgency] ?? this.config.defaultChannel;
    }

    // Check quiet hours for non-critical notifications
    if (urgency !== 'critical' && this.isQuietHours(prefs)) {
      return 'in-app'; // Queue for in-app during quiet hours
    }

    return requestedChannel;
  }

  /**
   * Check if it is currently quiet hours for the user.
   */
  private isQuietHours(prefs: UserPreferences): boolean {
    if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
    const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
    // Wraps midnight
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  /**
   * Dispatch a notification to its channel provider.
   */
  private async dispatch(notification: Notification): Promise<void> {
    // TODO: Integrate with actual SMS/email/push providers
    notification.status = 'sent';
  }
}
