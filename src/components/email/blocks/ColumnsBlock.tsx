import * as React from "react";
import { Section, Row, Column } from "@react-email/components";
import { theme } from "../theme";

export const MIN_COLUMNS = 2;
export const MAX_COLUMNS = 4;

/**
 * Column cap for a Columns block nested inside another column's cell.
 *
 * Splitting an already-narrow cell three or more ways is unsupported, so
 * nesting stays binary however deep it goes.
 */
export const MAX_NESTED_COLUMNS = 2;

/** A column's cell may hold at most this many Columns blocks. */
export const MAX_COLUMNS_BLOCKS_PER_CELL = 1;

const MIN_GAP = 0;
const MAX_GAP = 64;

export interface ColumnsBlockProps {
  /** Column contents; length determines the column count. */
  cells: React.ReactNode[];
  /** Horizontal gap between columns, in px. */
  gap?: number;
  /** Stack columns to full width below the 600px desktop email viewport. */
  stackOnMobile?: boolean;
}

export const columnsBlockDefaults = {
  gap: 16,
  stackOnMobile: true,
} as const satisfies Pick<ColumnsBlockProps, "gap" | "stackOnMobile">;

/** Clamp an editor-supplied column count into the supported range. */
export function clampColumnCount(value: number | undefined): number {
  const rounded = Math.round(value ?? MIN_COLUMNS);
  if (Number.isNaN(rounded)) return MIN_COLUMNS;
  return Math.min(Math.max(rounded, MIN_COLUMNS), MAX_COLUMNS);
}

/**
 * Side-by-side layout using an email-safe table (Row + Column).
 *
 * On mobile, `.stack-col` + the shared media query collapse the columns to
 * full width so content wraps instead of squeezing.
 */
export function ColumnsBlock({
  cells,
  gap = columnsBlockDefaults.gap,
  stackOnMobile = columnsBlockDefaults.stackOnMobile,
}: ColumnsBlockProps) {
  const columns = cells ?? [];
  const columnCount = Math.max(columns.length, 1);
  const columnWidth = `${(100 / columnCount).toFixed(4)}%`;
  const halfGap = Math.round(Math.min(Math.max(gap, MIN_GAP), MAX_GAP) / 2);

  return (
    <Section style={{ padding: `${theme.space[1]} ${theme.space[2]}` }}>
      <Row style={{ tableLayout: "fixed" }}>
        {columns.map((cell, index) => (
          // Position IS the identity of a column, so the index is a stable key.
          <Column
            key={index}
            className={stackOnMobile ? "stack-col" : undefined}
            style={{
              width: columnWidth,
              verticalAlign: "top",
              paddingLeft: index === 0 ? 0 : halfGap,
              paddingRight: index === columnCount - 1 ? 0 : halfGap,
              boxSizing: "border-box",
            }}
          >
            {cell}
          </Column>
        ))}
      </Row>
    </Section>
  );
}
