/**
 * @module DeliveryTracker
 * @description Tracks notification delivery status including sends, deliveries,
 * opens, and user acknowledgments. Provides analytics on delivery rates
 * and identifies notifications that may have been missed.
 *
 * @example
 * ```typescript
 * const tracker = new DeliveryTracker();
 * tracker.recordSent('notif-123', 'user-123', 'sms', 'msg-abc');
 * tracker.recordDelivered('notif-123');
 * tracker.recordOpened('notif-123');
 * ```
 */

import type { DeliveryRecord, NotificationChannel } from '../types';

export class DeliveryTracker {
  /** Delivery records keyed by notification ID */
  private records: Map<string, DeliveryRecord> = new Map();

  /** User-to-records index */
  private userIndex: Map<string, Set<string>> = new Map();

  /**
   * Record that a notification was sent.
   */
  recordSent(
    notificationId: string,
    userId: string,
    channel: NotificationChannel,
    providerMessageId?: string
  ): DeliveryRecord {
    const record: DeliveryRecord = {
      notificationId,
      userId,
      channel,
      sentAt: new Date(),
      providerMessageId,
    };
    this.records.set(notificationId, record);

    if (!this.userIndex.has(userId)) {
      this.userIndex.set(userId, new Set());
    }
    this.userIndex.get(userId)!.add(notificationId);

    return record;
  }

  /**
   * Record that a notification was delivered.
   */
  recordDelivered(notificationId: string): boolean {
    const record = this.records.get(notificationId);
    if (!record) return false;
    record.deliveredAt = new Date();
    return true;
  }

  /**
   * Record that a notification was opened/viewed.
   */
  recordOpened(notificationId: string): boolean {
    const record = this.records.get(notificationId);
    if (!record) return false;
    record.openedAt = new Date();
    return true;
  }

  /**
   * Record that the user acknowledged a notification.
   */
  recordAcknowledged(notificationId: string): boolean {
    const record = this.records.get(notificationId);
    if (!record) return false;
    record.acknowledgedAt = new Date();
    return true;
  }

  /**
   * Record a delivery failure.
   */
  recordFailed(notificationId: string, error: string): boolean {
    const record = this.records.get(notificationId);
    if (!record) return false;
    record.error = error;
    return true;
  }

  /**
   * Get the delivery record for a notification.
   */
  getRecord(notificationId: string): DeliveryRecord | undefined {
    return this.records.get(notificationId);
  }

  /**
   * Get all delivery records for a user.
   */
  getRecordsForUser(userId: string): DeliveryRecord[] {
    const ids = this.userIndex.get(userId);
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => this.records.get(id))
      .filter((r): r is DeliveryRecord => r !== undefined)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  /**
   * Get notifications that were sent but never opened (potential misses).
   */
  getUnopenedForUser(userId: string, olderThanHours: number = 24): DeliveryRecord[] {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    return this.getRecordsForUser(userId).filter(
      (r) => !r.openedAt && !r.error && r.sentAt < cutoff
    );
  }

  /**
   * Get delivery statistics for a user.
   */
  getStats(userId: string): {
    total: number;
    delivered: number;
    opened: number;
    acknowledged: number;
    failed: number;
  } {
    const records = this.getRecordsForUser(userId);
    return {
      total: records.length,
      delivered: records.filter((r) => r.deliveredAt).length,
      opened: records.filter((r) => r.openedAt).length,
      acknowledged: records.filter((r) => r.acknowledgedAt).length,
      failed: records.filter((r) => r.error).length,
    };
  }
}
