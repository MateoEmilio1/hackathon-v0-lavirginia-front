import { NextResponse } from "next/server";
import { forwardInspectionToBackend } from "@/lib/validator-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await forwardInspectionToBackend(formData, {
      requestId: request.headers.get("x-request-id") ?? crypto.randomUUID(),
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected proxy error";

    return NextResponse.json(
      {
        message,
      },
      { status: 500 },
    );
  }
}
