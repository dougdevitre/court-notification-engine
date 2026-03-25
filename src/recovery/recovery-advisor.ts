/**
 * @module RecoveryAdvisor
 * @description Generates context-specific recovery suggestions when a user
 * misses a court deadline, hearing, or required action. Provides
 * plain-language guidance on what to do next, along with relevant resources.
 *
 * @example
 * ```typescript
 * const advisor = new RecoveryAdvisor();
 * const suggestion = advisor.getSuggestion('hearing-scheduled', {
 *   caseType: 'eviction',
 *   daysMissedBy: 1,
 * });
 * console.log(suggestion.suggestion); // "You missed your hearing. Here is what to do..."
 * ```
 */

import type { CourtEventType, RecoverySuggestion, UrgencyLevel } from '../types';

/** Context for generating a recovery suggestion */
export interface RecoveryContext {
  caseType?: string;
  daysMissedBy: number;
  jurisdiction?: string;
}

export class RecoveryAdvisor {
  /**
   * Generate a recovery suggestion for a missed court event.
   * @param eventType - The type of event that was missed
   * @param context - Additional context about the missed event
   * @returns A recovery suggestion with actionable guidance
   */
  getSuggestion(eventType: CourtEventType, context: RecoveryContext): RecoverySuggestion {
    switch (eventType) {
      case 'hearing-scheduled':
      case 'hearing-rescheduled':
        return this.missedHearingSuggestion(context);
      case 'deadline-approaching':
        return this.missedDeadlineSuggestion(context);
      case 'payment-due':
        return this.missedPaymentSuggestion(context);
      default:
        return this.genericSuggestion(eventType, context);
    }
  }

  /**
   * Check if a missed event qualifies for emergency recovery.
   */
  isEmergency(eventType: CourtEventType, context: RecoveryContext): boolean {
    if (eventType === 'hearing-scheduled' && context.daysMissedBy <= 1) {
      return true;
    }
    if (eventType === 'deadline-approaching' && context.daysMissedBy <= 2) {
      return true;
    }
    return false;
  }

  private missedHearingSuggestion(context: RecoveryContext): RecoverySuggestion {
    const urgency: UrgencyLevel = context.daysMissedBy <= 1 ? 'critical' : 'high';
    return {
      missedAction: 'Court Hearing',
      eventType: 'hearing-scheduled',
      urgency,
      suggestion:
        'You missed your court hearing. A default judgment may be entered against you. ' +
        'Contact the court clerk as soon as possible to explain why you missed the hearing. ' +
        'You may be able to file a "Motion to Vacate" the default judgment. ' +
        'Consider contacting legal aid for free help with this process.',
      resources: [
        { title: 'LawHelp.org — Find Legal Aid', url: 'https://www.lawhelp.org' },
        { title: 'Understanding Default Judgments', url: 'https://www.courts.gov/self-help/default-judgment' },
      ],
    };
  }

  private missedDeadlineSuggestion(context: RecoveryContext): RecoverySuggestion {
    return {
      missedAction: 'Filing Deadline',
      eventType: 'deadline-approaching',
      urgency: 'high',
      suggestion:
        'You missed a filing deadline. Depending on your case, you may still be able to file late. ' +
        'Contact the court clerk to ask about emergency or late filing options. ' +
        'Some courts allow late filings with a brief explanation.',
      resources: [
        { title: 'LawHelp.org — Find Legal Aid', url: 'https://www.lawhelp.org' },
      ],
    };
  }

  private missedPaymentSuggestion(context: RecoveryContext): RecoverySuggestion {
    return {
      missedAction: 'Court Payment',
      eventType: 'payment-due',
      urgency: 'medium',
      suggestion:
        'You missed a court payment. Contact the court clerk to discuss payment plan options. ' +
        'You may qualify for a fee waiver or hardship reduction based on your income.',
      resources: [
        { title: 'Fee Waiver Information', url: 'https://www.courts.gov/self-help/fee-waivers' },
      ],
    };
  }

  private genericSuggestion(eventType: CourtEventType, context: RecoveryContext): RecoverySuggestion {
    return {
      missedAction: eventType.replace(/-/g, ' '),
      eventType,
      urgency: 'medium',
      suggestion:
        'You may have missed an important court action. Contact the court clerk or a legal aid ' +
        'organization for guidance on your next steps.',
      resources: [
        { title: 'LawHelp.org — Find Legal Aid', url: 'https://www.lawhelp.org' },
      ],
    };
  }
}
