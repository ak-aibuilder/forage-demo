import type { DecisionLogEntry } from "../../shared/types.js";

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

export function ConstraintChips({ entries }: { entries: DecisionLogEntry[] }) {
  const decomposition = entries.find((entry) => entry.tool_called === null && (
    Array.isArray(entry.outputs.explicit_constraints) || Array.isArray(entry.outputs.implicit_constraints)
  ));
  const explicit = stringArray(decomposition?.outputs.explicit_constraints);
  const inferred = stringArray(decomposition?.outputs.implicit_constraints);

  if (!decomposition) return null;
  return (
    <section className="constraint-panel" aria-labelledby="constraint-heading">
      <div className="eyebrow">Intent decomposition</div>
      <h3 id="constraint-heading">Constraints identified</h3>
      {explicit.length + inferred.length > 0 ? <div className="constraint-groups">
        {explicit.length > 0 && <div><span className="constraint-kind">Explicit</span><div className="constraint-list">{explicit.map((constraint) => <span className="constraint-chip explicit-chip" key={`explicit-${constraint}`}>{constraint}</span>)}</div></div>}
        {inferred.length > 0 && <div><span className="constraint-kind">Inferred</span><div className="constraint-list">{inferred.map((constraint) => <span className="constraint-chip inferred-chip" key={`inferred-${constraint}`}>{constraint}</span>)}</div></div>}
      </div> : <blockquote>{decomposition.reasoning}</blockquote>}
    </section>
  );
}
