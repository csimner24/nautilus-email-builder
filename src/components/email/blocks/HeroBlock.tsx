import * as React from "react";
import { Section, Img, Heading, Text, Button } from "@react-email/components";
import { theme, filledButtonStyle, type Align } from "../theme";

export interface HeroBlockProps {
  imageUrl?: string;
  imageAlt?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  bgColor?: string;
  textColor?: string;
  align?: Align;
}

export const heroBlockDefaults = {
  imageUrl: "https://dummyimage.com/600x240/1a73e8/ffffff&text=Hero",
  imageAlt: "Hero image",
  title: "Welcome to Nautilus",
  subtitle: "Build beautiful, responsive emails in minutes.",
  ctaLabel: "Get Started",
  ctaHref: "https://example.com",
  bgColor: theme.color.surface,
  textColor: theme.color.text,
  align: "center",
} as const satisfies HeroBlockProps;

/** Prominent header: image + title + subtitle + CTA. */
export function HeroBlock({
  imageUrl = heroBlockDefaults.imageUrl,
  imageAlt = heroBlockDefaults.imageAlt,
  title = heroBlockDefaults.title,
  subtitle = heroBlockDefaults.subtitle,
  ctaLabel = heroBlockDefaults.ctaLabel,
  ctaHref = heroBlockDefaults.ctaHref,
  bgColor = heroBlockDefaults.bgColor,
  textColor = heroBlockDefaults.textColor,
  align = heroBlockDefaults.align,
}: HeroBlockProps) {
  return (
    <Section
      style={{
        backgroundColor: bgColor,
        padding: `${theme.space[4]} ${theme.space[3]}`,
        textAlign: align,
      }}
    >
      {imageUrl ? (
        <Img
          src={imageUrl}
          alt={imageAlt}
          width="600"
          style={{
            width: "100%",
            maxWidth: "600px",
            height: "auto",
            display: "block",
            margin: align === "center" ? "0 auto" : "0",
            borderRadius: theme.radius.md,
          }}
        />
      ) : null}
      <Heading
        as="h1"
        style={{
          ...theme.type.headline,
          color: textColor,
          margin: `${theme.space[3]} 0 ${theme.space[1]}`,
          textAlign: align,
        }}
      >
        {title}
      </Heading>
      {subtitle ? (
        <Text
          style={{
            ...theme.type.body,
            color: theme.color.textMuted,
            margin: `0 0 ${theme.space[3]}`,
            textAlign: align,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
      {ctaLabel && ctaHref ? (
        <Button href={ctaHref} style={filledButtonStyle()}>
          {ctaLabel}
        </Button>
      ) : null}
    </Section>
  );
}
