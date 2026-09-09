"use client";

import * as React from "react";

type FallbackRenderer = (retry: () => void) => React.ReactNode;

interface SilentErrorBoundaryProps {
  children: React.ReactNode;
  /**
   * What to render in place of the crashed subtree. Pass a function to receive
   * a `retry` callback that clears the error and re-mounts the children.
   * Defaults to `null`, which hides the broken spot and leaves the rest of the
   * last working UI intact.
   */
  fallback?: React.ReactNode | FallbackRenderer;
}

interface SilentErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches render/lifecycle errors in its subtree and keeps the app alive: it
 * logs to the console and renders `fallback` instead of an error screen, so an
 * unexpected runtime or package failure can never white-screen the app.
 *
 * This does NOT surface user-facing error state on its own. Deliberate,
 * user-actionable feedback (validation, send success/failure) is handled
 * elsewhere and is unaffected by this boundary. Where losing a subtree would
 * strand the user, pass a `fallback` that offers a way back.
 */
export class SilentErrorBoundary extends React.Component<
  SilentErrorBoundaryProps,
  SilentErrorBoundaryState
> {
  state: SilentErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SilentErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    // Log for developer insight only. Never propagate to the UI.
    console.error(
      "[SilentErrorBoundary] Recovered from a render error.",
      error,
      info,
    );
  }

  private retry = () => {
    this.setState({ hasError: false });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    const { fallback } = this.props;
    return typeof fallback === "function"
      ? (fallback as FallbackRenderer)(this.retry)
      : (fallback ?? null);
  }
}
