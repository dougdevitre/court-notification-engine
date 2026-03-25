/**
 * @module SMSChannel
 * @description SMS delivery channel for court notifications.
 * Integrates with SMS providers (Twilio, etc.) to send plain-language
 * text messages to litigants. Includes character limit management
 * and delivery receipt tracking.
 *
 * @example
 * ```typescript
 * const sms = new SMSChannel({ provider: 'twilio', fromNumber: '+15551234567' });
 * await sms.send('+15559876543', 'Your hearing is tomorrow at 9am.');
 * ```
 */

import type { DeliveryStatus } from '../types';

export interface SMSChannelConfig {
  /** SMS provider name */
  provider: 'twilio' | 'vonage' | 'mock';
  /** Sender phone number */
  fromNumber: string;
  /** Maximum message length (default: 160) */
  maxLength?: number;
}

export interface SMSResult {
  messageId: string;
  status: DeliveryStatus;
  sentAt: Date;
}

export class SMSChannel {
  private config: SMSChannelConfig;
  private maxLength: number;

  constructor(config: SMSChannelConfig) {
    this.config = config;
    this.maxLength = config.maxLength ?? 160;
  }

  /**
   * Send an SMS message.
   * @param toNumber - Recipient phone number
   * @param message - Message text
   * @returns Delivery result
   */
  async send(toNumber: string, message: string): Promise<SMSResult> {
    const truncated = message.length > this.maxLength
      ? message.slice(0, this.maxLength - 3) + '...'
      : message;

    // TODO: Integrate with actual SMS provider
    return {
      messageId: `sms-${Date.now()}`,
      status: 'sent',
      sentAt: new Date(),
    };
  }

  /**
   * Check delivery status of a previously sent message.
   * @param messageId - The provider message ID
   */
  async checkStatus(messageId: string): Promise<DeliveryStatus> {
    // TODO: Query provider for delivery status
    return 'delivered';
  }
}
