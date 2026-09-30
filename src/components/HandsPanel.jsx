import { HANDS } from "../game/hands.js";

/**
 * Forme de chaque combinaison en mini-cartes : un nombre par groupe de
 * figures identiques. Index = catégorie de HANDS (0, carte haute, absent).
 */
const SHAPES = [null, [2], [2, 2], [3], [3, 2], [4], [5]];
const GROUP_COLORS = ["#FDE047", "#4ADE80"];
const GROUP_COLORS_ON = ["#065F46", "#16A34A"]; // sur la ligne surlignée en jaune

function MiniCards({ shape, highlighted }) {
  const colors = highlighted ? GROUP_COLORS_ON : GROUP_COLORS;
  return (
    <span className="flex items-center gap-[3px]" aria-hidden="true">
      {shape.map((n, g) => (
        <span key={g} className="flex gap-[2px]">
          {Array.from({ length: n }, (_, i) => (
            <span
              key={i}
              className="block h-[9px] w-[6px] rounded-[1.5px]"
              style={{ background: colors[g], boxShadow: "0 0 0 0.5px rgba(0,0,0,.35)" }}
            />
          ))}
        </span>
      ))}
    </span>
  );
}

/**
 * Tableau des combinaisons, de la paire au cinq d'un coup, avec leur gain.
 * Posé à gauche de l'écran du haut, translucide et non cliquable, pour ne
 * cacher ni Luigi ni ses cartes.
 *
 * @param {number|null} playerCat  combinaison actuelle du joueur (surlignée)
 * @param {number|null} luigiCat   combinaison de Luigi, seulement à l'abattage
 */
export default function HandsPanel({ playerCat = null, luigiCat = null }) {
  return (
    <aside
      className="lpp-hands pointer-events-none absolute left-2 top-[58px] rounded-xl px-1 py-1.5"
      style={{
        background: "rgba(4,32,20,.55)",
        boxShadow: "inset 0 0 0 1px rgba(247,226,122,.22)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
      }}
      aria-label="Combinaisons et gains"
    >
      <p className="lpp-hands-title mb-1 px-1 text-[9px] font-black uppercase tracking-widest text-emerald-200/80">
        Gains
      </p>
      <ol className="flex flex-col-reverse gap-[2px]">
        {SHAPES.map((shape, cat) => {
          if (!shape) return null;
          const mine = cat === playerCat;
          const his = cat === luigiCat;
          return (
            <li
              key={cat}
              className="lpp-hands-row grid grid-cols-[3rem_2.4rem_1.4rem] items-center gap-1 rounded-md px-1 py-[2px] transition-colors duration-300"
              style={{
                background: mine ? "rgba(253,224,71,.92)" : "transparent",
                color: mine ? "#064E3B" : "#ECFDF5",
              }}
            >
              <span className="flex items-center gap-1 truncate text-[10px] font-black leading-none">
                {HANDS[cat].short}
                {his && (
                  <span
                    className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full text-[7px] font-black text-white"
                    style={{ background: "#0E9F4F", boxShadow: "0 0 0 1px #fff" }}
                    title="Main de Luigi"
                  >
                    L
                  </span>
                )}
              </span>
              <MiniCards shape={shape} highlighted={mine} />
              <span
                className="text-right text-[10px] font-black tabular-nums leading-none"
                style={{ color: mine ? "#064E3B" : "#FDE047" }}
              >
                ×{HANDS[cat].payout}
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
