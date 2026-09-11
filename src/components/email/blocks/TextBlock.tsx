import * as React from "react";
import { Section, Text, Heading } from "@react-email/components";
import { theme, type Align } from "../theme";

export type TextVariant = "heading" | "body";

export interface TextBlockProps {
  /**
   * Normally an HTML string, which may contain inline formatting (e.g.
   * <strong>) and `{{tokens}}` that are substituted before send.
   *
   * The editor swaps this for a React node: Puck's `contentEditable` field
   * transform replaces the string with its inline-editing element, so this
   * has to accept a node as well.
   */
  content: React.ReactNode;
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

  // Only a raw string is trusted email HTML. In the editor `content` is Puck's
  // inline-editing node, which must render as children -- injecting it as HTML
  // would stringify the element to "[object Object]".
  const contentProps =
    typeof content === "string"
      ? { dangerouslySetInnerHTML: { __html: content } }
      : { children: content };

  return (
    <Section style={{ padding: `${theme.space[1]} ${theme.space[3]}` }}>
      {variant === "heading" ? (
        <Heading as="h2" style={style} {...contentProps} />
      ) : (
        <Text style={style} {...contentProps} />
      )}
    </Section>
  );
}
