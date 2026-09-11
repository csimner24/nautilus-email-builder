"use client";

import * as React from "react";
import { useCrm } from "@/components/crm/CrmProvider";
import {
  formatBirthdayDigits,
  stripBirthdayDigits,
  type Contact,
} from "@/lib/crm";
import { isValidEmail } from "@/lib/email";

const EMPTY_CONTACT: Contact = {
  email: "",
  firstName: "",
  lastName: "",
  birthday: "",
  location: "",
};

type ContactField = keyof typeof EMPTY_CONTACT;

const CONTACT_FIELDS: {
  key: ContactField;
  label: string;
  placeholder?: string;
}[] = [
  { key: "email", label: "Email" },
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "birthday", label: "Birthday", placeholder: "MM/DD/YYYY" },
  { key: "location", label: "Location" },
];

export interface ContactFormProps {
  /** Prefills the email field, e.g. the address the user just looked up. */
  initialEmail?: string;
  submitLabel?: string;
  /** Reports validation failures so the host dialog can show its own banner. */
  onError?: (message: string) => void;
  /** Dismisses a stale notice when the user edits any field. */
  onInteract?: () => void;
  /** Called with the saved contact after it lands in the CRM. */
  onSaved?: (contact: Contact) => void;
}

/**
 * The CRM contact entry form, shared by the send dialog's CRM tab and the
 * project dialog's "create profile" step so both write identical records.
 */
export function ContactForm({
  initialEmail = "",
  submitLabel = "Save contact",
  onError,
  onInteract,
  onSaved,
}: ContactFormProps) {
  const { upsertContact } = useCrm();
  const [contact, setContact] = React.useState<Contact>({
    ...EMPTY_CONTACT,
    email: initialEmail,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValidEmail(contact.email)) {
      onError?.("Enter a valid CRM email.");
      return;
    }
    if (stripBirthdayDigits(contact.birthday).length !== 8) {
      onError?.("Birthday must be 8 digits (MM/DD/YYYY).");
      return;
    }
    upsertContact({ ...contact });
    setContact(EMPTY_CONTACT);
    onSaved?.(contact);
  };

  return (
    <form className="send-dialog__form" onSubmit={handleSubmit}>
      <div className="send-dialog__field-grid">
        {CONTACT_FIELDS.map(({ key, label, placeholder }) => (
          <label key={key}>
            {label}
            <input
              type={key === "email" ? "email" : "text"}
              value={contact[key]}
              placeholder={placeholder}
              inputMode={key === "birthday" ? "numeric" : undefined}
              onChange={(event) => {
                onInteract?.();
                const raw = event.target.value;
                setContact((current) => ({
                  ...current,
                  [key]:
                    key === "birthday"
                      ? formatBirthdayDigits(stripBirthdayDigits(raw))
                      : raw,
                }));
              }}
              required
            />
          </label>
        ))}
      </div>
      <button className="send-dialog__primary" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
