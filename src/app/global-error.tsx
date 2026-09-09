"use client";

import * as React from "react";

/**
 * Root-level error boundary for errors thrown in the root layout, which the
 * per-segment `error.tsx` cannot catch. Must render its own <html>/<body>, and
 * cannot rely on the layout's fonts or stylesheets having loaded.
 *
 * There is no subtree left to retry at this level, so it logs and offers a
 * reload rather than rendering an empty page.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  React.useEffect(() => {
    console.error("[app/global-error] Root error.", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <div
          role="alert"
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
            gap: 12,
            justifyContent: "center",
            minHeight: "100vh",
            padding: 24,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, margin: 0 }}>
            The email builder could not start.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              background: "#171717",
              border: "1px solid #171717",
              borderRadius: 6,
              color: "#ffffff",
              cursor: "pointer",
              font: "inherit",
              fontSize: 14,
              fontWeight: 500,
              padding: "8px 16px",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
