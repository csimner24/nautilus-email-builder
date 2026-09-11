"use client";

import * as React from "react";

/** Fallback for a `SilentErrorBoundary` around a non-essential editor pane. */
export function CrashNotice({ retry }: { retry: () => void }) {
  return (
    <div className="nautilus-crash-notice" role="alert">
      <p>That part of the editor stopped responding.</p>
      <button type="button" onClick={retry}>
        Try again
      </button>
    </div>
  );
}
