/** A numbered source reference under an answer. Opens the passage it points to. */
export default function SourceChip({ number, label, onOpen, isActive = false }) {
  return (
    <button
      type="button"
      className="chip"
      onClick={onOpen}
      aria-pressed={isActive}
      aria-label={`Open source ${number}${label ? `, ${label}` : ""}`}
    >
      <span className="chip__n">{number}</span>
      {label}
    </button>
  );
}
