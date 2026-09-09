# Email Builder with Drag & Drop

**Nautilus Engineering · Full-Stack Engineer Take-Home**

## Getting Started

### Option A: Fork (recommended)

1. Click **Fork** on this repo to create your own copy
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/nautilus-email-builder.git
   cd nautilus-email-builder
   ```

### Option B: Clone directly

```bash
git clone https://github.com/xxxoooxoxo/nautilus-email-builder.git
cd nautilus-email-builder
```

> **⚠️ Important:** Do **not** push to this repository. Work on your own fork or a local copy only. If you cloned directly, remove the remote before starting:
> ```bash
> git remote remove origin
> ```

---

## Overview

A visual email builder that lets users compose, preview, and send emails using a drag-and-drop interface.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 15+ (App Router) | Application framework |
| TypeScript (strict) | Type safety |
| React Email | Email-safe components |
| Resend | Email delivery |
| Puck Editor | Drag & drop builder |
| Temporal | Durable scheduling |

## Setup

```bash
# Install dependencies
npm install

# Copy env vars
cp .env.example .env.local
# Fill in your RESEND_API_KEY, etc.

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) |
| `RESEND_FROM_EMAIL` | Sender email address (default: `onboarding@resend.dev`) |
| `TEMPORAL_ADDRESS` | Temporal server address (default: `localhost:7233`) |
| `TEMPORAL_NAMESPACE` | Temporal namespace (default: `default`) |

### Temporal (for scheduling)

```bash
# Install Temporal CLI: https://docs.temporal.io/cli
temporal server start-dev --db-filename temporal.db

# In a second terminal:
npm run worker
```

The worker loads `.env.local` automatically and exits before polling if
`RESEND_API_KEY` is missing. Its startup log shows the Temporal address,
namespace, and task queue it is using.

If a scheduled send is not visible at [http://localhost:8233](http://localhost:8233):

- Open **Workflows**, not Temporal's **Schedules** page. This app implements
  scheduling with a durable workflow timer.
- Select the same namespace configured by `TEMPORAL_NAMESPACE` (`default` unless
  changed) and clear workflow status filters.
- Confirm the Next.js app and worker use the same `TEMPORAL_ADDRESS` and
  `TEMPORAL_NAMESPACE`.
- Run Temporal, Next.js, and the worker in the same Windows or WSL environment
  when using `localhost`. WSL's `localhost` may not reach a Temporal server
  started on Windows; in that case, run Temporal inside WSL or configure all
  processes to use the reachable Windows host address.
- A workflow that already exhausted its retries remains failed after the worker
  configuration is fixed; create a new scheduled send to test again.

Scheduling is a local-development feature in this demo. The editor, browser-local
CRM, previews, and immediate Resend delivery can be deployed to Vercel directly.

### Vercel

Import the GitHub repository in Vercel and configure `RESEND_API_KEY` and
`RESEND_FROM_EMAIL` in the project environment variables. Use a verified Resend
domain for delivery to recipients other than the Resend account owner. The
Scheduled send tab displays local Temporal startup instructions on Vercel.

## Requirements

### Tier 1 — Must Have

- **Drag & Drop Email Builder** — Puck editor with React Email components (Button, Heading, Text, Image, Container, Section, etc...)
- **Component Property Editing** — Sidebar editing for colors, typography, sizing, image URLs, content & links
- **Live Email Preview** — Real-time preview updating as users edit
- **Email Sending** — Send via Resend with recipient input, subject line, status notifications
- **WYSIWYG** - Parity on editor with sent item

### Tier 2 — Expected

- **Email Scheduling** — Durable workflow via Temporal with date/time picker, scheduled email list, cancellation
- **Desktop & Mobile Preview** — Toggle between preview widths

### Tier 3 — Impress Us

- 3-5 more quality of life improvements

## Architecture Decisions

<!-- Document your decisions here as you build -->

## Assumptions

<!-- Document assumptions here -->

## Time Spent

<!-- Track your time here -->

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Puck Editor](https://puckeditor.com)
- [React Email](https://react.email)
- [Resend](https://resend.com)
- [Temporal](https://temporal.io)
