/**
 * Affiche une figure : emoji pour Champignon / Fleur / Étoile / Yoshi,
 * pastille colorée avec initiale pour Mario et Luigi.
 *
 * `size` accepte n'importe quelle longueur CSS, y compris un clamp(),
 * ce qui permet aux cartes de rester lisibles du petit écran au desktop.
 */
export default function Glyph({ sym, size = "clamp(24px,8vw,42px)" }) {
  if (sym.letter) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full font-black text-white"
        style={{
          width: size,
          height: size,
          fontSize: `calc(${size} * 0.58)`,
          background: sym.badge,
          boxShadow: "inset 0 -2px 0 rgba(0,0,0,.28), 0 1px 2px rgba(0,0,0,.25)",
          lineHeight: 1,
        }}
        aria-hidden="true"
      >
        {sym.letter}
      </span>
    );
  }

  return (
    <span
      className="leading-none"
      style={{ fontSize: size, lineHeight: 1 }}
      aria-hidden="true"
    >
      {sym.emoji}
    </span>
  );
}
