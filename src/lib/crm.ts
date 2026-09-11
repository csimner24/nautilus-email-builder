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
  /** Birthday in MM/DD/YYYY format; see `isValidBirthday`. */
  birthday: string;
  location: string;
  /** Allow additional custom attributes. */
  [key: string]: string;
}

export const crm: Record<string, Contact> = {
  "ada@example.com": {
    email: "ada@example.com",
    firstName: "Ada",
    lastName: "Lovelace",
    birthday: "12/10/1815",
    location: "London",
  },
  "grace@example.com": {
    email: "grace@example.com",
    firstName: "Grace",
    lastName: "Hopper",
    birthday: "12/09/1906",
    location: "New York City",
  },
  "alan@example.com": {
    email: "alan@example.com",
    firstName: "Alan",
    lastName: "Turing",
    birthday: "06/23/1912",
    location: "Maida Vale",
  },
};

/** Attribute keys exposed as personalization variables (excludes `email`). */
export const VARIABLE_KEYS: readonly string[] = [
  "firstName",
  "lastName",
  "birthday",
  "location",
];

/** Matches a MM/DD/YYYY date; calendar validity is checked in `isValidBirthday`. */
const BIRTHDAY_PATTERN = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;

/** Strip non-digits and cap at MMDDYYYY (8 digits). */
export function stripBirthdayDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

/** Format up to 8 birthday digits as MM/DD/YYYY while the user types. */
export function formatBirthdayDigits(digits: string): string {
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Parse free-form birthday input: keep digits only, require exactly 8, format as
 * MM/DD/YYYY, and confirm the result is a real calendar date.
 */
export function normalizeBirthdayInput(value: string): string | null {
  const digits = stripBirthdayDigits(value);
  if (digits.length !== 8) return null;

  const formatted = formatBirthdayDigits(digits);
  return isValidBirthday(formatted) ? formatted : null;
}

/**
 * Whether `value` is a birthday in MM/DD/YYYY form that names a real calendar
 * date (so `02/30/2020` is rejected even though it matches the shape).
 */
export function isValidBirthday(value: string): boolean {
  const match = BIRTHDAY_PATTERN.exec(value.trim());
  if (!match) return false;

  const [, mm, dd, yyyy] = match;
  const month = Number(mm);
  const day = Number(dd);
  const year = Number(yyyy);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

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
