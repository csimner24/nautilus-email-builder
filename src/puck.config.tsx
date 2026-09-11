import * as React from "react";
import type {
  Config,
  Data,
  Fields,
  Slot,
  SlotComponent,
} from "@puckeditor/core";
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
  MAX_NESTED_COLUMNS,
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
  // Optional because only the declared column count is exposed as a field;
  // see `columnsFields`.
  col1?: Slot;
  col2?: Slot;
  col3?: Slot;
  col4?: Slot;
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

const columnSlotKeys = ["col1", "col2", "col3", "col4"] as const;

/**
 * Nesting depth of the Columns block currently rendering: 0 at the email root,
 * 1 inside a top-level column, and so on.
 */
const ColumnDepthContext = React.createContext(0);

/**
 * A slot is declared as data (`Slot`) but arrives at render as the component
 * Puck builds for it, so the renderer's props differ from the editor's.
 */
type ColumnsRenderProps = Omit<
  ColumnsEditorProps,
  (typeof columnSlotKeys)[number]
> & {
  col1?: SlotComponent;
  col2?: SlotComponent;
  col3?: SlotComponent;
  col4?: SlotComponent;
};

function ColumnsRenderer({
  columns,
  col1,
  col2,
  col3,
  col4,
  gap,
  stackOnMobile,
}: ColumnsRenderProps) {
  const depth = React.useContext(ColumnDepthContext);
  // A nested Columns block is capped at two columns. Three or more inside an
  // already-narrow cell is the shape that breaks the renderer, so clamp here
  // as well as in `findColumnRuleViolation` — a draft restored from storage
  // reaches this render without passing through the editor's change guard.
  const count = Math.min(
    clampColumnCount(columns),
    depth > 0 ? MAX_NESTED_COLUMNS : MAX_COLUMNS,
  );

  // Four slots always exist so content survives a column-count change;
  // only the first `count` of them are rendered.
  const slots = [col1, col2, col3, col4];
  const cells = slots
    .slice(0, count)
    .map((Cell, index) =>
      Cell ? <Cell key={index} minEmptyHeight={64} /> : null,
    );

  return (
    <ColumnDepthContext.Provider value={depth + 1}>
      <ColumnsBlock gap={gap} stackOnMobile={stackOnMobile} cells={cells} />
    </ColumnDepthContext.Provider>
  );
}

/**
 * Fields for a Columns block, exposing exactly `count` slots in ascending
 * order.
 *
 * All four slots stay in the data so content survives a column-count change,
 * but Puck derives both the properties panel and the outline from the declared
 * fields — so columns beyond the count stay out of both.
 */
function columnsFields(count: number): Fields<ColumnsEditorProps> {
  const slotFields = Object.fromEntries(
    columnSlotKeys.slice(0, count).map((key) => [key, { type: "slot" }]),
  ) as Pick<Fields<ColumnsEditorProps>, (typeof columnSlotKeys)[number]>;

  return {
    columns: {
      type: "number",
      label: "Columns",
      min: MIN_COLUMNS,
      max: MAX_COLUMNS,
    },
    ...slotFields,
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
  };
}

const rootDefaults: EmailRootProps = {
  backgroundColor: theme.color.surface,
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
      fields: columnsFields(MIN_COLUMNS),
      resolveFields: (data) =>
        columnsFields(clampColumnCount(data.props.columns)),
      defaultProps: {
        ...columnsBlockDefaults,
        columns: MIN_COLUMNS,
        col1: [],
        col2: [],
        col3: [],
        col4: [],
      },
      render: ({ columns, col1, col2, col3, col4, gap, stackOnMobile }) => (
        <ColumnsRenderer
          columns={columns}
          col1={col1}
          col2={col2}
          col3={col3}
          col4={col4}
          gap={gap}
          stackOnMobile={stackOnMobile}
        />
      ),
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
          {/*
            Half the canvas rather than all of it: an empty email starts as a
            compact card and the drop target grows with the content added.
          */}
          <div
            style={{
              minHeight: "50vh",
              backgroundColor,
              boxSizing: "border-box",
            }}
          >
            <div
              className="email-container"
              style={{
                width: `${contentWidth}px`,
                maxWidth: "100%",
                margin: "0 auto",
                backgroundColor: "transparent",
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
