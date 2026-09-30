/**
 * Jeton doré. Sa taille suit celle du texte qui l'entoure (unités em),
 * il peut donc être posé dans n'importe quel libellé.
 */
export default function Coin({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-black text-yellow-800 ${className}`}
      style={{
        verticalAlign: "-0.12em",
        width: "1.15em",
        height: "1.15em",
        fontSize: "inherit",
        background: "linear-gradient(160deg,#FFE98A,#E3A81B)",
        boxShadow: "inset 0 -2px 0 rgba(0,0,0,.25)",
      }}
      aria-hidden="true"
    >
      ★
    </span>
  );
}
