/**
 * A tiny stand-in "CRM": a static dictionary of contact attributes keyed by
 * recipient email. The VariablePicker pulls attribute keys from here, and the
 * send/schedule flow substitutes these values into `{{tokens}}` before sending.
 *
 * This is intentionally a plain file for now; it can later be swapped for a DB
 * or external CRM without changing the consumer API (getContact /
 * contactAttributes).
 */

import { normalizeEmail } from "@/lib/email";

export interface Contact {
  email: string;
  firstName: string;
  lastName: string;
  birthday: string;
  hometown: string;
  /** Allow additional custom attributes. */
  [key: string]: string;
}

export const crm: Record<string, Contact> = {
  "ada@example.com": {
    email: "ada@example.com",
    firstName: "Ada",
    lastName: "Lovelace",
    birthday: "December 10",
    hometown: "London",
  },
  "grace@example.com": {
    email: "grace@example.com",
    firstName: "Grace",
    lastName: "Hopper",
    birthday: "December 9",
    hometown: "New York City",
  },
  "alan@example.com": {
    email: "alan@example.com",
    firstName: "Alan",
    lastName: "Turing",
    birthday: "June 23",
    hometown: "Maida Vale",
  },
};

/** Attribute keys exposed as personalization variables (excludes `email`). */
export const VARIABLE_KEYS: readonly string[] = [
  "firstName",
  "lastName",
  "birthday",
  "hometown",
];

/** Look up a contact by email (case-insensitive). */
export function getContact(email: string): Contact | undefined {
  return crm[normalizeEmail(email)];
}

/**
 * A contact's personalization attributes: everything except `email`, which
 * addresses the message rather than appearing inside it.
 */
export function contactAttributes(
  contact: Contact | undefined,
): Record<string, string> {
  if (!contact) return {};
  const { email: _email, ...attributes } = contact;
  return attributes;
}

/** Convenience: look up a seeded contact's attributes by email. */
export function getContactAttributes(
  email: string,
): Record<string, string> | undefined {
  const contact = getContact(email);
  return contact ? contactAttributes(contact) : undefined;
}
