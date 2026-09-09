import * as React from "react";
import { Section, Hr } from "@react-email/components";
import { theme } from "../theme";

export interface DividerBlockProps {
  color?: string;
  /** Line thickness in px. */
  thickness?: number;
  /** Vertical spacing above/below in px. */
  spacing?: number;
}

export const dividerBlockDefaults = {
  color: theme.color.outline,
  thickness: 1,
  spacing: 16,
} as const satisfies DividerBlockProps;

/** Horizontal rule for visual separation between sections. */
export function DividerBlock({
  color = dividerBlockDefaults.color,
  thickness = dividerBlockDefaults.thickness,
  spacing = dividerBlockDefaults.spacing,
}: DividerBlockProps) {
  return (
    <Section style={{ padding: `0 ${theme.space[3]}` }}>
      <Hr
        style={{
          border: "none",
          borderTop: `${thickness}px solid ${color}`,
          margin: `${spacing}px 0`,
          width: "100%",
        }}
      />
    </Section>
  );
}
