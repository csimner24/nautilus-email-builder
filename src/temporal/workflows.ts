import {
  condition,
  defineSignal,
  proxyActivities,
  setHandler,
  sleep,
  workflowInfo,
} from "@temporalio/workflow";
import type * as activities from "./activities";
import {
  CANCEL_SIGNAL_NAME,
  type ScheduleEmailInput,
  type ScheduleEmailResult,
} from "./types";

const { sendEmailActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: "2 minutes",
  retry: {
    initialInterval: "2 seconds",
    backoffCoefficient: 2,
    maximumInterval: "1 minute",
    maximumAttempts: 5,
  },
});

export const cancelScheduledEmail = defineSignal(CANCEL_SIGNAL_NAME);

export async function scheduleEmailWorkflow(
  input: ScheduleEmailInput,
): Promise<ScheduleEmailResult> {
  let canceled = false;
  let sentCount = 0;
  setHandler(cancelScheduledEmail, () => {
    canceled = true;
  });

  const waitMs = Math.max(0, new Date(input.sendAt).getTime() - Date.now());
  await Promise.race([sleep(waitMs), condition(() => canceled)]);
  if (canceled) return { status: "canceled", sentCount };

  const { workflowId } = workflowInfo();
  for (let index = 0; index < input.deliveries.length; index += 1) {
    if (canceled) return { status: "canceled", sentCount };
    await sendEmailActivity(
      input.deliveries[index],
      `${workflowId}/${index}`,
    );
    sentCount += 1;
  }

  return { status: "sent", sentCount };
}
