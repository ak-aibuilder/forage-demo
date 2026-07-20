import type { DecisionLogEntry } from "../../shared/types.js";

function formatValue(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function condensedValue(value: unknown): string {
  const formatted = JSON.stringify(value);
  if (!formatted || formatted === "{}") return "None";
  return formatted.length > 180 ? `${formatted.slice(0, 177)}...` : formatted;
}

function traceClass(entry: DecisionLogEntry): string {
  if (entry.outputs.in_stock === false) return "trace-stockout";
  if (entry.tool_called === null && /gap|missing|limit/i.test(entry.reasoning)) return "trace-gap";
  const classes: Record<string, string> = {
    search_catalog: "trace-search",
    check_inventory: "trace-inventory",
    add_to_cart: "trace-add",
    find_substitutes: "trace-substitute",
    get_cart_summary: "trace-summary-step",
  };
  return entry.tool_called ? classes[entry.tool_called] ?? "trace-reasoning" : "trace-reasoning";
}

export function DecisionLog({ entries }: { entries: DecisionLogEntry[] }) {
  return (
    <details className="decision-panel">
      <summary className="trace-summary"><span><span className="eyebrow">Agent trace</span><strong id="decision-heading">{entries.length} steps, expand to see trace</strong></span><span className="trace-expand-label">View trace</span></summary>
      <div className="trace-timeline" aria-labelledby="decision-heading">
        {entries.map((entry) => (
          <article className={`trace-step ${traceClass(entry)}`} key={entry.step}>
            <span className="step-number">{entry.step}</span>
            <div className="trace-step-copy">
              <div className="trace-step-heading"><strong>{entry.tool_called ?? "Reasoning"}</strong><span>{entry.outputs.in_stock === false ? "Out of stock" : "Completed"}</span></div>
              <p>{entry.reasoning}</p>
              <dl className="trace-io"><div><dt>Input</dt><dd>{condensedValue(entry.inputs)}</dd></div><div><dt>Output</dt><dd>{condensedValue(entry.outputs)}</dd></div></dl>
              <details className="raw-json-toggle"><summary>Show raw JSON</summary><div className="decision-detail"><div><h3>Inputs</h3><pre>{formatValue(entry.inputs)}</pre></div><div><h3>Outputs</h3><pre>{formatValue(entry.outputs)}</pre></div></div></details>
            </div>
          </article>
        ))}
      </div>
    </details>
  );
}
