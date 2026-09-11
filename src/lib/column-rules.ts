/**
 * Structural limits on nested Columns blocks.
 *
 * Splitting a column's cell three or more ways breaks the email renderer, so
 * the editor rejects the change before it is committed. `ColumnsRenderer` in
 * `puck.config` clamps the same limit at render time, which covers drafts
 * restored from storage that never passed through this guard.
 */

import {
  MAX_COLUMNS_BLOCKS_PER_CELL,
  MAX_NESTED_COLUMNS,
} from "@/components/email/blocks";
import type { EmailData } from "@/puck.config";

const COLUMNS_TYPE = "ColumnsBlock";

interface TreeItem {
  type: string;
  props?: Record<string, unknown>;
}

function isTreeItem(value: unknown): value is TreeItem {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as TreeItem).type === "string"
  );
}

/**
 * The item's slot props, as `[slotName, children]` pairs.
 *
 * A slot is stored as an array of child items, which distinguishes it from an
 * `array` field such as the footer's links: those entries carry no `type`.
 */
function slotEntries(item: TreeItem): [string, TreeItem[]][] {
  return Object.entries(item.props ?? {}).filter(
    (entry): entry is [string, TreeItem[]] =>
      Array.isArray(entry[1]) && entry[1].every(isTreeItem),
  );
}

function findViolation(
  items: TreeItem[],
  insideColumn: boolean,
): string | null {
  for (const item of items) {
    const isColumns = item.type === COLUMNS_TYPE;

    if (isColumns && insideColumn) {
      const columns = Number(item.props?.columns);
      if (Number.isFinite(columns) && columns > MAX_NESTED_COLUMNS) {
        return `A columns block inside a column can have at most ${MAX_NESTED_COLUMNS} columns.`;
      }
    }

    for (const [, children] of slotEntries(item)) {
      if (isColumns) {
        const nested = children.filter(
          (child) => child.type === COLUMNS_TYPE,
        ).length;
        if (nested > MAX_COLUMNS_BLOCKS_PER_CELL) {
          return `A column can hold at most ${MAX_COLUMNS_BLOCKS_PER_CELL} columns block.`;
        }
      }

      const violation = findViolation(children, insideColumn || isColumns);
      if (violation) return violation;
    }
  }

  return null;
}

/**
 * The first broken column rule in `data`, or `null` when the draft is valid.
 *
 * The message is written for the editor's error banner.
 */
export function findColumnRuleViolation(data: EmailData): string | null {
  const tree = data as unknown as {
    content?: unknown;
    zones?: Record<string, unknown>;
  };

  const content = Array.isArray(tree.content)
    ? tree.content.filter(isTreeItem)
    : [];
  const violation = findViolation(content, false);
  if (violation) return violation;

  // Legacy DropZones carry no ancestry in their key, so they are checked
  // without nesting context; the render-time clamp is the backstop there.
  for (const zone of Object.values(tree.zones ?? {})) {
    if (!Array.isArray(zone)) continue;
    const zoneViolation = findViolation(zone.filter(isTreeItem), false);
    if (zoneViolation) return zoneViolation;
  }

  return null;
}
