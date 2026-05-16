export interface ForwardInspectionOptions {
  backendUrl?: string;
  validatorApiKey?: string;
  requestId?: string;
  fetchImpl?: typeof fetch;
}

export interface ForwardInspectionResult {
  status: number;
  body: unknown;
}

function requireServerEnv(value: string | undefined, variableName: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${variableName}`);
  }
  return value;
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function toUploadFile(value: FormDataEntryValue | null): File | null {
  if (!(value instanceof File)) {
    return null;
  }

  return value;
}

export async function forwardInspectionToBackend(
  formData: FormData,
  options: ForwardInspectionOptions = {},
): Promise<ForwardInspectionResult> {
  const image = toUploadFile(formData.get("image"));

  if (!image) {
    return {
      status: 400,
      body: { message: "image is required" },
    };
  }

  const backendUrl = stripTrailingSlash(
    options.backendUrl ??
      requireServerEnv(process.env.BACKEND_URL, "BACKEND_URL"),
  );
  const validatorApiKey =
    options.validatorApiKey ??
    requireServerEnv(process.env.VALIDATOR_API_KEY, "VALIDATOR_API_KEY");
  const fetchImpl = options.fetchImpl ?? fetch;

  const outboundFormData = new FormData();
  outboundFormData.append("image", image, image.name || "capture.jpg");

  for (const fieldName of ["package_metadata", "polygon_model_output"]) {
    const fieldValue = formData.get(fieldName);
    if (typeof fieldValue === "string" && fieldValue.trim() !== "") {
      outboundFormData.append(fieldName, fieldValue);
    }
  }

  const response = await fetchImpl(`${backendUrl}/api/validator/validate-package`, {
    method: "POST",
    headers: {
      "x-api-key": validatorApiKey,
      "x-request-id": options.requestId ?? crypto.randomUUID(),
    },
    body: outboundFormData,
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = {
      message: "invalid_backend_response",
    };
  }

  return {
    status: response.status,
    body,
  };
}
