"use client";

import * as React from "react";
import { Puck, legacySideBarPlugin } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import "./puck-editor.css";
import { EmailPreview } from "./EmailPreview";
import { createEditorOverrides } from "@/components/editor/PuckEditorChrome";
import { CrmProvider } from "@/components/crm/CrmProvider";
import { SendDialog } from "@/components/send/SendDialog";
import { SilentErrorBoundary } from "@/components/SilentErrorBoundary";
import { isEmailData } from "@/lib/email";
import { PUCK_VIEWPORTS, type PreviewViewport } from "@/lib/viewports";
import { config, initialData, type EmailData } from "@/puck.config";

const DRAFT_STORAGE_KEY = "nautilus-email-builder-draft";
const EDITOR_PLUGINS = [legacySideBarPlugin()];

function CrashNotice({ retry }: { retry: () => void }) {
  return (
    <div className="nautilus-crash-notice" role="alert">
      <p>That part of the editor stopped responding.</p>
      <button type="button" onClick={retry}>
        Try again
      </button>
    </div>
  );
}

export default function Home() {
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const [previewViewport, setPreviewViewport] =
    React.useState<PreviewViewport>("desktop");
  const [data, setData] = React.useState<EmailData>(initialData);
  const [draftLoaded, setDraftLoaded] = React.useState(false);
  const [sendOpen, setSendOpen] = React.useState(false);

  const openPreview = React.useCallback((viewport: PreviewViewport) => {
    setPreviewViewport(viewport);
    setIsPreviewing(true);
  }, []);
  const closePreview = React.useCallback(() => setIsPreviewing(false), []);
  const openSend = React.useCallback(() => setSendOpen(true), []);
  const closeSend = React.useCallback(() => setSendOpen(false), []);
  const editorOverrides = React.useMemo(
    () => createEditorOverrides(openPreview, openSend),
    [openPreview, openSend],
  );

  React.useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsedDraft: unknown = JSON.parse(savedDraft);
        if (isEmailData(parsedDraft)) {
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
            config={config}
            data={data}
            onChange={setData}
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

      {isPreviewing ? (
        <div className="nautilus-page-preview">
          <header className="nautilus-preview-header">
            <h1>View Page</h1>
            <button type="button" onClick={closePreview}>
              Edit
            </button>
          </header>
          <SilentErrorBoundary
            fallback={(retry) => <CrashNotice retry={retry} />}
          >
            <EmailPreview data={data} viewport={previewViewport} />
          </SilentErrorBoundary>
        </div>
      ) : null}

      <SilentErrorBoundary>
        <SendDialog data={data} open={sendOpen} onClose={closeSend} />
      </SilentErrorBoundary>
    </CrmProvider>
  );
}
