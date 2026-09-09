import * as React from "react";
import { render } from "@react-email/components";
import { Sample } from "@/components/email/Sample";
import { getContactAttributes } from "@/lib/crm";
import { substituteVariables } from "@/lib/variables";
import { PreviewClient } from "./PreviewClient";

// Always render fresh in dev so edits to blocks/theme show on reload.
export const dynamic = "force-dynamic";

const SAMPLE_EMAIL = "ada@example.com";

/**
 * Dev-only harness (no Puck): renders the Sample email to HTML server-side and
 * shows it at desktop (600px) and mobile (375px) widths so we can verify the
 * Material styling, the 600px cap, and mobile column stacking. A toggle applies
 * CRM variable substitution to the same HTML.
 */
export default async function PreviewPage() {
  const rawHtml = await render(<Sample />, { pretty: false });
  const attributes = getContactAttributes(SAMPLE_EMAIL) ?? {};
  const substitutedHtml = substituteVariables(rawHtml, attributes);

  return (
    <PreviewClient
      rawHtml={rawHtml}
      substitutedHtml={substitutedHtml}
      sampleEmail={SAMPLE_EMAIL}
    />
  );
}
