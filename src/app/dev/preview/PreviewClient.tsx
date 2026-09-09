"use client";

import * as React from "react";
import { PREVIEW_VIEWPORTS } from "@/lib/viewports";

export interface PreviewClientProps {
  rawHtml: string;
  substitutedHtml: string;
  sampleEmail: string;
}

/**
 * Client-side controls for the email preview harness. Toggles variable
 * substitution and shows the rendered email HTML in fixed-width iframes.
 */
export function PreviewClient({
  rawHtml,
  substitutedHtml,
  sampleEmail,
}: PreviewClientProps) {
  const [substituted, setSubstituted] = React.useState(true);
  const html = substituted ? substitutedHtml : rawHtml;

  return (
    <div
      style={{
        fontFamily:
          "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#202124",
        padding: 24,
        background: "#f1f3f4",
        minHeight: "100vh",
      }}
    >
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>
          Email preview harness
        </h1>
        <p style={{ fontSize: 14, color: "#5f6368", margin: 0 }}>
          Standalone block components rendered via React Email. Desktop caps at
          600px; mobile (375px) demonstrates column stacking.
        </p>
      </header>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
          padding: "12px 16px",
          background: "#ffffff",
          borderRadius: 8,
          border: "1px solid #dadce0",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={substituted}
            onChange={(event) => setSubstituted(event.target.checked)}
          />
          Substitute variables
        </label>
        <span style={{ fontSize: 13, color: "#5f6368" }}>
          {substituted
            ? `Using CRM contact: ${sampleEmail}`
            : "Showing raw {{tokens}}"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
        {Object.values(PREVIEW_VIEWPORTS).map((viewport) => (
          <div key={viewport.label}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#5f6368",
                marginBottom: 8,
              }}
            >
              {viewport.label} · {viewport.width}px
            </div>
            <iframe
              title={`${viewport.label} preview`}
              srcDoc={html}
              style={{
                width: viewport.width,
                height: 900,
                border: "1px solid #dadce0",
                borderRadius: 8,
                background: "#ffffff",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
