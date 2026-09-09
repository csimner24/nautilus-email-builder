import * as React from "react";
import type { Config, Data, Slot } from "@puckeditor/core";
import { EmailLayout } from "@/components/email/EmailLayout";
import {
  ButtonBlock,
  buttonBlockDefaults,
  clampColumnCount,
  ColumnsBlock,
  columnsBlockDefaults,
  DividerBlock,
  dividerBlockDefaults,
  FooterBlock,
  footerBlockDefaults,
  HeroBlock,
  heroBlockDefaults,
  ImageBlock,
  imageBlockDefaults,
  MAX_COLUMNS,
  MIN_COLUMNS,
  SectionBlock,
  sectionBlockDefaults,
  TextBlock,
  textBlockDefaults,
} from "@/components/email/blocks";
import type {
  ButtonBlockProps,
  ColumnsBlockProps,
  DividerBlockProps,
  FooterBlockProps,
  HeroBlockProps,
  ImageBlockProps,
  SectionBlockProps,
  TextBlockProps,
} from "@/components/email/blocks";
import { responsiveCss, theme } from "@/components/email/theme";

type SectionEditorProps = Omit<SectionBlockProps, "children"> & {
  content: Slot;
};

type ColumnsEditorProps = Omit<ColumnsBlockProps, "cells"> & {
  columns: number;
  col1: Slot;
  col2: Slot;
  col3: Slot;
  col4: Slot;
};

export type EmailComponentProps = {
  HeroBlock: HeroBlockProps;
  TextBlock: TextBlockProps;
  ImageBlock: ImageBlockProps;
  ButtonBlock: ButtonBlockProps;
  ColumnsBlock: ColumnsEditorProps;
  DividerBlock: DividerBlockProps;
  SectionBlock: SectionEditorProps;
  FooterBlock: FooterBlockProps;
};

export interface EmailRootProps {
  backgroundColor: string;
  contentWidth: number;
  fontFamily: string;
  preheader: string;
}

export type EmailData = Data<EmailComponentProps, EmailRootProps>;

/** Props Puck injects into every render, on top of the component's own. */
interface PuckInjectedProps {
  id: string;
  puck: unknown;
  editMode?: boolean;
}

/**
 * Adapt an email block to Puck's render signature by dropping the props Puck
 * injects, which the blocks neither declare nor need.
 */
function renderBlock<Props extends object>(Block: React.ComponentType<Props>) {
  return function BlockRenderer({
    id: _id,
    puck: _puck,
    editMode: _editMode,
    ...blockProps
  }: Props & PuckInjectedProps) {
    return <Block {...(blockProps as unknown as Props)} />;
  };
}

const alignOptions = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
] as const;

const booleanOptions = [
  { label: "Yes", value: true },
  { label: "No", value: false },
] as const;

const rootDefaults: EmailRootProps = {
  backgroundColor: theme.color.background,
  contentWidth: theme.contentWidth,
  fontFamily: theme.font.family,
  preheader: "",
};

export const config: Config<EmailComponentProps, EmailRootProps> = {
  components: {
    HeroBlock: {
      label: "Hero",
      fields: {
        imageUrl: { type: "text", label: "Image URL" },
        imageAlt: { type: "text", label: "Image alt text" },
        title: { type: "text" },
        subtitle: { type: "textarea" },
        ctaLabel: { type: "text", label: "Button label" },
        ctaHref: { type: "text", label: "Button URL" },
        bgColor: { type: "text", label: "Background color" },
        textColor: { type: "text", label: "Text color" },
        align: { type: "radio", options: alignOptions },
      },
      defaultProps: heroBlockDefaults,
      render: renderBlock(HeroBlock),
    },
    TextBlock: {
      label: "Text",
      fields: {
        content: {
          type: "textarea",
          label: "Content (HTML and {{variables}} supported)",
          contentEditable: true,
        },
        variant: {
          type: "radio",
          options: [
            { label: "Heading", value: "heading" },
            { label: "Body", value: "body" },
          ],
        },
        color: { type: "text" },
        align: { type: "radio", options: alignOptions },
        fontSize: { type: "number", label: "Font size (px)", min: 8 },
      },
      defaultProps: textBlockDefaults,
      render: renderBlock(TextBlock),
    },
    ImageBlock: {
      label: "Image",
      fields: {
        src: { type: "text", label: "Image URL" },
        alt: { type: "text", label: "Alt text" },
        width: { type: "number", label: "Width (px)", min: 1 },
        align: { type: "radio", options: alignOptions },
        href: { type: "text", label: "Link URL" },
      },
      defaultProps: imageBlockDefaults,
      render: renderBlock(ImageBlock),
    },
    ButtonBlock: {
      label: "Button",
      fields: {
        label: { type: "text" },
        href: { type: "text", label: "Link URL" },
        bgColor: { type: "text", label: "Background color" },
        textColor: { type: "text", label: "Text color" },
        radius: { type: "text", label: "Corner radius" },
        align: { type: "radio", options: alignOptions },
        fullWidth: {
          type: "radio",
          label: "Full width",
          options: booleanOptions,
        },
      },
      defaultProps: buttonBlockDefaults,
      render: renderBlock(ButtonBlock),
    },
    ColumnsBlock: {
      label: "Columns",
      fields: {
        columns: {
          type: "number",
          label: "Columns",
          min: MIN_COLUMNS,
          max: MAX_COLUMNS,
        },
        col1: { type: "slot" },
        col2: { type: "slot" },
        col3: { type: "slot" },
        col4: { type: "slot" },
        gap: {
          type: "number",
          label: "Gap (px)",
          min: 0,
          max: 64,
        },
        stackOnMobile: {
          type: "radio",
          label: "Stack on mobile",
          options: booleanOptions,
        },
      },
      defaultProps: {
        ...columnsBlockDefaults,
        columns: MIN_COLUMNS,
        col1: [],
        col2: [],
        col3: [],
        col4: [],
      },
      render: ({ columns, col1, col2, col3, col4, gap, stackOnMobile }) => {
        // Four slots always exist so content survives a column-count change;
        // only the first `columns` of them are rendered.
        const slots = [col1, col2, col3, col4];
        const cells = slots
          .slice(0, clampColumnCount(columns))
          .map((SlotComponent, index) => <SlotComponent key={index} />);

        return (
          <ColumnsBlock
            gap={gap}
            stackOnMobile={stackOnMobile}
            cells={cells}
          />
        );
      },
    },
    DividerBlock: {
      label: "Divider",
      fields: {
        color: { type: "text" },
        thickness: { type: "number", label: "Thickness (px)", min: 1 },
        spacing: { type: "number", label: "Spacing (px)", min: 0 },
      },
      defaultProps: dividerBlockDefaults,
      render: renderBlock(DividerBlock),
    },
    SectionBlock: {
      label: "Section",
      fields: {
        bgColor: { type: "text", label: "Background color" },
        padding: { type: "number", label: "Padding (px)", min: 0 },
        align: { type: "radio", options: alignOptions },
        content: { type: "slot" },
      },
      defaultProps: {
        ...sectionBlockDefaults,
        content: [],
      },
      render: ({ content: Content, bgColor, padding, align }) => (
        <SectionBlock bgColor={bgColor} padding={padding} align={align}>
          <Content minEmptyHeight={80} />
        </SectionBlock>
      ),
    },
    FooterBlock: {
      label: "Footer",
      fields: {
        companyName: { type: "text", label: "Company name" },
        address: { type: "textarea" },
        unsubscribeUrl: { type: "text", label: "Unsubscribe URL" },
        links: {
          type: "array",
          label: "Navigation links",
          arrayFields: {
            label: { type: "text" },
            href: { type: "text", label: "URL" },
          },
          defaultItemProps: {
            label: "Link",
            href: "https://example.com",
          },
          getItemSummary: (item) => item.label,
        },
        socials: {
          type: "array",
          label: "Social links",
          arrayFields: {
            label: { type: "text" },
            href: { type: "text", label: "URL" },
          },
          defaultItemProps: {
            label: "Social",
            href: "https://example.com",
          },
          getItemSummary: (item) => item.label,
        },
        bgColor: { type: "text", label: "Background color" },
        textColor: { type: "text", label: "Text color" },
      },
      defaultProps: footerBlockDefaults,
      render: renderBlock(FooterBlock),
    },
  },
  root: {
    fields: {
      backgroundColor: { type: "text", label: "Page background" },
      contentWidth: {
        type: "number",
        label: "Content width (px)",
        min: 320,
        max: 800,
      },
      fontFamily: { type: "text", label: "Font family" },
      preheader: { type: "text", label: "Inbox preview text" },
    },
    defaultProps: rootDefaults,
    render: ({
      children,
      backgroundColor,
      contentWidth,
      fontFamily,
      preheader,
      puck,
    }) => {
      if (!puck.isEditing) {
        return (
          <EmailLayout
            preheader={preheader}
            backgroundColor={backgroundColor}
            contentWidth={contentWidth}
            fontFamily={fontFamily}
          >
            {children}
          </EmailLayout>
        );
      }

      return (
        <>
          <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />
          <div
            style={{
              minHeight: "100%",
              padding: theme.space[3],
              backgroundColor: theme.color.surface,
              boxSizing: "border-box",
            }}
          >
            <div
              className="email-container"
              style={{
                width: `${contentWidth}px`,
                maxWidth: "100%",
                minHeight: 320,
                margin: "0 auto",
                backgroundColor: theme.color.surface,
                color: theme.color.text,
                fontFamily,
              }}
            >
              {children}
            </div>
          </div>
        </>
      );
    },
  },
};

/** Starting draft: theme defaults and an empty canvas. */
export const initialData: EmailData = {
  root: { props: { ...rootDefaults } },
  content: [],
  zones: {},
};
