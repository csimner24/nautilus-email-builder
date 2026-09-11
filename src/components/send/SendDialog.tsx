"use client";

import * as React from "react";
import type { EmailData } from "@/puck.config";
import { ContactForm } from "@/components/crm/ContactForm";
import { useCrm } from "@/components/crm/CrmProvider";
import { useDialogFocusTrap } from "@/components/ui/useDialogFocusTrap";
import { ApiError, describeRequestError, requestJson } from "@/lib/api-client";
import { contactAttributes } from "@/lib/crm";
import { isValidEmail, normalizeEmail, parseRecipientList } from "@/lib/email";
import type { ScheduledEmail } from "@/temporal/types";

type Tab = "now" | "scheduled" | "crm";
type Notice = { kind: "success" | "error"; message: string } | null;

interface SendDialogProps {
  data: EmailData;
  open: boolean;
  onClose: () => void;
}

const TABS: { value: Tab; label: string }[] = [
  { value: "now", label: "Send now" },
  { value: "scheduled", label: "Scheduled send" },
  { value: "crm", label: "CRM" },
];

/** Scheduling is offline only when the API says so, or never answered at all. */
function isSchedulingOffline(error: unknown): boolean {
  return error instanceof ApiError ? error.status === 503 : true;
}

function CrmFlag({ email }: { email: string }) {
  const { getContact } = useCrm();
  if (!isValidEmail(email)) return null;

  const contact = getContact(email);
  return (
    <span
      className={`send-dialog__crm-flag send-dialog__crm-flag--${
        contact ? "found" : "missing"
      }`}
    >
      <span aria-hidden="true">●</span>
      {contact
        ? `In CRM — ${contact.firstName} ${contact.lastName}`.trim()
        : "Not in CRM"}
    </span>
  );
}

function NoticeBanner({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
    <div
      className={`send-dialog__notice send-dialog__notice--${notice.kind}`}
      role={notice.kind === "error" ? "alert" : "status"}
    >
      {notice.message}
    </div>
  );
}

export function SendDialog({ data, open, onClose }: SendDialogProps) {
  const { contacts, getContact, variableKeys } = useCrm();
  const cardRef = useDialogFocusTrap(open, onClose);
  const [tab, setTab] = React.useState<Tab>("now");
  const [recipient, setRecipient] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [recipientsText, setRecipientsText] = React.useState("");
  const [scheduledSubject, setScheduledSubject] = React.useState("");
  const [sendAt, setSendAt] = React.useState("");
  const [notice, setNotice] = React.useState<Notice>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [scheduled, setScheduled] = React.useState<ScheduledEmail[]>([]);
  const [schedulingOffline, setSchedulingOffline] = React.useState(false);

  const parsedRecipients = React.useMemo(
    () => parseRecipientList(recipientsText),
    [recipientsText],
  );

  const loadScheduled = React.useCallback(async () => {
    try {
      const result = await requestJson<{ schedules?: ScheduledEmail[] }>(
        "/api/schedule",
        { cache: "no-store" },
      );
      setScheduled(result.schedules ?? []);
      setSchedulingOffline(false);
    } catch (error) {
      setScheduled([]);
      setSchedulingOffline(isSchedulingOffline(error));
    }
  }, []);

  React.useEffect(() => {
    if (open) setNotice(null);
  }, [open]);

  React.useEffect(() => {
    if (open && tab === "scheduled") void loadScheduled();
  }, [loadScheduled, open, tab]);

  if (!open) return null;

  const selectTab = (value: Tab) => {
    setTab(value);
    setNotice(null);
  };

  // Left/right arrows move between tabs, as expected of a `tablist`.
  const handleTabKeyDown = (event: React.KeyboardEvent) => {
    const offset =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!offset) return;

    event.preventDefault();
    const current = TABS.findIndex((item) => item.value === tab);
    const next = TABS[(current + offset + TABS.length) % TABS.length];
    selectTab(next.value);
    document.getElementById(`send-tab-${next.value}`)?.focus();
  };

  const sendNow = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValidEmail(recipient)) {
      setNotice({ kind: "error", message: "Enter a valid recipient email." });
      return;
    }
    if (!subject.trim()) {
      setNotice({ kind: "error", message: "Enter an email subject." });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);
    try {
      await requestJson("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data,
          to: normalizeEmail(recipient),
          subject: subject.trim(),
          attributes: contactAttributes(getContact(recipient)),
        }),
      });
      setNotice({ kind: "success", message: "Email sent successfully." });
    } catch (error) {
      setNotice({
        kind: "error",
        message: describeRequestError(error, "Email could not be sent."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scheduleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !parsedRecipients.length ||
      parsedRecipients.some((email) => !isValidEmail(email))
    ) {
      setNotice({
        kind: "error",
        message: "Enter valid recipient emails separated by commas or new lines.",
      });
      return;
    }
    if (!scheduledSubject.trim() || !sendAt) {
      setNotice({ kind: "error", message: "Subject and send time are required." });
      return;
    }
    const sendTime = new Date(sendAt);
    if (Number.isNaN(sendTime.getTime()) || sendTime.getTime() <= Date.now()) {
      setNotice({ kind: "error", message: "Choose a future send time." });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);
    try {
      await requestJson("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data,
          recipients: parsedRecipients.map((email) => ({
            email,
            attributes: contactAttributes(getContact(email)),
          })),
          subject: scheduledSubject.trim(),
          sendAt: sendTime.toISOString(),
        }),
      });
      setSchedulingOffline(false);
      setNotice({ kind: "success", message: "Email scheduled successfully." });
      await loadScheduled();
    } catch (error) {
      // Only a 503 means scheduling is offline; a rejected payload must not
      // tell the user to go start Temporal.
      if (isSchedulingOffline(error)) setSchedulingOffline(true);
      setNotice({
        kind: "error",
        message: describeRequestError(error, "Email could not be scheduled."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelSchedule = async (workflowId: string) => {
    setIsSubmitting(true);
    setNotice(null);
    try {
      await requestJson("/api/schedule/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId }),
      });
      setNotice({ kind: "success", message: "Scheduled email canceled." });
      await loadScheduled();
    } catch (error) {
      setNotice({
        kind: "error",
        message: describeRequestError(error, "Unable to cancel schedule."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="send-dialog__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        className="send-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-dialog-title"
      >
        <header className="send-dialog__header">
          <div>
            <p className="send-dialog__eyebrow">Delivery</p>
            <h2 id="send-dialog-title">Send your email</h2>
          </div>
          <button
            type="button"
            className="send-dialog__close"
            onClick={onClose}
            aria-label="Close send dialog"
          >
            ×
          </button>
        </header>

        <div
          className="send-dialog__tabs"
          role="tablist"
          aria-label="Send options"
          onKeyDown={handleTabKeyDown}
        >
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              id={`send-tab-${value}`}
              type="button"
              role="tab"
              aria-selected={tab === value}
              aria-controls={`send-panel-${value}`}
              tabIndex={tab === value ? 0 : -1}
              className={tab === value ? "is-active" : undefined}
              onClick={() => selectTab(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="send-dialog__body">
          <NoticeBanner notice={notice} />

          {tab === "now" ? (
            <div
              role="tabpanel"
              id="send-panel-now"
              aria-labelledby="send-tab-now"
            >
              <form className="send-dialog__form" onSubmit={sendNow}>
                <label>
                  Recipient
                  <input
                    type="email"
                    value={recipient}
                    onChange={(event) => setRecipient(event.target.value)}
                    placeholder="ada@example.com"
                    autoComplete="email"
                    required
                  />
                </label>
                <CrmFlag email={recipient} />
                <label>
                  Subject
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Hello {{firstName}}"
                    required
                  />
                </label>
                <p className="send-dialog__hint">
                  Resend&apos;s development sender can only deliver to the
                  account owner. Available variables:{" "}
                  {variableKeys.map((key) => `{{${key}}}`).join(", ")}.
                </p>
                <button
                  className="send-dialog__primary"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Sending…" : "Send now"}
                </button>
              </form>
            </div>
          ) : null}

          {tab === "scheduled" ? (
            <div
              role="tabpanel"
              id="send-panel-scheduled"
              aria-labelledby="send-tab-scheduled"
            >
              <form className="send-dialog__form" onSubmit={scheduleSend}>
                <label>
                  Recipients
                  <textarea
                    value={recipientsText}
                    onChange={(event) => setRecipientsText(event.target.value)}
                    placeholder="ada@example.com, grace@example.com"
                    rows={3}
                    required
                  />
                </label>
                <div className="send-dialog__flags">
                  {parsedRecipients.map((email) => (
                    <CrmFlag key={email} email={email} />
                  ))}
                </div>
                <label>
                  Subject
                  <input
                    value={scheduledSubject}
                    onChange={(event) =>
                      setScheduledSubject(event.target.value)
                    }
                    placeholder="A message for {{firstName}}"
                    required
                  />
                </label>
                <label>
                  Send date and time
                  <input
                    type="datetime-local"
                    value={sendAt}
                    onChange={(event) => setSendAt(event.target.value)}
                    required
                  />
                </label>
                <button
                  className="send-dialog__primary"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Scheduling…" : "Schedule send"}
                </button>
              </form>

              <section
                className="send-dialog__schedules"
                aria-labelledby="schedules-title"
              >
                <div className="send-dialog__section-heading">
                  <h3 id="schedules-title">Scheduled emails</h3>
                  <button type="button" onClick={() => void loadScheduled()}>
                    Refresh
                  </button>
                </div>
                {schedulingOffline ? (
                  <p className="send-dialog__temporal-note">
                    Scheduling is available locally. Start Temporal with{" "}
                    <code>temporal server start-dev</code> and run{" "}
                    <code>npm run worker</code>.
                  </p>
                ) : scheduled.length ? (
                  <ul>
                    {scheduled.map((item) => (
                      <li key={item.workflowId}>
                        <div>
                          <strong>{item.subject}</strong>
                          <span>
                            {item.recipients.join(", ")} ·{" "}
                            {new Date(item.sendAt).toLocaleString()} ·{" "}
                            {item.status}
                          </span>
                        </div>
                        {item.status.toLowerCase() === "running" ? (
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => void cancelSchedule(item.workflowId)}
                          >
                            Cancel
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="send-dialog__empty">No scheduled emails.</p>
                )}
              </section>
            </div>
          ) : null}

          {tab === "crm" ? (
            <div
              role="tabpanel"
              id="send-panel-crm"
              aria-labelledby="send-tab-crm"
            >
              <div className="send-dialog__crm-layout">
                <ContactForm
                  onError={(message) => setNotice({ kind: "error", message })}
                  onInteract={() => setNotice(null)}
                  onSaved={() =>
                    setNotice({
                      kind: "success",
                      message: "CRM contact saved.",
                    })
                  }
                />
                <section
                  className="send-dialog__contacts"
                  aria-labelledby="contacts-title"
                >
                  <h3 id="contacts-title">
                    Contacts ({Object.keys(contacts).length})
                  </h3>
                  <ul>
                    {Object.values(contacts).map((item) => (
                      <li key={item.email}>
                        <strong>
                          {`${item.firstName} ${item.lastName}`.trim()}
                        </strong>
                        <span>{item.email}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
