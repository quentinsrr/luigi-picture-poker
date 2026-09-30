/** Emplacement vide affiché avant la distribution. */
export default function EmptySlot() {
  return (
    <div
      className="min-w-0 flex-1 rounded-xl"
      style={{
        aspectRatio: "5 / 7",
        background: "rgba(255,255,255,.05)",
        boxShadow: "inset 0 0 0 2px rgba(247,226,122,.18)",
      }}
    />
  );
}
