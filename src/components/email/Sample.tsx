import * as React from "react";
import { EmailLayout } from "./EmailLayout";
import {
  HeroBlock,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  ColumnsBlock,
  DividerBlock,
  SectionBlock,
  FooterBlock,
} from "./blocks";

/**
 * A representative email composed from every block, mirroring the ASCII mock
 * in the plan (hero -> text -> image|text columns -> button -> footer).
 *
 * Text intentionally includes `{{tokens}}` so the preview harness can
 * demonstrate variable substitution.
 */
export function Sample() {
  return (
    <EmailLayout preheader="A quick hello from the Nautilus email builder">
      <HeroBlock
        title="Welcome, {{firstName}}!"
        subtitle="Here's what you can build with drag-and-drop blocks."
        ctaLabel="Get Started"
        ctaHref="https://example.com/start"
      />

      <SectionBlock padding={8}>
        <TextBlock
          variant="heading"
          content="Personalized for you"
          align="center"
        />
        <TextBlock
          content="Hi <strong>{{firstName}} {{lastName}}</strong>, thanks for joining us. We noticed you're from <strong>{{location}}</strong> — we've got something special planned for your birthday on <strong>{{birthday}}</strong>."
          align="center"
        />
      </SectionBlock>

      <DividerBlock />

      <ColumnsBlock
        cells={[
          <ImageBlock
            key="img"
            src="https://dummyimage.com/280x180/1a73e8/ffffff&text=Feature"
            alt="Feature preview"
            width={280}
          />,
          <TextBlock
            key="txt"
            content="Place content side-by-side with the Columns block. On mobile these columns stack automatically so nothing gets squeezed."
          />,
        ]}
      />

      <ButtonBlock label="Learn More" href="https://example.com/learn" />

      <DividerBlock />

      <FooterBlock />
    </EmailLayout>
  );
}
