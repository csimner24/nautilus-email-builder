# Project Plan — Nautilus Email Builder

A visual, drag-and-drop email builder that lets users compose, preview, and send
(or schedule) emails. Built on Next.js (App Router) + Puck + React Email + Resend,
with Temporal for durable scheduling.

> This plan is a living document. Update it as decisions change and tasks complete.

---

## 1. Requirements

### Tier 1 — Must Have
- **Drag & Drop Email Builder** — Puck editor with React Email components
  (Button, Heading, Text, Image, Container, Section, etc.).
- **Component Property Editing** — Sidebar editing for colors, typography, sizing,
  image URLs, content & links. (Puck auto-generates this from each component's `fields`.)
- **Live Email Preview** — Real-time preview that updates as the user edits.
- **Email Sending** — Send via Resend with recipient input, subject line, and
  status notifications.
- **WYSIWYG** — Parity between the editor canvas and the actually-sent email.

### Tier 2 — Expected
- **Email Scheduling** — Durable workflow via Temporal with date/time picker,
  scheduled email list, and cancellation.
- **Desktop & Mobile Preview** — Toggle between preview widths (600px / 375px).

### Tier 3 — Impress Us
- 3–5 quality-of-life improvements (e.g. personalization variables, templates,
  test-send-to-self, undo/redo, etc.).

---

## 2. Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | Application framework |
| TypeScript (strict) | Type safety |
| React Email (`@react-email/components`) | Email-safe components |
| Resend | Email delivery |
| Puck (`@puckeditor/core@0.21.1`) | Drag & drop builder |
| Temporal (`@temporalio/*`) | Durable scheduling |

---

## 3. Architecture Decisions

### 3.1 Sending model — **Option A** (chosen)
- **Send now** → `POST /api/send` → Resend directly.
- **Schedule** → `POST /api/schedule` → start a Temporal workflow → worker sleeps
  until send time → activity calls Resend.
- Rationale: Temporal is scoped to exactly where it adds value (durable scheduling +
  cancellation). Immediate sends stay simple and are demoable without a running worker.

### 3.2 WYSIWYG parity — single source of truth
- The Puck `config` + `data` (JSON) drives **both** the on-screen canvas **and** the
  sent email.
- Flow:
  ```
  Puck data (JSON) ──> <Render config data> ──> @react-email/render ──> HTML ──> Resend
          ▲                                                                   │
          └──────────── same config powers the on-screen canvas ─────────────┘
  ```
- **Server-side render:** the HTML string for the email is produced in the API route
  (`@react-email/render`, which is async in React Email v1+), not in the browser.
  This keeps output email-safe and env-secure.

### 3.3 Editor + Preview UI — one page with a toggle
- Single page with `mode: 'edit' | 'preview'` state.
- **Edit:** mount `<Puck config data onChange={setData} />` (the `onChange` keeps
  `data` live so preview is real-time).
- **Preview:** mount `<Render config data />` inside a **fixed-width container**
  (no palette/sidebar). The same container doubles as the **desktop/mobile width
  toggle** (600px vs 375px).
- We are **not** making the Puck editor itself work on mobile (out of scope / overkill).

### 3.4 Send UI
- A send component sits next to the preview: a dropdown/panel containing
  **recipient**, **subject**, **timing** (send now vs. a scheduled time → Temporal),
  and the final **send** button.
- Status notifications (success/error) surface from the API response.

### 3.5 Puck is headless — we build all components
- `@puckeditor/core` ships **zero** content components. It provides the editor shell
  (`Puck`), the read-only renderer (`Render`), slots (`DropZone`/`slot` field), and
  field/UI primitives — but no Navbar/Footer/Grid/etc.
- The component catalog on the Puck demo site is example code, not part of the library.
- Therefore we **define all components from scratch**, each a thin wrapper around a
  React Email primitive.

### 3.6 Deployment (Vercel) — Temporal worker constraint
- Next.js app (UI + API routes) → **Vercel**.
- Temporal **Worker** is a long-lived polling process and **cannot** run on Vercel
  (serverless). It must run elsewhere: **Railway / Fly.io / Render / local machine**.
- Temporal **Server**: local dev via `temporal server start-dev`; Temporal Cloud
  ($1,000 free credits / 90 days) only if we host scheduling for a deployed demo.

---

## 4. Components to Build

Draggable Puck blocks, each wrapping React Email primitive(s).

| Block | React Email primitive(s) | Type | Notes |
|---|---|---|---|
| `HeroBlock` | `Section` + `Img` + `Heading` + `Button` | Composite | Prominent header: image + title + CTA |
| `TextBlock` | `Text` / `Heading` | Primitive-ish | Rich text; hosts VariablePicker tokens |
| `ImageBlock` | `Img` | Primitive | Image URL, alt, width, alignment |
| `ButtonBlock` | `Button` | Primitive | Label, href, colors, alignment |
| `ColumnsBlock` | `Row` + `Column` | Composite + **slots** | Side-by-side layout; the one real eng task |
| `DividerBlock` | `Hr` | Primitive | Visual separation |
| `SectionBlock` | `Section`/`Container` + slot | Container | Generic container w/ background + padding; satisfies the required "Container/Section" primitives and gives power users flexibility |
| `FooterBlock` | `Section` + `Text` + `Link` | Composite | Branding, unsubscribe, company info, optional socials |

### Cross-cutting (not draggable blocks)
- **Root config** (Puck `root.fields`) — email-wide settings: background color, content
  width (600px), font family, and **preheader** (`<Preview>` text). Cheap polish.
- **VariablePicker** — personalization tokens like `{{firstName}}`. This is **not** a
  draggable block; it's:
  - a toolbar/insert action inside `TextBlock`'s rich-text editor (Puck bundles TipTap), and
  - a **server-side substitution** step in the send route (Resend does not merge
    variables for a single transactional send).
  - Requires a **variables data source** (a small panel / per-recipient values).
  - Scope as **Tier 3**, after Tier 1/2 are solid.

### Catalog overview
```
EmailBuilder (root: bg color, width, font, preheader)
├── HeroBlock        (composite: image + title + CTA)
├── TextBlock        (rich text; hosts VariablePicker tokens)
├── ImageBlock
├── ButtonBlock
├── ColumnsBlock     (slots ← the tricky one)
├── DividerBlock
├── SectionBlock     (generic container w/ slot — satisfies "Section/Container")
└── FooterBlock      (composite: text + links, optional socials)
```

### Component definition pattern
Each block is a Puck component with `fields` (auto-generates the sidebar editor),
`defaultProps`, and a `render` that returns React Email primitives. The same `render`
powers both the canvas and the sent email.

```tsx
Button: {
  fields: {
    label: { type: "text" },
    href: { type: "text" },
    bgColor: { type: "text" },     // swap for a custom color picker later
    textColor: { type: "text" },
    align: { type: "radio", options: [/* left | center | right */] },
  },
  defaultProps: { label: "Click me", href: "https://example.com",
                  bgColor: "#2563eb", textColor: "#ffffff", align: "center" },
  render: ({ label, href, bgColor, textColor, align }) => (/* <EmailButton .../> */),
}
```

**ColumnsBlock slots** are the one non-boilerplate piece — each column is a `slot`
field (nested `DropZone`) so users can drop any block into it:
```tsx
ColumnsBlock: {
  fields: {
    columns: { type: "select", options: [{label:"2", value:2}, {label:"3", value:3}] },
    left:  { type: "slot" },
    right: { type: "slot" },
  },
  render: ({ left: Left, right: Right }) => (/* <Row><Column><Left/></Column>... */),
}
```

---

## 5. Proposed File Structure

| File | Purpose | Requirement |
|---|---|---|
| `puck.config.tsx` | Component definitions + fields + root config | Tier 1 #1, #2 |
| `components/email/*.tsx` | React Email components used in `render` (optional; can inline) | Tier 1 #1 |
| `app/page.tsx` | Editor + preview (mode toggle) + send panel | Tier 1 #1, #3, #4 |
| `app/api/send/route.ts` | Render Puck data → HTML → Resend (send now) | Tier 1 #4 |
| `app/api/schedule/route.ts` | Start Temporal workflow (scheduled send) | Tier 2 |
| `app/api/schedule/cancel/route.ts` | Signal workflow to cancel | Tier 2 |
| `lib/resend.ts` | Resend client init from env | Tier 1 #4 |
| `lib/temporal/client.ts` | Temporal client connection | Tier 2 |
| `temporal/workflows.ts` | `scheduleEmailWorkflow` (sleep-until + cancel signal) | Tier 2 |
| `temporal/activities.ts` | `sendEmailActivity` (calls Resend) | Tier 2 |
| `temporal/worker.ts` | Long-running worker process | Tier 2 |

---

## 6. Environment Variables (`.env.local`)

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | API key from resend.com (free tier: 3,000/mo, 100/day) |
| `RESEND_FROM_EMAIL` | Sender address (default `onboarding@resend.dev` for dev) |
| `TEMPORAL_ADDRESS` | Temporal server address (default `localhost:7233`) |

---

## 7. External Services

- **Resend** — required (Tier 1). Free tier is sufficient. No credit card needed.
  Dev sender `onboarding@resend.dev` only delivers to the account owner's email.
- **Temporal CLI** — required for Tier 2 local dev (`temporal server start-dev`).
- **Temporal Cloud** — optional; only for a deployed scheduling demo ($1k credits / 90 days).
- **Anthropic / LLM** — **not** required by the spec; only if we add a Tier 3 AI feature.

---

## 8. Suggested Build Order

1. **Puck config + React Email components** — Button, Text, Image, Divider, Section,
   Hero, Columns, Footer.
2. **Field definitions** — colors, typography, sizing, URLs, content, links (sidebar).
3. **Live preview** — Puck `onChange` keeps `data` live; canvas updates in real time.
4. **Editor/preview toggle** — clean full-screen `<Render>` in a fixed-width container.
5. **Send now** — `/api/send`: Puck data → `@react-email/render` → Resend + status UI.
6. **Desktop/mobile width toggle** (Tier 2, easy win alongside preview container).
7. **Temporal scheduling** — workflow + worker + schedule/cancel/list UI.
8. **Tier 3 QoL** — VariablePicker + substitution, templates, test-send, undo/redo, etc.

---

## 9. Open Questions / To Decide Later
- Where to store scheduled-send metadata (Vercel KV / SQLite / JSON) for the
  "scheduled email list" + cancellation UI.
- Whether to render the email via Puck's `<Render>` (accepts wrapper `div`s — fine for
  most clients) or walk `data.content` to emit pure table-based React Email markup
  (purist option) if output looks off in a real client.
- Hosting target for the Temporal worker when deploying (Railway / Fly.io / Render).
- Variables data model for personalization (per-recipient values vs. single test set).
