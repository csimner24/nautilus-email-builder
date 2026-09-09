import * as React from "react";
import { Section, Img, Link } from "@react-email/components";
import { theme, type Align } from "../theme";

export interface ImageBlockProps {
  src: string;
  alt?: string;
  /** Rendered width in px (capped to the container). */
  width?: number;
  align?: Align;
  /** Optional link wrapping the image. */
  href?: string;
}

export const imageBlockDefaults = {
  src: "https://dummyimage.com/560x280/dadce0/5f6368&text=Image",
  alt: "Image",
  width: 560,
  align: "center",
} as const satisfies ImageBlockProps;

function marginFor(align: Align): string {
  if (align === "center") return "0 auto";
  if (align === "right") return "0 0 0 auto";
  return "0";
}

/** Inserts an image, optionally linked. */
export function ImageBlock({
  src = imageBlockDefaults.src,
  alt = imageBlockDefaults.alt,
  width = imageBlockDefaults.width,
  align = imageBlockDefaults.align,
  href,
}: ImageBlockProps) {
  const image = (
    <Img
      src={src}
      alt={alt}
      width={width}
      style={{
        width: "100%",
        maxWidth: `${width}px`,
        height: "auto",
        display: "block",
        margin: marginFor(align),
        borderRadius: theme.radius.sm,
      }}
    />
  );

  return (
    <Section
      style={{
        padding: `${theme.space[2]} ${theme.space[3]}`,
        textAlign: align,
      }}
    >
      {href ? <Link href={href}>{image}</Link> : image}
    </Section>
  );
}
