/**
 * @module InAppChannel
 * @description In-app notification channel for displaying alerts within
 * Justice OS applications. Stores notifications for retrieval by the
 * client UI, with read/unread tracking.
 *
 * @example
 * ```typescript
 * const inApp = new InAppChannel();
 * inApp.store('user-123', { title: 'Filing Received', body: 'Your answer was accepted.' });
 * const unread = inApp.getUnread('user-123');
 * ```
 */

import type { DeliveryStatus } from '../types';

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: Date;
  read: boolean;
  data?: Record<string, unknown>;
}

export class InAppChannel {
  /** In-app notifications keyed by user ID */
  private store: Map<string, InAppNotification[]> = new Map();

  /**
   * Store an in-app notification for a user.
   */
  storeNotification(
    userId: string,
    content: { title: string; body: string; data?: Record<string, unknown> }
  ): InAppNotification {
    const notification: InAppNotification = {
      id: `inapp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      title: content.title,
      body: content.body,
      createdAt: new Date(),
      read: false,
      data: content.data,
    };

    const existing = this.store.get(userId) ?? [];
    existing.push(notification);
    this.store.set(userId, existing);
    return notification;
  }

  /**
   * Get unread notifications for a user.
   */
  getUnread(userId: string): InAppNotification[] {
    return (this.store.get(userId) ?? []).filter((n) => !n.read);
  }

  /**
   * Get all notifications for a user (read + unread).
   */
  getAll(userId: string): InAppNotification[] {
    return (this.store.get(userId) ?? []).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Mark a notification as read.
   */
  markRead(notificationId: string, userId: string): boolean {
    const notifications = this.store.get(userId);
    if (!notifications) return false;
    const notif = notifications.find((n) => n.id === notificationId);
    if (!notif) return false;
    notif.read = true;
    return true;
  }

  /**
   * Mark all notifications as read for a user.
   */
  markAllRead(userId: string): number {
    const notifications = this.store.get(userId) ?? [];
    let count = 0;
    for (const n of notifications) {
      if (!n.read) {
        n.read = true;
        count++;
      }
    }
    return count;
  }

  /**
   * Get unread count for a user.
   */
  getUnreadCount(userId: string): number {
    return this.getUnread(userId).length;
  }
}
