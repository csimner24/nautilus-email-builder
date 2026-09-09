import * as React from "react";
import { Section } from "@react-email/components";
import type { Align } from "../theme";

export interface SectionBlockProps {
  bgColor?: string;
  /** Inner padding in px. */
  padding?: number;
  align?: Align;
  children?: React.ReactNode;
}

export const sectionBlockDefaults = {
  bgColor: "transparent",
  padding: 24,
  align: "left",
} as const satisfies Pick<
  SectionBlockProps,
  "bgColor" | "padding" | "align"
>;

/**
 * Generic container with background + padding. Satisfies the required
 * Container/Section primitive and gives power users a flexible wrapper.
 */
export function SectionBlock({
  bgColor = sectionBlockDefaults.bgColor,
  padding = sectionBlockDefaults.padding,
  align = sectionBlockDefaults.align,
  children,
}: SectionBlockProps) {
  return (
    <Section
      style={{
        backgroundColor: bgColor,
        padding: `${padding}px`,
        textAlign: align,
      }}
    >
      {children}
    </Section>
  );
}
