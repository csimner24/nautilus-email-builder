export const EMAIL_TASK_QUEUE = "nautilus-email";
export const SCHEDULE_WORKFLOW_TYPE = "scheduleEmailWorkflow";

/**
 * Signal that cancels a pending scheduled send. Declared here rather than
 * imported from `workflows.ts` so API routes do not pull in the workflow
 * bundle just to learn the signal's name.
 */
export const CANCEL_SIGNAL_NAME = "cancelScheduledEmail";

export interface ScheduledDelivery {
  email: string;
  subject: string;
  html: string;
}

export interface ScheduleEmailInput {
  sendAt: string;
  deliveries: ScheduledDelivery[];
}

export interface ScheduleEmailResult {
  status: "sent" | "canceled";
  sentCount: number;
}

export interface ScheduleMemo {
  recipients: string[];
  subject: string;
  sendAt: string;
}

/** A pending or finished scheduled send, as listed in the send dialog. */
export interface ScheduledEmail {
  workflowId: string;
  recipients: string[];
  subject: string;
  sendAt: string;
  status: string;
}
