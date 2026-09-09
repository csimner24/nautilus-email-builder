import { ApplicationFailure } from "@temporalio/common";
import type { ScheduledDelivery } from "./types";
import { getResendClient, getResendFromEmail } from "../lib/resend";

const NON_RETRYABLE_RESEND_ERRORS = new Set([
  "validation_error",
  "invalid_idempotency_key",
  "invalid_idempotent_request",
]);

export async function sendEmailActivity(
  delivery: ScheduledDelivery,
  idempotencyKey?: string,
) {
  const { data, error } = await getResendClient().emails.send(
    {
      from: getResendFromEmail(),
      to: delivery.email,
      subject: delivery.subject,
      html: delivery.html,
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );
  if (error) {
    if (NON_RETRYABLE_RESEND_ERRORS.has(error.name)) {
      throw ApplicationFailure.create({
        message: error.message,
        type: error.name,
        nonRetryable: true,
      });
    }
    throw new Error(error.message);
  }
  return data?.id;
}
