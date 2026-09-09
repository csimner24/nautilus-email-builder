/**
 * Shared email-address and request-payload helpers.
 *
 * Kept free of React and server-renderer imports so both the browser bundle
 * and the API routes can use the same validation rules.
 */

import type { EmailData } from "@/puck.config";

/** Pragmatic shape check: one `@`, no whitespace, and a dot in the domain. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Split a comma-, semicolon-, or newline-separated list into unique addresses. */
export function parseRecipientList(value: string): string[] {
  const emails = value.split(/[\n,;]/).map(normalizeEmail).filter(Boolean);
  return Array.from(new Set(emails));
}

/** Personalization values substituted into `{{tokens}}` before send. */
export type PersonalizationAttributes = Record<string, string | undefined>;

/** Keep only the string-valued entries of an untrusted attributes object. */
export function parseAttributes(value: unknown): PersonalizationAttributes {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

/** Structural check that an untrusted value is a usable Puck email draft. */
export function isEmailData(value: unknown): value is EmailData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<EmailData>;
  return (
    Array.isArray(candidate.content) &&
    !!candidate.root &&
    typeof candidate.root === "object"
  );
}
