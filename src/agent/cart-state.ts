import type {
  CartItem,
  CartOutput,
  ConstraintStatus,
  DecisionLogEntry,
  GapReportEntry,
} from "../shared/types.js";

export interface ToolTrace {
  toolName: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  status: "success" | "failure";
  latencyMs: number;
  error?: string;
}

export interface RunTraceContext {
  request_id: string;
  prompt_version: string;
  model: string;
  retry_count: number;
  model_latency_ms: number;
  token_usage: { input_tokens: number; output_tokens: number; total_tokens: number };
}

/** Mutable, request-scoped state. Create one instance for each shopping request. */
export class CartState {
  private readonly items: CartItem[] = [];
  private readonly decisionLog: DecisionLogEntry[] = [];
  private readonly constraints: ConstraintStatus[] = [];
  private readonly gaps: GapReportEntry[] = [];
  private nextToolReasoning: string | undefined;
  private runTraceContext: RunTraceContext | undefined;

  public constructor(public readonly budgetLimit: number) {
    if (!Number.isFinite(budgetLimit) || budgetLimit < 0) {
      throw new Error("budgetLimit must be a non-negative finite number");
    }
  }

  public get totalPrice(): number {
    return this.items.reduce((total, item) => total + item.price, 0);
  }

  public get budgetRemaining(): number {
    return this.budgetLimit - this.totalPrice;
  }

  public add(item: CartItem): void {
    if (this.items.some((existing) => existing.product_id === item.product_id)) {
      throw new Error(`Product ${item.product_id} is already in the cart`);
    }
    if (item.price > this.budgetRemaining) {
      throw new Error(`Adding ${item.product_id} would exceed the shared budget`);
    }
    this.items.push(item);
  }

  public recordTrace(trace: ToolTrace): void {
    this.decisionLog.push({
      step: this.decisionLog.length + 1,
      tool_called: trace.toolName,
      inputs: trace.inputs,
      outputs: { ...trace.outputs, status: trace.status, latency_ms: trace.latencyMs, ...(this.runTraceContext ? { trace: { ...this.runTraceContext, token_usage: { ...this.runTraceContext.token_usage } } } : {}), ...(trace.error ? { error: trace.error } : {}) },
      reasoning: this.nextToolReasoning ?? (trace.status === "success" ? "Tool call completed." : "Tool call failed; no result was fabricated."),
    });
    this.nextToolReasoning = undefined;
  }

  public setRunTraceContext(context: RunTraceContext): void {
    this.runTraceContext = { ...context, token_usage: { ...context.token_usage } };
  }

  public setNextToolReasoning(reasoning: string): void {
    this.nextToolReasoning = reasoning;
  }

  public recordDecision(entry: Omit<DecisionLogEntry, "step">): void {
    this.decisionLog.push({ ...entry, step: this.decisionLog.length + 1 });
  }

  public addConstraint(constraint: ConstraintStatus): void {
    this.constraints.push(constraint);
  }

  public addGap(gap: GapReportEntry): void {
    this.gaps.push(gap);
  }

  public summary(): Omit<CartOutput, "decision_log"> {
    return {
      items: [...this.items],
      total_price: this.totalPrice,
      budget_limit: this.budgetLimit,
      budget_remaining: this.budgetRemaining,
      constraints_met: [...this.constraints],
      gap_report: [...this.gaps],
    };
  }

  public output(): CartOutput {
    return { ...this.summary(), decision_log: [...this.decisionLog] };
  }
}
