"use client";

interface GoalInputProps {
  goal: string;
  allInStock: boolean;
  isLoading: boolean;
  onGoalChange: (goal: string) => void;
  onAllInStockChange: (allInStock: boolean) => void;
  onSubmit: () => void;
  onScenario: (goal: string, allInStock: boolean) => void;
}

const SCENARIOS = [
  { label: "Complete outfit", goal: "business casual outfit for a job interview, budget $150", allInStock: true },
  { label: "Stockout replan", goal: "business casual outfit for a job interview, budget $150", allInStock: false },
  { label: "Catalog gap", goal: "formal evening gown under $60", allInStock: false },
];

export function GoalInput({ goal, allInStock, isLoading, onGoalChange, onAllInStockChange, onSubmit, onScenario }: GoalInputProps) {
  return (
    <section className="goal-panel" aria-labelledby="goal-heading">
      <div className="eyebrow">Shopping goal</div>
      <h1 id="goal-heading">Compose a cart, not a search result.</h1>
      <p className="goal-copy">Forage turns one goal into a budget-aware apparel cart, showing every decision and catalog gap along the way.</p>
      <div className="scenario-row" aria-label="Demo scenarios">
        {SCENARIOS.map((scenario) => (
          <button className="scenario-button" key={scenario.label} type="button" onClick={() => onScenario(scenario.goal, scenario.allInStock)} disabled={isLoading}>
            {scenario.label}
          </button>
        ))}
      </div>
      <label className="goal-label" htmlFor="shopping-goal">What are you trying to buy?</label>
      <textarea id="shopping-goal" value={goal} onChange={(event) => onGoalChange(event.target.value)} placeholder="For example, business casual outfit for a job interview, budget $150" rows={4} disabled={isLoading} />
      <div className="goal-actions">
        <label className="inventory-toggle">
          <input type="checkbox" checked={allInStock} onChange={(event) => onAllInStockChange(event.target.checked)} disabled={isLoading} />
          <span>All products in stock</span>
        </label>
        <button className="primary-button" type="button" onClick={onSubmit} disabled={isLoading || !goal.trim()}>
          {isLoading ? "Composing cart..." : "Compose cart"}
        </button>
      </div>
    </section>
  );
}
