/**
 * @module TemplateEngine
 * @description Renders notification templates into plain-language messages.
 * Templates use Handlebars-style variable substitution and support
 * locale-aware formatting. All output is written at accessible reading
 * levels for self-represented litigants.
 *
 * @example
 * ```typescript
 * const engine = new TemplateEngine();
 * engine.register('hearing-reminder', {
 *   subject: 'Hearing Reminder: {{caseName}}',
 *   body: 'You have a hearing on {{date}} at {{time}} in {{courtroom}}.',
 *   smsBody: 'Hearing: {{date}} at {{time}}, {{courtroom}}',
 * });
 *
 * const rendered = engine.render('hearing-reminder', {
 *   caseName: 'Smith v. Landlord',
 *   date: 'April 15, 2024',
 *   time: '9:00 AM',
 *   courtroom: 'Room 302',
 * });
 * ```
 */

/** A notification template definition */
export interface NotificationTemplate {
  /** Template for email/push subject lines */
  subject: string;
  /** Full body for email/in-app */
  body: string;
  /** Short body for SMS (character-limited) */
  smsBody: string;
  /** Optional HTML body for email */
  htmlBody?: string;
}

/** Rendered output ready for delivery */
export interface RenderedNotification {
  subject: string;
  body: string;
  smsBody: string;
  htmlBody?: string;
}

export class TemplateEngine {
  /** Registered templates keyed by template ID */
  private templates: Map<string, NotificationTemplate> = new Map();

  /**
   * Register a notification template.
   * @param templateId - Unique template identifier
   * @param template - The template definition
   */
  register(templateId: string, template: NotificationTemplate): void {
    this.templates.set(templateId, template);
  }

  /**
   * Render a template with the provided data.
   * @param templateId - The template to render
   * @param data - Key-value pairs for variable substitution
   * @returns The rendered notification content
   * @throws Error if the template does not exist
   */
  render(templateId: string, data: Record<string, string>): RenderedNotification {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template "${templateId}" not found.`);
    }

    return {
      subject: this.interpolate(template.subject, data),
      body: this.interpolate(template.body, data),
      smsBody: this.interpolate(template.smsBody, data),
      htmlBody: template.htmlBody
        ? this.interpolate(template.htmlBody, data)
        : undefined,
    };
  }

  /**
   * Check if a template exists.
   */
  has(templateId: string): boolean {
    return this.templates.has(templateId);
  }

  /**
   * Get all registered template IDs.
   */
  getTemplateIds(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Simple Handlebars-style variable interpolation.
   * Replaces {{variableName}} with values from the data object.
   */
  private interpolate(text: string, data: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] ?? match;
    });
  }
}
