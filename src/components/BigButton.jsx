/**
 * Bouton d'action principal. 56 px de haut : confortable au pouce,
 * bien au-dessus des 44 px recommandés par Apple et des 48 dp de Material.
 */
export default function BigButton({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-14 w-full touch-manipulation select-none rounded-2xl text-lg font-black transition-transform active:translate-y-0.5 ${
        disabled ? "opacity-40" : ""
      }`}
      style={{
        background: "linear-gradient(180deg,#FFE98A,#E3A81B)",
        color: "#06301F",
        boxShadow: "0 5px 0 #9A6D0B, 0 10px 20px rgba(0,0,0,.4)",
      }}
    >
      {children}
    </button>
  );
}
