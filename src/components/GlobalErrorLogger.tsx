"use client";

import * as React from "react";

/**
 * Logs global errors and unhandled promise rejections that escape React's
 * render tree (async work, package internals) with a consistent prefix.
 *
 * These events never white-screen the app on their own, so they are observed
 * rather than suppressed: calling `preventDefault` here would hide real
 * failures from the console and from any error-reporting integration.
 *
 * Renders nothing.
 */
export function GlobalErrorLogger() {
  React.useEffect(() => {
    const onError = (event: ErrorEvent) => {
      console.error("[global] Uncaught error.", event.error ?? event.message);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      console.error("[global] Unhandled promise rejection.", event.reason);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
