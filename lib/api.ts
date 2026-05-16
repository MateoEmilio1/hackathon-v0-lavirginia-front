import type { ValidatorResult } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const API_KEY = process.env.NEXT_PUBLIC_VALIDATOR_API_KEY ?? "";

export async function validatePackage(file: File): Promise<ValidatorResult> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_URL}/api/validator/validate-package`, {
    method: "POST",
    headers: { "x-api-key": API_KEY },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<ValidatorResult>;
}
