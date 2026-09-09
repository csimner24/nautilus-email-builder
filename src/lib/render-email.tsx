import * as React from "react";
import { Render } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { config, type EmailData } from "@/puck.config";
import type { PersonalizationAttributes } from "@/lib/email";
import { substituteVariables } from "@/lib/variables";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderPersonalizedEmail(
  data: EmailData,
  attributes: PersonalizationAttributes,
) {
  // INVARIANT: render with react-dom/server's `renderToStaticMarkup` so Puck's
  // `<Render>` and the server renderer share ONE React instance. This mirrors
  // the working preview path.
  //
  // Do NOT swap this for `@react-email/render` (or any standalone React Email
  // renderer). Under Next.js it loads a SECOND React server renderer, producing
  // a renderer/context mismatch that throws "Invalid hook call" and crashes the
  // send. Resend is not involved in that failure. Keep this path identical to
  // the preview to prevent that regression.
  const html = `<!doctype html>${renderToStaticMarkup(
    <Render config={config} data={data} />,
  )}`;

  // Substitution runs over the whole rendered document, so a `{{token}}` is
  // replaced wherever it lands. Values are HTML-escaped, which is correct for
  // text and quoted attributes but NOT for a token used as a bare URL or
  // inside a <script>/<style> body; email blocks never emit those.
  const escapedAttributes = Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => [
      key,
      value === undefined ? undefined : escapeHtml(value),
    ]),
  );
  return substituteVariables(html, escapedAttributes);
}
