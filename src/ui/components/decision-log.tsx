import type { DecisionLogEntry } from "../../shared/types.js";

function formatValue(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function DecisionLog({ entries }: { entries: DecisionLogEntry[] }) {
  return (
    <section className="decision-panel" aria-labelledby="decision-heading">
      <div className="section-heading"><div><div className="eyebrow">Agent trace</div><h2 id="decision-heading">Decision log</h2></div><span className="trace-count">{entries.length} steps</span></div>
      <div className="decision-list">
        {entries.map((entry) => (
          <details className="decision-entry" key={entry.step}>
            <summary><span className="step-number">{entry.step}</span><span>{entry.tool_called ?? "intent decomposition"}</span><span className="summary-reason">{entry.reasoning}</span></summary>
            <div className="decision-detail">
              <div><h3>Inputs</h3><pre>{formatValue(entry.inputs)}</pre></div>
              <div><h3>Outputs</h3><pre>{formatValue(entry.outputs)}</pre></div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
