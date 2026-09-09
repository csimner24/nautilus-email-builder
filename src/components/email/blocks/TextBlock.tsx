import * as React from "react";
import { Section, Text, Heading } from "@react-email/components";
import { theme, type Align } from "../theme";

export type TextVariant = "heading" | "body";

export interface TextBlockProps {
  /**
   * HTML content. May contain inline formatting (e.g. <strong>) and
   * `{{tokens}}` that are substituted before send.
   */
  content: string;
  variant?: TextVariant;
  color?: string;
  align?: Align;
  fontSize?: number;
}

export const textBlockDefaults = {
  content: "Add your message here. You can personalize it with {{firstName}}.",
  variant: "body",
  color: theme.color.text,
  align: "left",
} as const satisfies TextBlockProps;

/** Formatted paragraph or heading. Renders HTML content (tokens allowed). */
export function TextBlock({
  content = textBlockDefaults.content,
  variant = textBlockDefaults.variant,
  color = textBlockDefaults.color,
  align = textBlockDefaults.align,
  fontSize,
}: TextBlockProps) {
  const typeScale = variant === "heading" ? theme.type.title : theme.type.body;
  const style: React.CSSProperties = {
    ...typeScale,
    color,
    textAlign: align,
    fontFamily: theme.font.family,
    margin: `0 0 ${theme.space[2]}`,
    ...(fontSize ? { fontSize: `${fontSize}px` } : {}),
  };

  return (
    <Section style={{ padding: `${theme.space[1]} ${theme.space[3]}` }}>
      {variant === "heading" ? (
        <Heading
          as="h2"
          style={style}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <Text style={style} dangerouslySetInnerHTML={{ __html: content }} />
      )}
    </Section>
  );
}
