/**
 * Saved email configurations ("projects"), grouped per CRM contact.
 *
 * The contact's email is the namespace, so a project list is only reachable
 * once the user has identified themselves against the CRM. Storage is the
 * browser's `localStorage`, matching how the draft and the CRM itself persist;
 * every read is defensive because that store is shared, user-editable, and may
 * be unavailable entirely.
 */

import { isEmailData, normalizeEmail } from "@/lib/email";
import type { EmailData } from "@/puck.config";

const PROJECTS_STORAGE_KEY = "nautilus-email-builder-projects";

export interface Project {
  name: string;
  data: EmailData;
  /** Last save time, ISO-8601. */
  savedAt: string;
}

/** Namespace (contact email) -> project name -> project. */
type ProjectStore = Record<string, Record<string, Project>>;

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Project>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.savedAt === "string" &&
    isEmailData(candidate.data)
  );
}

function readStore(): ProjectStore {
  try {
    const saved = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!saved) return {};

    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") return {};

    // Rebuilt entry by entry so one corrupt project cannot discard the rest.
    const store: ProjectStore = {};
    for (const [namespace, projects] of Object.entries(parsed)) {
      if (!projects || typeof projects !== "object") continue;
      const valid = Object.entries(projects).filter(
        (entry): entry is [string, Project] => isProject(entry[1]),
      );
      if (valid.length) store[namespace] = Object.fromEntries(valid);
    }
    return store;
  } catch {
    return {};
  }
}

function writeStore(store: ProjectStore): boolean {
  try {
    window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

/** Projects saved under `email`, newest save first. */
export function listProjects(email: string): Project[] {
  const namespace = normalizeEmail(email);
  return Object.values(readStore()[namespace] ?? {}).sort((a, b) =>
    b.savedAt.localeCompare(a.savedAt),
  );
}

/**
 * Save `data` under `email` as `name`, replacing any project of that name.
 * Returns false when browser storage rejected the write.
 */
export function saveProject(
  email: string,
  name: string,
  data: EmailData,
): boolean {
  const namespace = normalizeEmail(email);
  const projectName = name.trim();
  if (!namespace || !projectName) return false;

  const store = readStore();
  return writeStore({
    ...store,
    [namespace]: {
      ...store[namespace],
      [projectName]: {
        name: projectName,
        data,
        savedAt: new Date().toISOString(),
      },
    },
  });
}

/** The named project's draft, or undefined when it is missing or unreadable. */
export function loadProject(
  email: string,
  name: string,
): EmailData | undefined {
  return readStore()[normalizeEmail(email)]?.[name]?.data;
}
