import * as React from "react";
import { Render } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { config, type EmailData } from "@/puck.config";
import type { PersonalizationAttributes } from "@/lib/email";
import { personalizeHtml } from "@/lib/variables";

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

  return personalizeHtml(html, attributes);
}
