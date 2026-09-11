import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Preview,
  Font,
} from "@react-email/components";
import { theme as defaultTheme, responsiveCss } from "./theme";

export interface EmailLayoutProps {
  /** Inbox preview text (preheader). */
  preheader?: string;
  /** Overrides for the root-config theme. */
  backgroundColor?: string;
  contentWidth?: number;
  fontFamily?: string;
  children: React.ReactNode;
}

/**
 * The email shell: <Html>/<Head>/<Body> + a centered, width-capped <Container>.
 *
 * Applies root-config theme (background, content width, font), injects the web
 * font, the shared responsive CSS, and the preheader. Every composed email is
 * wrapped in this layout.
 */
export function EmailLayout({
  preheader,
  backgroundColor,
  contentWidth,
  fontFamily,
  children,
}: EmailLayoutProps) {
  const bg = backgroundColor ?? defaultTheme.color.surface;
  const width = contentWidth ?? defaultTheme.contentWidth;
  const font = fontFamily ?? defaultTheme.font.family;

  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <Font
          fontFamily={defaultTheme.font.webFontName}
          fallbackFontFamily="Arial"
          webFont={{ url: defaultTheme.font.webFontUrl, format: "woff2" }}
          fontWeight={400}
          fontStyle="normal"
        />
        <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />
      </Head>
      {preheader ? <Preview>{preheader}</Preview> : null}
      <Body
        style={{
          backgroundColor: bg,
          margin: 0,
          padding: 0,
          fontFamily: font,
          color: defaultTheme.color.text,
          WebkitTextSizeAdjust: "100%",
        }}
      >
        <Container
          className="email-container"
          style={{
            width: `${width}px`,
            maxWidth: "100%",
            margin: "0 auto",
            // Transparent so the page background reads as one continuous
            // surface; the container only constrains width.
            backgroundColor: "transparent",
          }}
        >
          {children}
        </Container>
      </Body>
    </Html>
  );
}
