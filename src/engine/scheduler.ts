/**
 * @module NotificationScheduler
 * @description Manages notification timing, batching, and scheduling.
 * Supports immediate delivery, scheduled future delivery, and
 * daily digest batching for lower-urgency notifications.
 *
 * @example
 * ```typescript
 * const scheduler = new NotificationScheduler();
 * scheduler.scheduleAt(notification, new Date('2024-04-10T09:00:00'));
 * scheduler.addToDigest('user-123', notification);
 * ```
 */

import type { Notification, UrgencyLevel } from '../types';

/** A scheduled notification entry */
export interface ScheduledEntry {
  notification: Notification;
  scheduledFor: Date;
  retryCount: number;
}

/** A digest batch for a user */
export interface DigestBatch {
  userId: string;
  notifications: Notification[];
  scheduledFor: Date;
}

export class NotificationScheduler {
  /** Scheduled notifications ordered by time */
  private scheduled: ScheduledEntry[] = [];

  /** Digest batches keyed by userId */
  private digests: Map<string, DigestBatch> = new Map();

  /** Default digest send time (hour of day, 0-23) */
  private digestHour: number = 8; // 8 AM

  /**
   * Schedule a notification for a specific time.
   * @param notification - The notification to schedule
   * @param sendAt - When to send
   */
  scheduleAt(notification: Notification, sendAt: Date): ScheduledEntry {
    const entry: ScheduledEntry = {
      notification,
      scheduledFor: sendAt,
      retryCount: 0,
    };
    this.scheduled.push(entry);
    this.scheduled.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
    return entry;
  }

  /**
   * Add a notification to the user's daily digest.
   * @param userId - The user ID
   * @param notification - The notification to include
   */
  addToDigest(userId: string, notification: Notification): void {
    let batch = this.digests.get(userId);
    if (!batch) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(this.digestHour, 0, 0, 0);

      batch = {
        userId,
        notifications: [],
        scheduledFor: tomorrow,
      };
      this.digests.set(userId, batch);
    }
    batch.notifications.push(notification);
  }

  /**
   * Get all entries due for sending.
   * @param asOf - The reference time (default: now)
   */
  getDueEntries(asOf: Date = new Date()): ScheduledEntry[] {
    return this.scheduled.filter((e) => e.scheduledFor <= asOf);
  }

  /**
   * Get all digest batches due for sending.
   * @param asOf - The reference time (default: now)
   */
  getDueDigests(asOf: Date = new Date()): DigestBatch[] {
    return Array.from(this.digests.values()).filter(
      (d) => d.scheduledFor <= asOf
    );
  }

  /**
   * Remove sent entries from the schedule.
   */
  removeSent(ids: string[]): void {
    const idSet = new Set(ids);
    this.scheduled = this.scheduled.filter(
      (e) => !idSet.has(e.notification.id)
    );
  }

  /**
   * Clear a user's digest after sending.
   */
  clearDigest(userId: string): void {
    this.digests.delete(userId);
  }

  /**
   * Get the queue size.
   */
  getQueueSize(): number {
    return this.scheduled.length;
  }

  /**
   * Set the default digest hour.
   */
  setDigestHour(hour: number): void {
    this.digestHour = Math.max(0, Math.min(23, hour));
  }
}
