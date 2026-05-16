import test from "node:test";
import assert from "node:assert/strict";

import { forwardInspectionToBackend } from "../lib/validator-api";

test("forwardInspectionToBackend reenvia la imagen al backend con la api key", async () => {
  const formData = new FormData();
  const image = new File([new Uint8Array([1, 2, 3])], "demo.jpg", {
    type: "image/jpeg",
  });

  formData.append("image", image);
  formData.append(
    "package_metadata",
    JSON.stringify({ source: "camera", expected_capsules: 10 }),
  );

  let calledUrl = "";
  let calledHeaders: HeadersInit | undefined;
  let calledBody: FormData | undefined;

  const response = await forwardInspectionToBackend(formData, {
    backendUrl: "http://127.0.0.1:3000",
    validatorApiKey: "demo-key",
    requestId: "req-123",
    fetchImpl: async (input, init) => {
      calledUrl = String(input);
      calledHeaders = init?.headers;
      calledBody = init?.body as FormData;

      return new Response(
        JSON.stringify({
          decision: "APROBADO",
          approved: true,
          confidence: 0.93,
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    },
  });

  assert.equal(calledUrl, "http://127.0.0.1:3000/api/validator/validate-package");
  assert.deepEqual(calledHeaders, {
    "x-api-key": "demo-key",
    "x-request-id": "req-123",
  });
  assert.ok(calledBody instanceof FormData);
  assert.equal((calledBody.get("image") as File).name, "demo.jpg");
  assert.equal(
    calledBody.get("package_metadata"),
    JSON.stringify({ source: "camera", expected_capsules: 10 }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    decision: "APROBADO",
    approved: true,
    confidence: 0.93,
  });
});

test("forwardInspectionToBackend rechaza si falta la imagen", async () => {
  const response = await forwardInspectionToBackend(new FormData(), {
    backendUrl: "http://127.0.0.1:3000",
    validatorApiKey: "demo-key",
    fetchImpl: async () => {
      throw new Error("fetch no deberia ejecutarse");
    },
  });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    message: "image is required",
  });
});
