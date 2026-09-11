"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ActionBar,
  Button,
  IconButton,
  createUsePuck,
  type Overrides,
} from "@puckeditor/core";
import { config } from "@/puck.config";
import { viewportForWidth, type PreviewViewport } from "@/lib/viewports";

const useEmailPuck = createUsePuck<typeof config>();

const iconProps = {
  "aria-hidden": true,
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
} as const;

function CopyIcon() {
  return (
    <svg {...iconProps}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg {...iconProps}>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 0 10h-4" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg {...iconProps}>
      <path d="M15 14l5-5-5-5" />
      <path d="M20 9H9a5 5 0 0 0 0 10h4" />
    </svg>
  );
}

function HistoryAndPageActions({
  onViewPage,
  onSend,
  onOpenProjects,
}: {
  onViewPage: (viewport: PreviewViewport) => void;
  onSend: () => void;
  onOpenProjects: () => void;
}) {
  const back = useEmailPuck((state) => state.history.back);
  const forward = useEmailPuck((state) => state.history.forward);
  const hasPast = useEmailPuck((state) => state.history.hasPast);
  const hasFuture = useEmailPuck((state) => state.history.hasFuture);
  const viewportWidth = useEmailPuck(
    (state) => state.appState.ui.viewports.current.width,
  );

  return (
    <div className="nautilus-header-actions">
      <div className="nautilus-history-actions" aria-label="Edit history">
        <IconButton
          type="button"
          title="Undo"
          disabled={!hasPast}
          onClick={back}
        >
          <UndoIcon />
        </IconButton>
        <IconButton
          type="button"
          title="Redo"
          disabled={!hasFuture}
          onClick={forward}
        >
          <RedoIcon />
        </IconButton>
      </div>
      <Button
        variant="secondary"
        onClick={() => onViewPage(viewportForWidth(viewportWidth))}
      >
        View Page
      </Button>
      <Button variant="secondary" onClick={onOpenProjects}>
        Save/Load
      </Button>
      <Button variant="primary" onClick={onSend}>
        Send
      </Button>
    </div>
  );
}

function SelectionToolbar() {
  const selectedItem = useEmailPuck((state) => state.selectedItem);
  const itemSelector = useEmailPuck((state) => state.appState.ui.itemSelector);
  const editorConfig = useEmailPuck((state) => state.config);
  const getPermissions = useEmailPuck((state) => state.getPermissions);
  const dispatch = useEmailPuck((state) => state.dispatch);

  // Read both halves of the selector into locals so the dispatch callbacks
  // below close over narrowed values instead of re-asserting non-null.
  const zone = itemSelector?.zone;
  const index = itemSelector?.index;
  if (!selectedItem || !zone || index === undefined) return null;

  const component = editorConfig.components[selectedItem.type];
  const label = component?.label ?? selectedItem.type;
  const permissions = getPermissions({ item: selectedItem });

  return (
    <div
      className="nautilus-selection-toolbar"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <ActionBar label={label}>
        <ActionBar.Action
          label="Duplicate"
          disabled={!permissions.duplicate}
          onClick={(event) => {
            event.stopPropagation();
            dispatch({ type: "duplicate", sourceIndex: index, sourceZone: zone });
          }}
        >
          <CopyIcon />
        </ActionBar.Action>
        <ActionBar.Action
          label="Delete"
          disabled={!permissions.delete}
          onClick={(event) => {
            event.stopPropagation();
            dispatch({ type: "remove", index, zone });
          }}
        >
          <TrashIcon />
        </ActionBar.Action>
      </ActionBar>
    </div>
  );
}

function StartOverButton({ onStartOver }: { onStartOver: () => void }) {
  return (
    <div className="nautilus-start-over">
      <IconButton type="button" title="Start over" onClick={onStartOver}>
        <TrashIcon />
      </IconButton>
    </div>
  );
}

/**
 * Hosts the editor and portals the start-over and selection actions into
 * Puck's canvas control band.
 *
 * Puck exposes no child slot there, so the band is located by its CSS module
 * class name. That couples this to Puck's internals: if the class is renamed
 * in a future release the portal simply no-ops and the editor still works.
 */
function EditorShell({
  children,
  onStartOver,
}: {
  children: React.ReactNode;
  onStartOver: () => void;
}) {
  const shellRef = React.useRef<HTMLDivElement>(null);
  const [controlsHost, setControlsHost] = React.useState<Element | null>(null);

  React.useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    let frame = 0;
    const syncControlsHost = () => {
      frame = 0;
      const nextHost = shell.querySelector('[class*="PuckCanvas-controls"]');
      setControlsHost((current) => (current === nextHost ? current : nextHost));
    };
    // Puck mutates the canvas on every drag frame; coalesce the lookups to one
    // per animation frame rather than one per mutation record.
    const scheduleSync = () => {
      if (frame) return;
      frame = requestAnimationFrame(syncControlsHost);
    };

    syncControlsHost();
    const observer = new MutationObserver(scheduleSync);
    observer.observe(shell, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={shellRef} className="nautilus-puck-shell">
      {children}
      {controlsHost
        ? createPortal(
            <>
              <StartOverButton onStartOver={onStartOver} />
              <SelectionToolbar />
            </>,
            controlsHost,
          )
        : null}
    </div>
  );
}

export function createEditorOverrides(
  onViewPage: (viewport: PreviewViewport) => void,
  onSend: () => void,
  onOpenProjects: () => void,
  onStartOver: () => void,
): Partial<Overrides<typeof config>> {
  return {
    actionBar: () => <></>,
    headerActions: () => (
      <HistoryAndPageActions
        onViewPage={onViewPage}
        onSend={onSend}
        onOpenProjects={onOpenProjects}
      />
    ),
    puck: ({ children }) => (
      <EditorShell onStartOver={onStartOver}>{children}</EditorShell>
    ),
  };
}
