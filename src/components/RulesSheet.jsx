import Glyph from "./Glyph.jsx";
import { SYMBOLS } from "../game/symbols.js";
import { HANDS } from "../game/hands.js";

/** Panneau glissant qui récapitule les combinaisons, les gains et les règles. */
export default function RulesSheet({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Règles et gains"
    >
      <div
        className="lpp-pop w-full max-w-md overflow-y-auto rounded-3xl p-4"
        style={{
          maxHeight: "85vh",
          background: "linear-gradient(180deg,#0B7C3E,#06301F)",
          boxShadow: "0 0 0 2px #F7E27A, 0 20px 40px rgba(0,0,0,.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-black text-yellow-300">Mains et gains</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 touch-manipulation rounded-full bg-emerald-900 text-lg font-black text-emerald-100 active:scale-95"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <ul className="mb-4 space-y-1">
          {HANDS.map((h) => (
            <li
              key={h.name}
              className="flex items-center justify-between rounded-xl bg-emerald-950/60 px-3 py-2"
            >
              <span className="text-sm font-bold text-emerald-50">{h.name}</span>
              <span className="text-sm font-black text-yellow-300">
                × {h.payout}
              </span>
            </li>
          ))}
        </ul>

        <h3 className="mb-2 text-base font-black text-yellow-300">
          Force des figures
        </h3>
        <div className="mb-4 flex items-end justify-between gap-1">
          {SYMBOLS.map((s) => (
            <div key={s.id} className="flex flex-1 flex-col items-center gap-1">
              <Glyph sym={s} size="clamp(18px,5vw,26px)" />
              <span className="text-center text-[9px] font-bold leading-tight text-emerald-100">
                {s.name}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2 text-[12px] font-medium leading-relaxed text-emerald-100">
          <p>
            Misez de 1 à 5 jetons. Vous et Luigi recevez 5 cartes ; seules les
            vôtres sont révélées.
          </p>
          <p>
            Touchez les cartes à jeter, validez, puis Luigi échange les siennes :
            il garde toujours son meilleur groupe et ses figures fortes.
          </p>
          <p>
            Main gagnante = mise remboursée + mise × multiplicateur de votre
            combinaison. Main perdante = mise perdue. Égalité = mise rendue.
          </p>
        </div>
      </div>
    </div>
  );
}
