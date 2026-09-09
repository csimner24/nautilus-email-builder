import { NextResponse } from "next/server";
import { CANCEL_SIGNAL_NAME } from "@/temporal/types";

export const runtime = "nodejs";

/** Checked by name so this route does not statically import the Temporal client. */
function isWorkflowNotFound(error: unknown): boolean {
  return error instanceof Error && error.name === "WorkflowNotFoundError";
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const rawWorkflowId =
    body && typeof body === "object"
      ? (body as { workflowId?: unknown }).workflowId
      : undefined;
  const workflowId =
    typeof rawWorkflowId === "string" ? rawWorkflowId.trim() : "";

  if (!workflowId) {
    return NextResponse.json(
      { error: "A workflow ID is required." },
      { status: 400 },
    );
  }

  try {
    const { connectTemporal } = await import("@/lib/temporal/client");
    const { connection, client } = await connectTemporal();
    try {
      await client.getHandle(workflowId).signal(CANCEL_SIGNAL_NAME);
      return NextResponse.json({ ok: true });
    } finally {
      await connection.close();
    }
  } catch (error) {
    console.error("[api/schedule/cancel] Unable to cancel schedule.", error);

    // A missing workflow means the schedule already ran or was cancelled, which
    // is not the same problem as Temporal being offline.
    if (isWorkflowNotFound(error)) {
      return NextResponse.json(
        { error: "That scheduled email no longer exists. Refresh the list." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        error:
          "Unable to cancel the schedule. Confirm the local Temporal server is running.",
      },
      { status: 503 },
    );
  }
}
