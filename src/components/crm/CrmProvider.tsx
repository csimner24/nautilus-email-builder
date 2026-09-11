"use client";

import * as React from "react";
import { crm as seedCrm, type Contact, VARIABLE_KEYS } from "@/lib/crm";
import { normalizeEmail } from "@/lib/email";

const CRM_STORAGE_KEY = "nautilus-email-builder-crm";

interface CrmContextValue {
  contacts: Record<string, Contact>;
  getContact: (email: string) => Contact | undefined;
  upsertContact: (contact: Contact) => void;
  variableKeys: readonly string[];
}

const CrmContext = React.createContext<CrmContextValue | null>(null);

function isContact(value: unknown): value is Contact {
  if (!value || typeof value !== "object") return false;
  const contact = value as Partial<Contact>;
  return (
    typeof contact.email === "string" &&
    typeof contact.firstName === "string" &&
    typeof contact.lastName === "string" &&
    typeof contact.birthday === "string" &&
    typeof contact.location === "string"
  );
}

/**
 * Parse a stored CRM, returning `null` for anything unusable so the caller
 * keeps the seeded demo contacts. An empty object is rejected too: it would
 * silently replace the seed data with nothing.
 */
function parseStoredContacts(raw: string): Record<string, Contact> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;

  const entries = Object.values(parsed);
  if (entries.length === 0 || !entries.every(isContact)) return null;
  return parsed as Record<string, Contact>;
}

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = React.useState<Record<string, Contact>>(
    () => ({ ...seedCrm }),
  );
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CRM_STORAGE_KEY);
      const storedContacts = saved ? parseStoredContacts(saved) : null;
      if (storedContacts) setContacts(storedContacts);
    } catch {
      // The seeded demo CRM remains available if browser storage is unavailable.
    } finally {
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(contacts));
    } catch {
      // CRM edits remain usable for the current session.
    }
  }, [contacts, loaded]);

  const getContact = React.useCallback(
    (email: string) => contacts[normalizeEmail(email)],
    [contacts],
  );

  const upsertContact = React.useCallback((contact: Contact) => {
    const email = normalizeEmail(contact.email);
    setContacts((current) => ({
      ...current,
      [email]: { ...contact, email },
    }));
  }, []);

  const value = React.useMemo(
    () => ({
      contacts,
      getContact,
      upsertContact,
      variableKeys: VARIABLE_KEYS,
    }),
    [contacts, getContact, upsertContact],
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const value = React.useContext(CrmContext);
  if (!value) throw new Error("useCrm must be used inside CrmProvider");
  return value;
}
