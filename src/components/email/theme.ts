/**
 * Root config theme for the email builder.
 *
 * This is the single source of truth every block inherits. It emulates the
 * Google / Material Design look using email-safe values (inline styles only,
 * no CSS Grid / flexbox). Blocks read tokens from here for their defaults;
 * individual props always override these.
 */

import type { CSSProperties } from "react";

export type Align = "left" | "center" | "right";

export interface TypeStyle {
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
}

export const theme = {
  /** Material-inspired color roles (Google palette). */
  color: {
    primary: "#1a73e8",
    primaryHover: "#1765cc",
    onPrimary: "#ffffff",
    surface: "#ffffff",
    background: "#f8f9fa",
    text: "#202124",
    textMuted: "#5f6368",
    outline: "#dadce0",
    link: "#1a73e8",
  },

  /** Font stack: Roboto with web-safe fallbacks. */
  font: {
    family: "'Roboto', Arial, Helvetica, sans-serif",
    webFontName: "Roboto",
    webFontUrl:
      "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
  },

  /** Material type scale mapped to email-friendly sizes. */
  type: {
    headline: { fontSize: "28px", lineHeight: "36px", fontWeight: 700 },
    title: { fontSize: "22px", lineHeight: "28px", fontWeight: 500 },
    body: { fontSize: "16px", lineHeight: "24px", fontWeight: 400 },
    label: { fontSize: "14px", lineHeight: "20px", fontWeight: 500 },
    caption: { fontSize: "12px", lineHeight: "16px", fontWeight: 400 },
  } satisfies Record<string, TypeStyle>,

  /** 8px baseline spacing grid. */
  space: {
    0: "0px",
    1: "8px",
    2: "16px",
    3: "24px",
    4: "32px",
    5: "40px",
    6: "48px",
  },

  radius: {
    sm: "4px",
    md: "8px",
    pill: "9999px",
  },

  /** Max content width; email never stretches past this regardless of screen. */
  contentWidth: 600,
} as const;

export type Theme = typeof theme;

/**
 * Shared responsive CSS injected into the email <Head>.
 *
 * Email layout is table-based; "responsiveness" means the container goes fluid
 * and multi-column rows stack to full width on narrow (mobile) viewports.
 */
export const responsiveCss = `
  /* Client resets */
  body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
  table { border-collapse: collapse; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  a { text-decoration: none; }

  @media only screen and (max-width: 599px) {
    .email-container { width: 100% !important; max-width: 100% !important; }
    .stack-col {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
      box-sizing: border-box !important;
    }
    .mobile-center { text-align: center !important; }
    .mobile-full { width: 100% !important; }
    .mobile-pad { padding-left: 16px !important; padding-right: 16px !important; }
  }
`;

/** Reusable filled (Material) button style. */
export function filledButtonStyle(options?: {
  bgColor?: string;
  textColor?: string;
  radius?: string;
  fullWidth?: boolean;
}): CSSProperties {
  const bg = options?.bgColor ?? theme.color.primary;
  const fg = options?.textColor ?? theme.color.onPrimary;
  const radius = options?.radius ?? theme.radius.sm;
  return {
    backgroundColor: bg,
    color: fg,
    fontFamily: theme.font.family,
    fontSize: theme.type.label.fontSize,
    fontWeight: 500,
    lineHeight: "20px",
    textDecoration: "none",
    textAlign: "center",
    padding: "12px 24px",
    borderRadius: radius,
    display: options?.fullWidth ? "block" : "inline-block",
    width: options?.fullWidth ? "100%" : undefined,
    boxSizing: "border-box",
  };
}
