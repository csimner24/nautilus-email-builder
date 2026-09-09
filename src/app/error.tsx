"use client";

import * as React from "react";

/**
 * `error.tsx` mounts fresh on every route error, so an attempt counter kept in
 * component state or a ref would reset each time and auto-retry forever. These
 * live at module scope, which survives for the life of the page.
 */
const MAX_AUTO_RESETS = 2;
const RESET_WINDOW_MS = 10_000;
let autoResetCount = 0;
let lastAutoResetAt = 0;

/**
 * Route-segment error boundary. A transient failure is retried automatically a
 * couple of times; a failure that keeps recurring stops the loop and offers a
 * reload instead, so the user is never left looking at a blank page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [exhausted, setExhausted] = React.useState(false);

  React.useEffect(() => {
    console.error("[app/error] Route error.", error);

    const now = Date.now();
    // A long gap means this is a new problem, not the same one looping.
    if (now - lastAutoResetAt > RESET_WINDOW_MS) autoResetCount = 0;

    if (autoResetCount < MAX_AUTO_RESETS) {
      autoResetCount += 1;
      lastAutoResetAt = now;
      reset();
      return;
    }
    setExhausted(true);
  }, [error, reset]);

  if (!exhausted) return null;

  return (
    <div
      role="alert"
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        gap: 12,
        justifyContent: "center",
        minHeight: "100vh",
        padding: 24,
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 14, margin: 0 }}>
        The editor could not recover on its own.
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
  );
}
