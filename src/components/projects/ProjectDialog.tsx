"use client";

import * as React from "react";
import type { EmailData } from "@/puck.config";
import { ContactForm } from "@/components/crm/ContactForm";
import { useCrm } from "@/components/crm/CrmProvider";
import { useDialogFocusTrap } from "@/components/ui/useDialogFocusTrap";
import { isValidEmail, normalizeEmail } from "@/lib/email";
import {
  listProjects,
  loadProject,
  saveProject,
  type Project,
} from "@/lib/projects";

type Notice = { kind: "success" | "error"; message: string } | null;

/**
 * `identify` collects the CRM email that namespaces the project list;
 * `profile` creates that contact when it is missing; `library` is the list.
 */
type Step = "identify" | "profile" | "library";

interface ProjectDialogProps {
  /** The draft a save writes out. */
  data: EmailData;
  open: boolean;
  onClose: () => void;
  /** Hands a loaded draft back to the editor. */
  onLoad: (data: EmailData) => void;
}

export function ProjectDialog({
  data,
  open,
  onClose,
  onLoad,
}: ProjectDialogProps) {
  const { getContact } = useCrm();
  const cardRef = useDialogFocusTrap(open, onClose);

  const [step, setStep] = React.useState<Step>("identify");
  const [emailInput, setEmailInput] = React.useState("");
  const [namespace, setNamespace] = React.useState("");
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selected, setSelected] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [notice, setNotice] = React.useState<Notice>(null);

  // Each visit starts at the email step so the namespace is always confirmed.
  React.useEffect(() => {
    if (!open) return;
    setStep("identify");
    setNotice(null);
    setNewName("");
  }, [open]);

  if (!open) return null;

  const openLibrary = (email: string) => {
    const found = listProjects(email);
    setNamespace(normalizeEmail(email));
    setProjects(found);
    setSelected(found[0]?.name ?? "");
    setStep("library");
    setNotice(null);
  };

  const identify = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValidEmail(emailInput)) {
      setNotice({ kind: "error", message: "Enter a valid email address." });
      return;
    }
    if (!getContact(emailInput)) {
      setNotice({
        kind: "error",
        message: "No CRM profile uses that email. Create one to continue.",
      });
      return;
    }
    openLibrary(emailInput);
  };

  const handleSave = () => {
    const name = newName.trim();
    if (!name) {
      setNotice({ kind: "error", message: "Name your project to save it." });
      return;
    }
    if (!saveProject(namespace, name, data)) {
      setNotice({
        kind: "error",
        message: "Browser storage rejected the save.",
      });
      return;
    }
    onClose();
  };

  const handleLoad = () => {
    if (!selected) {
      setNotice({ kind: "error", message: "Select a project to load." });
      return;
    }
    const saved = loadProject(namespace, selected);
    if (!saved) {
      setNotice({ kind: "error", message: "That project could not be read." });
      return;
    }
    onLoad(saved);
    onClose();
  };

  return (
    <div
      className="send-dialog__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        className="send-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-dialog-title"
      >
        <header className="send-dialog__header">
          <div>
            <p className="send-dialog__eyebrow">Project library</p>
            <h2 id="project-dialog-title">Save or load an email</h2>
          </div>
          <button
            type="button"
            className="send-dialog__close"
            onClick={onClose}
            aria-label="Close project dialog"
          >
            ×
          </button>
        </header>

        <div className="send-dialog__body">
          {notice ? (
            <div
              className={`send-dialog__notice send-dialog__notice--${notice.kind}`}
              role={notice.kind === "error" ? "alert" : "status"}
            >
              {notice.message}
            </div>
          ) : null}

          {step === "identify" ? (
            <>
              <form className="send-dialog__form" onSubmit={identify}>
                <label>
                  Your CRM email
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(event) => setEmailInput(event.target.value)}
                    placeholder="ada@example.com"
                    autoComplete="email"
                    required
                  />
                </label>
                <p className="send-dialog__hint">
                  Projects are saved against a CRM profile, so the same email
                  brings back the same library.
                </p>
                <button className="send-dialog__primary" type="submit">
                  Continue
                </button>
              </form>
              <section className="project-dialog__section">
                <div className="send-dialog__section-heading">
                  <h3>No profile yet?</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("profile");
                      setNotice(null);
                    }}
                  >
                    Create profile
                  </button>
                </div>
              </section>
            </>
          ) : null}

          {step === "profile" ? (
            <>
              <p className="send-dialog__hint">
                Add yourself to the CRM to start a project library.
              </p>
              <ContactForm
                initialEmail={emailInput}
                submitLabel="Create profile"
                onError={(message) => setNotice({ kind: "error", message })}
                onSaved={(contact) => openLibrary(contact.email)}
              />
            </>
          ) : null}

          {step === "library" ? (
            <>
              <div className="send-dialog__section-heading">
                <h3>Projects for {namespace}</h3>
                <button type="button" onClick={() => setStep("identify")}>
                  Change email
                </button>
              </div>

              <div className="send-dialog__form">
                <label>
                  Saved projects
                  <select
                    value={selected}
                    onChange={(event) => setSelected(event.target.value)}
                    disabled={!projects.length}
                  >
                    {projects.length ? (
                      projects.map((project) => (
                        <option key={project.name} value={project.name}>
                          {project.name} —{" "}
                          {new Date(project.savedAt).toLocaleString()}
                        </option>
                      ))
                    ) : (
                      <option value="">No saved projects</option>
                    )}
                  </select>
                </label>
                <button
                  className="send-dialog__primary"
                  type="button"
                  onClick={handleLoad}
                  disabled={!projects.length}
                >
                  Load project
                </button>
              </div>

              <section className="project-dialog__section">
                <h3>New save</h3>
                <div className="send-dialog__form">
                  <label>
                    Project name
                    <input
                      value={newName}
                      onChange={(event) => setNewName(event.target.value)}
                      placeholder="Spring newsletter"
                    />
                  </label>
                  <p className="send-dialog__hint">
                    Saves the email currently open in the editor. Reusing a name
                    overwrites that project.
                  </p>
                  <button
                    className="send-dialog__primary"
                    type="button"
                    onClick={handleSave}
                  >
                    Save project
                  </button>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
