"use client";

import * as React from "react";
import { useCrm } from "@/components/crm/CrmProvider";
import { isValidEmail } from "@/lib/email";

export interface RecipientViewControlProps {
  /** Contact the preview is personalized for, or null for the generic email. */
  activeEmail: string | null;
  onDisplay: (email: string) => void;
  onReset: () => void;
}

/**
 * Switches the preview between the generic email and one rendered with a CRM
 * contact's values substituted into its `{{tokens}}`.
 */
export function RecipientViewControl({
  activeEmail,
  onDisplay,
  onReset,
}: RecipientViewControlProps) {
  const { getContact } = useCrm();
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (activeEmail) {
    return (
      <button type="button" onClick={onReset}>
        View as Generic
      </button>
    );
  }

  const handleDisplay = () => {
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!getContact(trimmed)) {
      setError("No CRM profile uses that email.");
      return;
    }

    setError(null);
    setOpen(false);
    setEmail("");
    onDisplay(trimmed);
  };

  return (
    <div className="nautilus-recipient-view">
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError(null);
          setEmail("");
        }}
      >
        View as Recipient
      </button>

      {open ? (
        <div className="nautilus-recipient-popup-overlay">
          <div className="nautilus-recipient-popup" ref={dialogRef}>
            <h3>View as Recipient</h3>
            <p>Enter a CRM contact&apos;s email to preview with their data.</p>
            <input
              type="email"
              aria-label="Recipient email"
              placeholder="ada@example.com"
              value={email}
              autoFocus
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleDisplay();
                }
              }}
            />
            {error ? (
              <p className="nautilus-recipient-error">{error}</p>
            ) : null}
            <div className="nautilus-recipient-popup-actions">
              <button type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="nautilus-recipient-popup-primary"
                onClick={handleDisplay}
              >
                Display
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
