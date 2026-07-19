import type { CartState } from "../cart-state.js";

export function normalize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function traced<T>(state: CartState | undefined, toolName: string, inputs: object, operation: () => T): T {
  const startedAt = performance.now();
  const normalizedInputs = normalize(inputs);
  try {
    const output = operation();
    state?.recordTrace({ toolName, inputs: normalizedInputs as Record<string, unknown>, outputs: normalize(output) as Record<string, unknown>, status: "success", latencyMs: Math.round(performance.now() - startedAt) });
    return output;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown tool error";
    state?.recordTrace({ toolName, inputs: normalizedInputs as Record<string, unknown>, outputs: {}, status: "failure", error: message, latencyMs: Math.round(performance.now() - startedAt) });
    throw error;
  }
}
