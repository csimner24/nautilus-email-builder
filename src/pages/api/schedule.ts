import type { NextApiRequest, NextApiResponse } from "next";
import {
  isEmailData,
  isValidEmail,
  normalizeEmail,
  parseAttributes,
  type PersonalizationAttributes,
} from "@/lib/email";
import { renderPersonalizedEmail } from "@/lib/render-email";
import { substituteVariables } from "@/lib/variables";
import {
  EMAIL_TASK_QUEUE,
  SCHEDULE_WORKFLOW_TYPE,
  type ScheduledEmail,
  type ScheduleEmailInput,
  type ScheduleMemo,
} from "@/temporal/types";

/** Cap on how many workflows the dialog's list will page through. */
const MAX_LISTED_SCHEDULES = 50;

interface RecipientInput {
  email: string;
  attributes: PersonalizationAttributes;
}

type ScheduleResponse =
  | { ok: true; workflowId: string }
  | { schedules: ScheduledEmail[] }
  | { error: string };

function parseRecipients(value: unknown): RecipientInput[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const recipients = value.map((item) => {
    if (!item || typeof item !== "object") return null;
    const candidate = item as Record<string, unknown>;
    const email =
      typeof candidate.email === "string" ? normalizeEmail(candidate.email) : "";
    if (!isValidEmail(email)) return null;
    return { email, attributes: parseAttributes(candidate.attributes) };
  });
  return recipients.every((recipient): recipient is RecipientInput => !!recipient)
    ? recipients
    : null;
}

/**
 * 503 tells the client that scheduling itself is offline, as opposed to the
 * 400s above that mean the request was bad. The dialog keys its "start
 * Temporal" hint off this status, so nothing else may return 503.
 */
function temporalUnavailable(
  response: NextApiResponse<ScheduleResponse>,
  error: unknown,
) {
  console.error("[api/schedule] Temporal is unreachable.", error);
  return response.status(503).json({
    error:
      "Scheduling requires a local Temporal server and worker. Run " +
      "`temporal server start-dev` and `npm run worker`.",
  });
}

async function scheduleEmail(
  request: NextApiRequest,
  response: NextApiResponse<ScheduleResponse>,
) {
  let prepared:
    | { input: ScheduleEmailInput; memo: ScheduleMemo }
    | undefined;

  try {
    const body: unknown = request.body;
    if (!body || typeof body !== "object") {
      return response.status(400).json({ error: "Invalid request body." });
    }
    const candidate = body as Record<string, unknown>;
    const recipients = parseRecipients(candidate.recipients);
    const subject =
      typeof candidate.subject === "string" ? candidate.subject.trim() : "";
    const sendAt =
      typeof candidate.sendAt === "string" ? candidate.sendAt : "";
    const sendTime = new Date(sendAt);

    if (!recipients) {
      return response
        .status(400)
        .json({ error: "At least one valid recipient is required." });
    }
    if (!subject) {
      return response
        .status(400)
        .json({ error: "An email subject is required." });
    }
    if (
      !sendAt ||
      Number.isNaN(sendTime.getTime()) ||
      sendTime.getTime() <= Date.now()
    ) {
      return response
        .status(400)
        .json({ error: "A future send date and time is required." });
    }
    if (!isEmailData(candidate.data)) {
      return response
        .status(400)
        .json({ error: "The email draft is invalid." });
    }

    const emailData = candidate.data;
    const deliveries = recipients.map(({ email, attributes }) => ({
      email,
      subject: substituteVariables(subject, attributes),
      html: renderPersonalizedEmail(emailData, attributes),
    }));
    prepared = {
      input: { sendAt: sendTime.toISOString(), deliveries },
      memo: {
        recipients: recipients.map(({ email }) => email),
        subject,
        sendAt: sendTime.toISOString(),
      },
    };
  } catch (error) {
    console.error("[api/schedule] Unable to prepare scheduled email.", error);
    return response
      .status(500)
      .json({ error: "The scheduled email could not be prepared." });
  }

  try {
    const { connectTemporal } = await import("@/lib/temporal/client");
    const { connection, client } = await connectTemporal();
    try {
      const workflowId = `scheduled-email-${crypto.randomUUID()}`;
      await client.start(SCHEDULE_WORKFLOW_TYPE, {
        workflowId,
        taskQueue: EMAIL_TASK_QUEUE,
        args: [prepared.input],
        memo: { ...prepared.memo },
      });
      return response.status(200).json({ ok: true, workflowId });
    } finally {
      await connection.close();
    }
  } catch (error) {
    return temporalUnavailable(response, error);
  }
}

async function listScheduled(response: NextApiResponse<ScheduleResponse>) {
  try {
    const { connectTemporal } = await import("@/lib/temporal/client");
    const { connection, client } = await connectTemporal();
    try {
      const schedules: ScheduledEmail[] = [];
      for await (const execution of client.list({
        query: `WorkflowType = "${SCHEDULE_WORKFLOW_TYPE}"`,
      })) {
        const memo = execution.memo as Partial<ScheduleMemo> | undefined;
        if (
          !memo ||
          !Array.isArray(memo.recipients) ||
          typeof memo.subject !== "string" ||
          typeof memo.sendAt !== "string"
        ) {
          continue;
        }
        schedules.push({
          workflowId: execution.workflowId,
          recipients: memo.recipients,
          subject: memo.subject,
          sendAt: memo.sendAt,
          status: execution.status.name.toLowerCase(),
        });
        if (schedules.length >= MAX_LISTED_SCHEDULES) break;
      }
      schedules.sort(
        (a, b) => new Date(b.sendAt).getTime() - new Date(a.sendAt).getTime(),
      );
      return response.status(200).json({ schedules });
    } finally {
      await connection.close();
    }
  } catch (error) {
    return temporalUnavailable(response, error);
  }
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ScheduleResponse>,
) {
  if (request.method === "POST") {
    return scheduleEmail(request, response);
  }
  if (request.method === "GET") {
    return listScheduled(response);
  }

  response.setHeader("Allow", "GET, POST");
  return response.status(405).json({ error: "Method not allowed." });
}
