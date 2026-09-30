import Glyph from "./Glyph.jsx";

/**
 * Une carte, recto et verso montés dos à dos et retournés en 3D.
 *
 * @param {object}   card      figure issue de SYMBOLS
 * @param {boolean}  faceUp    recto visible
 * @param {boolean}  selected  marquée pour l'échange
 * @param {boolean}  disabled  non cliquable (main de Luigi, phases d'attente)
 * @param {boolean}  glow      surlignée : elle fait partie de la combinaison
 * @param {boolean}  dim       estompée : hors combinaison, à l'abattage
 * @param {number}   delay     décalage de l'animation de distribution, en ms
 */
export default function PlayingCard({
  card,
  faceUp,
  selected = false,
  onClick,
  disabled = false,
  glow = false,
  dim = false,
  delay = 0,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={faceUp ? card.name : "Carte face cachée"}
      aria-pressed={selected}
      className={`lpp-deal lpp-scene relative min-w-0 flex-1 touch-manipulation select-none transition-transform duration-200 ${
        selected ? "-translate-y-3" : ""
      } ${disabled ? "cursor-default" : "active:scale-95"}`}
      style={{
        aspectRatio: "5 / 7",
        animationDelay: `${delay}ms`,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div
        className="lpp-flipper"
        style={{ transform: faceUp ? "rotateY(0deg)" : "rotateY(180deg)" }}
      >
        {/* Recto */}
        <div
          className="lpp-face flex flex-col items-center justify-center rounded-xl"
          style={{
            background: card.face,
            border: `2px solid ${card.edge}`,
            boxShadow: glow
              ? "0 0 0 3px rgba(253,224,71,.9), 0 8px 18px rgba(0,0,0,.45)"
              : "0 4px 10px rgba(0,0,0,.4)",
            opacity: dim ? 0.45 : 1,
            transition: "box-shadow 300ms, opacity 300ms",
          }}
        >
          <div className="absolute left-1 top-1">
            <Glyph sym={card} size="clamp(9px,2.6vw,13px)" />
          </div>

          <Glyph sym={card} size="clamp(24px,8vw,42px)" />

          <span
            className={`mt-1 px-0.5 text-center font-bold leading-none ${card.label}`}
            style={{ fontSize: "clamp(6px,1.9vw,10px)" }}
          >
            {card.name}
          </span>
        </div>

        {/* Verso */}
        <div
          className="lpp-face lpp-face--back flex items-center justify-center rounded-xl"
          style={{
            background:
              "repeating-linear-gradient(45deg,#0E7A45 0 8px,#0B6339 8px 16px)",
            border: "2px solid #F7E27A",
            boxShadow: "0 4px 10px rgba(0,0,0,.45)",
          }}
        >
          <span
            className="flex items-center justify-center rounded-full font-black text-emerald-800"
            style={{
              width: "48%",
              aspectRatio: "1",
              fontSize: "clamp(12px,4vw,20px)",
              background: "#F7E27A",
              boxShadow: "inset 0 -2px 0 rgba(0,0,0,.2)",
            }}
          >
            L
          </span>
        </div>
      </div>

      {selected && (
        <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-yellow-300 px-2 py-0.5 text-[10px] font-black text-emerald-900 shadow">
          ÉCHANGE
        </span>
      )}
    </button>
  );
}
