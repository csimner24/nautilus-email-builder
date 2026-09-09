import { Connection, WorkflowClient } from "@temporalio/client";

export async function connectTemporal() {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS || "localhost:7233",
  });
  const client = new WorkflowClient({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || "default",
  });
  return { connection, client };
}
