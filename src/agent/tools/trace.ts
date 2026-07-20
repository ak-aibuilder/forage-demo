import type { CartState } from "../cart-state.js";

export function normalize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const SENSITIVE_KEY = /api[-_]?key|authorization|cookie|password|secret|token/i;

export function redact<T>(value: T): T {
  if (Array.isArray(value)) return value.map((entry) => redact(entry)) as T;
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
    key,
    SENSITIVE_KEY.test(key) ? "[REDACTED]" : redact(entry),
  ])) as T;
}

export function traced<T>(state: CartState | undefined, toolName: string, inputs: object, operation: () => T): T {
  const startedAt = performance.now();
  const normalizedInputs = redact(normalize(inputs));
  try {
    const output = operation();
    state?.recordTrace({ toolName, inputs: normalizedInputs as Record<string, unknown>, outputs: redact(normalize(output)) as Record<string, unknown>, status: "success", latencyMs: Math.round(performance.now() - startedAt) });
    return output;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown tool error";
    state?.recordTrace({ toolName, inputs: normalizedInputs as Record<string, unknown>, outputs: {}, status: "failure", error: message, latencyMs: Math.round(performance.now() - startedAt) });
    throw error;
  }
}
