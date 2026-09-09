import type { NextApiRequest, NextApiResponse } from "next";
import {
  isEmailData,
  isValidEmail,
  normalizeEmail,
  parseAttributes,
} from "@/lib/email";
import { renderPersonalizedEmail } from "@/lib/render-email";
import { getResendClient, getResendFromEmail } from "@/lib/resend";
import { substituteVariables } from "@/lib/variables";

type SendResponse = { ok: true; id?: string } | { error: string };

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<SendResponse>,
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body: unknown = request.body;
    if (!body || typeof body !== "object") {
      return response.status(400).json({ error: "Invalid request body." });
    }

    const candidate = body as Record<string, unknown>;
    const recipient = typeof candidate.to === "string" ? candidate.to : "";
    const subject =
      typeof candidate.subject === "string" ? candidate.subject.trim() : "";

    if (!isValidEmail(recipient)) {
      return response
        .status(400)
        .json({ error: "A valid recipient email is required." });
    }
    if (!subject) {
      return response
        .status(400)
        .json({ error: "An email subject is required." });
    }
    if (!isEmailData(candidate.data)) {
      return response
        .status(400)
        .json({ error: "The email draft is invalid." });
    }

    const attributes = parseAttributes(candidate.attributes);
    const sendResult = await getResendClient().emails.send({
      from: getResendFromEmail(),
      to: normalizeEmail(recipient),
      subject: substituteVariables(subject, attributes),
      html: renderPersonalizedEmail(candidate.data, attributes),
    });

    // Resend's own message is user-actionable (unverified domain, sandbox
    // sender restrictions), so it is passed through rather than genericized.
    if (sendResult.error) {
      return response.status(502).json({ error: sendResult.error.message });
    }
    return response.status(200).json({ ok: true, id: sendResult.data?.id });
  } catch (error) {
    console.error("[api/send] Unexpected failure.", error);
    return response.status(500).json({ error: "The email could not be sent." });
  }
}
