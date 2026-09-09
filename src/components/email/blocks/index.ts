/**
 * Barrel for all email block components.
 *
 * Each block exports a component, a typed props interface, and a `defaults`
 * object that the Puck config reuses directly as its `defaultProps`.
 */

export { HeroBlock, heroBlockDefaults } from "./HeroBlock";
export type { HeroBlockProps } from "./HeroBlock";

export { TextBlock, textBlockDefaults } from "./TextBlock";
export type { TextBlockProps, TextVariant } from "./TextBlock";

export { ImageBlock, imageBlockDefaults } from "./ImageBlock";
export type { ImageBlockProps } from "./ImageBlock";

export { ButtonBlock, buttonBlockDefaults } from "./ButtonBlock";
export type { ButtonBlockProps } from "./ButtonBlock";

export {
  ColumnsBlock,
  columnsBlockDefaults,
  clampColumnCount,
  MIN_COLUMNS,
  MAX_COLUMNS,
} from "./ColumnsBlock";
export type { ColumnsBlockProps } from "./ColumnsBlock";

export { DividerBlock, dividerBlockDefaults } from "./DividerBlock";
export type { DividerBlockProps } from "./DividerBlock";

export { SectionBlock, sectionBlockDefaults } from "./SectionBlock";
export type { SectionBlockProps } from "./SectionBlock";

export { FooterBlock, footerBlockDefaults } from "./FooterBlock";
export type { FooterBlockProps, FooterLink } from "./FooterBlock";
