import * as React from "react";
import { Section, Button } from "@react-email/components";
import { theme, filledButtonStyle, type Align } from "../theme";

export interface ButtonBlockProps {
  label: string;
  href: string;
  bgColor?: string;
  textColor?: string;
  radius?: string;
  align?: Align;
  fullWidth?: boolean;
}

export const buttonBlockDefaults = {
  label: "Learn More",
  href: "https://example.com",
  bgColor: theme.color.primary,
  textColor: theme.color.onPrimary,
  radius: theme.radius.sm,
  align: "center",
  fullWidth: false,
} as const satisfies ButtonBlockProps;

/** Styled Material CTA button. */
export function ButtonBlock({
  label = buttonBlockDefaults.label,
  href = buttonBlockDefaults.href,
  bgColor = buttonBlockDefaults.bgColor,
  textColor = buttonBlockDefaults.textColor,
  radius = buttonBlockDefaults.radius,
  align = buttonBlockDefaults.align,
  fullWidth = buttonBlockDefaults.fullWidth,
}: ButtonBlockProps) {
  return (
    <Section
      style={{
        padding: `${theme.space[2]} ${theme.space[3]}`,
        textAlign: align,
      }}
    >
      <Button
        href={href}
        className={fullWidth ? "mobile-full" : undefined}
        style={filledButtonStyle({ bgColor, textColor, radius, fullWidth })}
      >
        {label}
      </Button>
    </Section>
  );
}
