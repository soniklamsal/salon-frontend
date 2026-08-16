/**
 * One place that knows what a failed API response looks like.
 *
 * The Django backend normalises every error to the same two keys:
 *
 *   { detail: "Some of the details you entered need fixing.",
 *     errors: { paymentScreenshot: ["Please upload a screenshot..."] } }
 *
 * `errors` is present only for field validation failures. `detail` is always a
 * string and is always safe to render.
 *
 * The field message is preferred over `detail` because `detail` is a summary —
 * "some of the details need fixing" tells the customer nothing about which.
 */

type ApiErrorBody = {
  detail?: unknown;
  errors?: Record<string, unknown>;
};

/** The most useful sentence in a failed response, given the status as a floor. */
export async function readApiError(response: Response): Promise<string> {
  const fallback = `${response.status} ${response.statusText}`.trim();

  let payload: ApiErrorBody;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON body — a proxy error page, or an empty 502.
    return fallback;
  }

  const fieldMessage = firstFieldMessage(payload.errors);
  if (fieldMessage) return fieldMessage;

  if (typeof payload.detail === "string" && payload.detail) return payload.detail;

  return fallback;
}

function firstFieldMessage(errors: unknown): string {
  if (!errors || typeof errors !== "object") return "";

  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === "string" && value[0]) {
      return value[0];
    }
    // DRF nests when a serializer field is itself a serializer.
    if (typeof value === "string" && value) return value;
  }
  return "";
}
