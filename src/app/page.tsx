"use client";

import * as React from "react";
import { Puck, legacySideBarPlugin } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import "./puck-editor.css";
import { PreviewOverlay } from "./PreviewOverlay";
import { CrashNotice } from "@/components/CrashNotice";
import { createEditorOverrides } from "@/components/editor/PuckEditorChrome";
import { CrmProvider } from "@/components/crm/CrmProvider";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { SendDialog } from "@/components/send/SendDialog";
import { SilentErrorBoundary } from "@/components/SilentErrorBoundary";
import { findColumnRuleViolation } from "@/lib/column-rules";
import { isEmailData } from "@/lib/email";
import { PUCK_VIEWPORTS, type PreviewViewport } from "@/lib/viewports";
import { config, initialData, type EmailData } from "@/puck.config";

const DRAFT_STORAGE_KEY = "nautilus-email-builder-draft";
const EDITOR_PLUGINS = [legacySideBarPlugin()];

/** How long a rejected-edit message stays on screen, in ms. */
const EDIT_ERROR_TIMEOUT = 3000;

export default function Home() {
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const [previewViewport, setPreviewViewport] =
    React.useState<PreviewViewport>("desktop");
  const [data, setData] = React.useState<EmailData>(initialData);
  const [puckKey, setPuckKey] = React.useState(0);
  const [draftLoaded, setDraftLoaded] = React.useState(false);
  const [sendOpen, setSendOpen] = React.useState(false);
  const [projectsOpen, setProjectsOpen] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  // The last draft that satisfied the column rules; a rejected edit rewinds to
  // it, which is what removes the offending block from Puck's canvas.
  const lastValidData = React.useRef<EmailData>(initialData);
  const errorTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showEditError = React.useCallback((message: string) => {
    if (errorTimeout.current) clearTimeout(errorTimeout.current);
    setEditError(message);
    errorTimeout.current = setTimeout(
      () => setEditError(null),
      EDIT_ERROR_TIMEOUT,
    );
  }, []);

  React.useEffect(
    () => () => {
      if (errorTimeout.current) clearTimeout(errorTimeout.current);
    },
    [],
  );

  const commitData = React.useCallback(
    (next: EmailData) => {
      const violation = findColumnRuleViolation(next);
      if (violation) {
        showEditError(violation);
        // A fresh object identity is required: Puck has already applied the
        // rejected edit internally, and re-sending the same reference would
        // bail out of the render that rewinds its canvas.
        setData({ ...lastValidData.current });
        return;
      }

      lastValidData.current = next;
      setData(next);
    },
    [showEditError],
  );

  const openPreview = React.useCallback((viewport: PreviewViewport) => {
    setPreviewViewport(viewport);
    setIsPreviewing(true);
  }, []);
  const closePreview = React.useCallback(() => setIsPreviewing(false), []);
  const openSend = React.useCallback(() => setSendOpen(true), []);
  const closeSend = React.useCallback(() => setSendOpen(false), []);
  const openProjects = React.useCallback(() => setProjectsOpen(true), []);
  const closeProjects = React.useCallback(() => setProjectsOpen(false), []);

  const loadProjectData = React.useCallback((loaded: EmailData) => {
    lastValidData.current = loaded;
    setData(loaded);
    setPuckKey((k) => k + 1);
  }, []);

  const startOver = React.useCallback(() => {
    lastValidData.current = initialData;
    setData(initialData);
    setPuckKey((k) => k + 1);
    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // The in-memory reset is what the user asked for; storage catches up on
      // the next change.
    }
  }, []);

  const editorOverrides = React.useMemo(
    () => createEditorOverrides(openPreview, openSend, openProjects, startOver),
    [openPreview, openSend, openProjects, startOver],
  );

  React.useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsedDraft: unknown = JSON.parse(savedDraft);
        if (isEmailData(parsedDraft)) {
          lastValidData.current = parsedDraft;
          setData(parsedDraft);
        }
      }
    } catch {
      // A malformed or unavailable draft should not prevent opening the editor.
    } finally {
      setDraftLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    if (!draftLoaded) return;

    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Editing should continue when browser storage is unavailable or full.
    }
  }, [data, draftLoaded]);

  return (
    <CrmProvider>
      {/*
        The editor stays mounted while previewing so Puck keeps its undo
        history, selection, and canvas scroll; `inert` takes the covered
        editor out of the tab order and the accessibility tree.
      */}
      <div className="nautilus-editor-pane" inert={isPreviewing}>
        <SilentErrorBoundary
          fallback={(retry) => <CrashNotice retry={retry} />}
        >
          <Puck
            key={puckKey}
            config={config}
            data={data}
            onChange={commitData}
            plugins={EDITOR_PLUGINS}
            overrides={editorOverrides}
            viewports={PUCK_VIEWPORTS}
            ui={{
              leftSideBarVisible: true,
              rightSideBarVisible: true,
            }}
            headerTitle="Nautilus Example"
            height="100vh"
          />
        </SilentErrorBoundary>
      </div>

      {editError ? (
        <div className="nautilus-edit-error" role="alert">
          {editError}
        </div>
      ) : null}

      {isPreviewing ? (
        <PreviewOverlay
          data={data}
          viewport={previewViewport}
          onEdit={closePreview}
        />
      ) : null}

      <SilentErrorBoundary>
        <SendDialog data={data} open={sendOpen} onClose={closeSend} />
      </SilentErrorBoundary>

      <SilentErrorBoundary>
        <ProjectDialog
          data={data}
          open={projectsOpen}
          onClose={closeProjects}
          onLoad={loadProjectData}
        />
      </SilentErrorBoundary>
    </CrmProvider>
  );
}
