/** Normalizes Axios error payloads from this API into a toast-friendly string */
export function getApiErrorMessage(error, fallback = "Something went wrong") {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;

  const errors = data.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const parts = errors.map(
      (e) => `${e.field || "field"}: ${e.message || "invalid"}`
    );
    return parts.join(" · ");
  }

  return typeof data.message === "string" ? data.message : fallback;
}
