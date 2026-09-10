/**
 * Single source of truth for the two preview widths.
 *
 * The editor canvas, the standalone preview, and the header's "View Page"
 * button all derive from these values so the widths can never drift apart.
 */

import type { Viewports } from "@puckeditor/core";

export type PreviewViewport = "desktop" | "mobile";

export interface ViewportSpec {
  label: string;
  width: number;
}

export const PREVIEW_VIEWPORTS: Record<PreviewViewport, ViewportSpec> = {
  desktop: { label: "Desktop", width: 600 },
  mobile: { label: "Mobile", width: 375 },
};

/** Viewport switcher shown inside the Puck canvas controls. */
export const PUCK_VIEWPORTS: Viewports = [
  { ...PREVIEW_VIEWPORTS.desktop, icon: "Monitor" },
  { ...PREVIEW_VIEWPORTS.mobile, icon: "Smartphone" },
];

/**
 * Map a Puck canvas width back to a preview viewport. Widths at or below the
 * mobile breakpoint preview as mobile; anything wider previews as desktop.
 */
export function viewportForWidth(width: number | "100%"): PreviewViewport {
  if (width === "100%") return "desktop";
  return width <= PREVIEW_VIEWPORTS.mobile.width ? "mobile" : "desktop";
}
