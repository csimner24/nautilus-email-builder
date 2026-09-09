"use client";

import * as React from "react";
import { Render } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { PREVIEW_VIEWPORTS, type PreviewViewport } from "@/lib/viewports";
import { config, type EmailData } from "@/puck.config";

export interface EmailPreviewProps {
  data: EmailData;
  viewport: PreviewViewport;
}

export function EmailPreview({ data, viewport }: EmailPreviewProps) {
  const { label, width } = PREVIEW_VIEWPORTS[viewport];
  const html = React.useMemo(
    () =>
      `<!doctype html>${renderToStaticMarkup(
        <Render config={config} data={data} />,
      )}`,
    [data],
  );

  return (
    <main className="nautilus-preview-surface">
      <section className="nautilus-preview-stage">
        <iframe
          className="nautilus-preview-frame"
          title={`${label} email preview`}
          srcDoc={html}
          style={{ width }}
        />
      </section>
    </main>
  );
}
