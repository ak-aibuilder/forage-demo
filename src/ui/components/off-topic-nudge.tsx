interface OffTopicNudgeProps {
  message: string;
  suggestions: string[];
  isLoading: boolean;
  onSuggestion: (goal: string) => void;
}

export function OffTopicNudge({ message, suggestions, isLoading, onSuggestion }: OffTopicNudgeProps) {
  return (
    <section className="off-topic-nudge" aria-live="polite">
      <div className="eyebrow">Try a shopping goal</div>
      <h2>Forage is ready to compose a cart.</h2>
      <p>{message}</p>
      <div className="nudge-suggestions" aria-label="Suggested shopping goals">
        {suggestions.map((suggestion) => (
          <button key={suggestion} className="secondary-button" type="button" onClick={() => onSuggestion(suggestion)} disabled={isLoading}>
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}
