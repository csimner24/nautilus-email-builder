"use client";

import * as React from "react";
import { Render } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import type { PersonalizationAttributes } from "@/lib/email";
import { personalizeHtml } from "@/lib/variables";
import { PREVIEW_VIEWPORTS, type PreviewViewport } from "@/lib/viewports";
import { config, type EmailData } from "@/puck.config";

export interface EmailPreviewProps {
  data: EmailData;
  viewport: PreviewViewport;
  /**
   * CRM values for `{{token}}` substitution. Omit to preview the generic
   * email, which shows the tokens as authored.
   */
  attributes?: PersonalizationAttributes;
}

/** Height used until the frame's document has been measured. */
const INITIAL_FRAME_HEIGHT = 480;

export function EmailPreview({
  data,
  viewport,
  attributes,
}: EmailPreviewProps) {
  const { label, width } = PREVIEW_VIEWPORTS[viewport];
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const observerRef = React.useRef<ResizeObserver | null>(null);
  const [height, setHeight] = React.useState(INITIAL_FRAME_HEIGHT);

  // Substituting the rendered document (rather than the draft) is the same
  // path the send takes, so the preview and the delivered email agree.
  const html = React.useMemo(() => {
    const markup = `<!doctype html>${renderToStaticMarkup(
      <Render config={config} data={data} />,
    )}`;
    return attributes ? personalizeHtml(markup, attributes) : markup;
  }, [data, attributes]);

  /*
   * The frame grows to its content so the preview shows the email at its true
   * height: no empty space below a short email, and no inner scrollbar.
   *
   * `body` is measured rather than `documentElement`, whose scrollHeight is
   * floored at the frame's own height and so could only ever grow.
   */
  const measureFrame = React.useCallback(() => {
    observerRef.current?.disconnect();

    const body = frameRef.current?.contentDocument?.body;
    if (!body) return;

    const applyHeight = () =>
      setHeight(Math.ceil(body.getBoundingClientRect().height));
    applyHeight();

    // Late-loading images and web fonts reflow the document after `load`.
    const observer = new ResizeObserver(applyHeight);
    observer.observe(body);
    observerRef.current = observer;
  }, []);

  React.useEffect(() => () => observerRef.current?.disconnect(), []);

  return (
    <main className="nautilus-preview-surface">
      <section className="nautilus-preview-stage">
        {/*
          The wrapper draws the same thin outline as the editor canvas so the
          email's edges stay readable against the white page.
        */}
        <div className="nautilus-preview-tape">
          <iframe
            ref={frameRef}
            className="nautilus-preview-frame"
            title={`${label} email preview`}
            srcDoc={html}
            onLoad={measureFrame}
            style={{ width, height }}
          />
        </div>
      </section>
    </main>
  );
}
