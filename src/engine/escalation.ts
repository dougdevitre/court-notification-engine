/**
 * @module EscalationManager
 * @description Creates and manages escalation reminder chains that send
 * progressively urgent reminders as a deadline approaches. If the user
 * acknowledges any reminder, the remaining chain is cancelled.
 *
 * @example
 * ```typescript
 * const escalation = new EscalationManager();
 * escalation.createChain({
 *   eventId: 'hearing-001',
 *   eventDate: new Date('2024-04-15T09:00:00'),
 *   userId: 'user-123',
 *   reminders: [
 *     { daysBefore: 7, channel: 'email', template: 'hearing-reminder-7day' },
 *     { daysBefore: 1, channel: 'sms', template: 'hearing-reminder-1day' },
 *   ],
 * });
 * ```
 */

import type { EscalationChain, EscalationChainConfig, EscalationStep } from '../types';

export class EscalationManager {
  /** Active chains keyed by chain ID */
  private chains: Map<string, EscalationChain> = new Map();

  /** Event-to-chain index */
  private eventIndex: Map<string, string> = new Map();

  /**
   * Create a new escalation reminder chain.
   * @param config - The chain configuration
   * @returns The created escalation chain
   */
  createChain(config: EscalationChainConfig): EscalationChain {
    // Sort reminders by daysBefore descending (earliest reminder first)
    const sortedConfig = {
      ...config,
      reminders: [...config.reminders].sort((a, b) => b.daysBefore - a.daysBefore),
    };

    const chain: EscalationChain = {
      id: `esc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      config: sortedConfig,
      nextStepIndex: 0,
      active: true,
      acknowledged: false,
      createdAt: new Date(),
    };

    this.chains.set(chain.id, chain);
    this.eventIndex.set(config.eventId, chain.id);
    return chain;
  }

  /**
   * Get the next reminder step that is due for sending.
   * @param chainId - The chain ID
   * @param asOf - Reference time (default: now)
   * @returns The due step, or null if none are due
   */
  getNextDueStep(chainId: string, asOf: Date = new Date()): EscalationStep | null {
    const chain = this.chains.get(chainId);
    if (!chain || !chain.active || chain.acknowledged) return null;
    if (chain.nextStepIndex >= chain.config.reminders.length) return null;

    const step = chain.config.reminders[chain.nextStepIndex];
    const sendDate = new Date(chain.config.eventDate);
    sendDate.setDate(sendDate.getDate() - step.daysBefore);

    if (asOf >= sendDate) {
      return step;
    }

    return null;
  }

  /**
   * Advance the chain to the next step (after sending the current one).
   * @param chainId - The chain ID
   */
  advanceChain(chainId: string): void {
    const chain = this.chains.get(chainId);
    if (!chain) return;

    chain.nextStepIndex++;
    if (chain.nextStepIndex >= chain.config.reminders.length) {
      chain.active = false;
    }
  }

  /**
   * Acknowledge a chain (user responded to a reminder). Cancels remaining steps.
   * @param chainId - The chain ID
   */
  acknowledge(chainId: string): void {
    const chain = this.chains.get(chainId);
    if (!chain) return;
    chain.acknowledged = true;
    chain.active = false;
  }

  /**
   * Acknowledge by event ID.
   * @param eventId - The court event ID
   */
  acknowledgeByEvent(eventId: string): void {
    const chainId = this.eventIndex.get(eventId);
    if (chainId) this.acknowledge(chainId);
  }

  /**
   * Cancel a chain entirely.
   * @param chainId - The chain ID
   */
  cancelChain(chainId: string): void {
    const chain = this.chains.get(chainId);
    if (chain) chain.active = false;
  }

  /**
   * Get a chain by ID.
   */
  getChain(chainId: string): EscalationChain | undefined {
    return this.chains.get(chainId);
  }

  /**
   * Get all active chains.
   */
  getActiveChains(): EscalationChain[] {
    return Array.from(this.chains.values()).filter((c) => c.active);
  }

  /**
   * Get all active chains for a specific user.
   */
  getChainsForUser(userId: string): EscalationChain[] {
    return Array.from(this.chains.values()).filter(
      (c) => c.config.userId === userId && c.active
    );
  }
}
