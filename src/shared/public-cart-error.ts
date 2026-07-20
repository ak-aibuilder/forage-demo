export interface PublicCartError {
  message: string;
  status: number;
}

export function publicCartError(error: unknown): PublicCartError {
  const message = error instanceof Error ? error.message : "The cart agent could not complete this request.";
  if (/timed out|abort/i.test(message)) return { message: "The cart agent timed out. Please try again.", status: 504 };
  if (/OPENAI_API_KEY/.test(message)) return { message: "The cart agent is not configured. Add OPENAI_API_KEY and try again.", status: 503 };
  const upstreamStatus = message.match(/Cart agent request failed with status (\d{3})/i)?.[1];
  if (upstreamStatus) return { message: `The cart service could not reach the agent (status ${upstreamStatus}). Please try again.`, status: 502 };
  return { message: "The cart agent could not complete this request. Please try again.", status: 500 };
}
