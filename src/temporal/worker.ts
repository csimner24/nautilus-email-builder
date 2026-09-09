import { loadEnvConfig } from "@next/env";
import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities";
import { EMAIL_TASK_QUEUE } from "./types";

async function run() {
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

  const address = process.env.TEMPORAL_ADDRESS || "localhost:7233";
  const namespace = process.env.TEMPORAL_NAMESPACE || "default";
  if (!process.env.RESEND_API_KEY?.trim()) {
    throw new Error(
      "RESEND_API_KEY is not configured. Add it to .env.local before starting the worker.",
    );
  }

  console.log("Starting Temporal worker", {
    address,
    namespace,
    taskQueue: EMAIL_TASK_QUEUE,
  });

  const connection = await NativeConnection.connect({
    address,
  });
  const worker = await Worker.create({
    connection,
    namespace,
    taskQueue: EMAIL_TASK_QUEUE,
    workflowsPath: require.resolve("./workflows"),
    activities,
  });

  console.log(`Temporal worker listening on task queue "${EMAIL_TASK_QUEUE}"`);
  await worker.run();
}

run().catch((error) => {
  console.error("Temporal worker failed", error);
  process.exit(1);
});
