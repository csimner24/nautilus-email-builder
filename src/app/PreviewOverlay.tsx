"use client";

import * as React from "react";
import { EmailPreview } from "./EmailPreview";
import { CrashNotice } from "@/components/CrashNotice";
import { useCrm } from "@/components/crm/CrmProvider";
import { RecipientViewControl } from "@/components/preview/RecipientViewControl";
import { SilentErrorBoundary } from "@/components/SilentErrorBoundary";
import { contactAttributes } from "@/lib/crm";
import type { PreviewViewport } from "@/lib/viewports";
import type { EmailData } from "@/puck.config";

interface PreviewOverlayProps {
  data: EmailData;
  viewport: PreviewViewport;
  onEdit: () => void;
}

/**
 * The read-only view of the email, covering the still-mounted editor.
 *
 * Lives inside `CrmProvider` so it can resolve the selected recipient's
 * attributes; the header stays outside the error boundary so the way back to
 * the editor survives a failed render.
 */
export function PreviewOverlay({ data, viewport, onEdit }: PreviewOverlayProps) {
  const { getContact } = useCrm();
  const [recipientEmail, setRecipientEmail] = React.useState<string | null>(
    null,
  );

  const contact = recipientEmail ? getContact(recipientEmail) : undefined;
  // A contact deleted while its preview is open falls back to the generic
  // email rather than rendering half-substituted content.
  const attributes = React.useMemo(
    () => (contact ? contactAttributes(contact) : undefined),
    [contact],
  );

  return (
    <div className="nautilus-page-preview">
      <header className="nautilus-preview-header">
        <h1>View Page</h1>
        <div className="nautilus-preview-actions">
          <RecipientViewControl
            activeEmail={contact ? recipientEmail : null}
            onDisplay={setRecipientEmail}
            onReset={() => setRecipientEmail(null)}
          />
          <button type="button" onClick={onEdit}>
            Edit
          </button>
        </div>
      </header>
      <SilentErrorBoundary fallback={(retry) => <CrashNotice retry={retry} />}>
        <EmailPreview
          data={data}
          viewport={viewport}
          attributes={attributes}
        />
      </SilentErrorBoundary>
    </div>
  );
}
