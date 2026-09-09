/**
 * Personalization variables.
 *
 * Tokens use the `{{key}}` syntax and may appear in any text (block content,
 * subject lines, etc.). Values come from the CRM (see `crm.ts`) and are
 * substituted server-side before the email is handed to Resend/Temporal.
 */

/**
 * Matches `{{ key }}` with optional surrounding whitespace; the key is word or
 * dot characters. Module-private because it is stateful: a global regex tracks
 * `lastIndex`, so sharing it across callers leaks position between calls.
 * `String.replace` resets that index, which is why `substituteVariables` is
 * safe to call repeatedly.
 */
const TOKEN_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

export type MissingTokenStrategy = "blank" | "keep";

export interface SubstituteOptions {
  /** What to do with tokens that have no matching attribute. Default: "blank". */
  onMissing?: MissingTokenStrategy;
}

/**
 * Replace `{{token}}` occurrences in `text` with values from `attributes`.
 * Missing tokens are blanked by default, or left intact with `onMissing: "keep"`.
 */
export function substituteVariables(
  text: string,
  attributes: Record<string, string | undefined>,
  options: SubstituteOptions = {},
): string {
  const onMissing = options.onMissing ?? "blank";
  return text.replace(TOKEN_PATTERN, (whole, key: string) => {
    const value = attributes[key];
    if (value !== undefined && value !== null) return String(value);
    return onMissing === "keep" ? whole : "";
  });
}
