import { useState, useEffect, useRef, useCallback } from "react";

import { createDealer } from "./game/deck.js";
import { HANDS, evaluate, compareHands, keyIndices } from "./game/hands.js";
import { luigiStrategy } from "./game/ai.js";
import { STARTING_CHIPS, MIN_BET, MAX_BET, TIMING } from "./game/config.js";

import PlayingCard from "./components/PlayingCard.jsx";
import EmptySlot from "./components/EmptySlot.jsx";
import BigButton from "./components/BigButton.jsx";
import RulesSheet from "./components/RulesSheet.jsx";
import Coin from "./components/Coin.jsx";
import TopScreen from "./components/TopScreen.jsx";
import { useArrivalOrder } from "./hooks/useArrivalOrder.js";
import { useMusic } from "./hooks/useMusic.js";

// Chemin relatif : fonctionne sur GitHub Pages comme dans les applis natives.
const MUSIC_URL = "./audio/music_casino.mp3";

const FIVE_FALSE = [false, false, false, false, false];

/**
 * Phases de jeu :
 *   bet      → le joueur choisit sa mise
 *   dealing  → distribution, retournement des cartes du joueur
 *   exchange → le joueur sélectionne les cartes à jeter
 *   swapping → ses nouvelles cartes arrivent
 *   luigi    → Luigi analyse sa main et échange
 *   result   → abattage, gains réglés
 *   gameover → plus de jetons
 */
export default function LuigiPicturePoker() {
  const [chips, setChips] = useState(STARTING_CHIPS);
  const [bet, setBet] = useState(MIN_BET);
  const [phase, setPhase] = useState("bet");

  const [playerHand, setPlayerHand] = useState([]);
  const [luigiHand, setLuigiHand] = useState([]);
  const [playerUp, setPlayerUp] = useState(FIVE_FALSE);
  const [luigiUp, setLuigiUp] = useState(FIVE_FALSE);
  const [selected, setSelected] = useState(FIVE_FALSE);

  // Identifiants uniques : changer la clé d'une carte relance son animation.
  const [uids, setUids] = useState({ p: [0, 1, 2, 3, 4], l: [5, 6, 7, 8, 9] });

  const [status, setStatus] = useState("Placez votre mise pour commencer.");
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState({ wins: 0, losses: 0, ties: 0, best: -1 });
  const [showRules, setShowRules] = useState(false);
  const music = useMusic(MUSIC_URL);

  /* --- Références : valeurs lues depuis les timers, hors cycle de rendu --- */
  const dealerRef = useRef(null);
  if (dealerRef.current === null) dealerRef.current = createDealer();

  const uidRef = useRef(10);
  const timers = useRef([]);
  const playerRef = useRef([]);
  const luigiRef = useRef([]);
  const betRef = useRef(MIN_BET);

  useEffect(() => void (playerRef.current = playerHand), [playerHand]);
  useEffect(() => void (luigiRef.current = luigiHand), [luigiHand]);
  useEffect(() => void (betRef.current = bet), [bet]);

  /** setTimeout suivi, pour tout annuler proprement au démontage. */
  const later = useCallback((fn, ms) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const nextUid = () => ++uidRef.current;
  const draw = () => dealerRef.current.draw();

  const maxBet = Math.min(MAX_BET, chips);
  useEffect(() => {
    if (bet > maxBet && maxBet > 0) setBet(maxBet);
  }, [maxBet, bet]);

  /* ---------------- Distribution ---------------- */

  function startRound() {
    if (chips < bet || bet < MIN_BET) return;
    clearTimers();

    dealerRef.current.reset();
    const p = dealerRef.current.drawMany(5);
    const l = dealerRef.current.drawMany(5);

    setChips((c) => c - bet);
    playerRef.current = p;
    luigiRef.current = l;
    setPlayerHand(p);
    setLuigiHand(l);
    setUids({
      p: Array.from({ length: 5 }, nextUid),
      l: Array.from({ length: 5 }, nextUid),
    });
    setPlayerUp(FIVE_FALSE);
    setLuigiUp(FIVE_FALSE);
    setSelected(FIVE_FALSE);
    setResult(null);
    setPhase("dealing");
    setStatus("Distribution…");

    for (let i = 0; i < 5; i++) {
      later(
        () => setPlayerUp((prev) => prev.map((v, j) => (j === i ? true : v))),
        TIMING.dealSettle + i * TIMING.flipStep
      );
    }

    later(() => {
      setPhase("exchange");
      setStatus("Touchez les cartes à échanger, puis validez.");
    }, TIMING.dealSettle + 5 * TIMING.flipStep + TIMING.afterDeal);
  }

  /* ---------------- Échange du joueur ---------------- */

  function toggleCard(i) {
    if (phase !== "exchange") return;
    setSelected((s) => s.map((v, j) => (j === i ? !v : v)));
  }

  function confirmExchange() {
    if (phase !== "exchange") return;

    const idx = selected.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
    setPhase("swapping");
    setStatus(
      idx.length === 0
        ? "Vous gardez votre main."
        : `Échange de ${idx.length} carte${idx.length > 1 ? "s" : ""}…`
    );

    // Les nouvelles cartes partent du paquet l'une après l'autre :
    // on attend que la dernière soit posée pour les révéler.
    const revealAt = TIMING.swapShow + (idx.length - 1) * 2 * TIMING.dealStep;

    if (idx.length > 0) {
      // Les tirages se font maintenant, hors des mises à jour d'état,
      // pour rester déterministe même en mode strict de React.
      const fresh = idx.map(draw);
      const freshUids = idx.map(nextUid);

      setPlayerUp((prev) => prev.map((v, j) => (idx.includes(j) ? false : v)));

      later(() => {
        const updated = playerRef.current.map((c, j) => {
          const k = idx.indexOf(j);
          return k >= 0 ? fresh[k] : c;
        });
        playerRef.current = updated;
        setPlayerHand(updated);
        setUids((u) => ({
          ...u,
          p: u.p.map((x, j) => {
            const k = idx.indexOf(j);
            return k >= 0 ? freshUids[k] : x;
          }),
        }));
        setSelected(FIVE_FALSE);
        later(() => setPlayerUp((prev) => prev.map(() => true)), revealAt);
      }, TIMING.swapHide);
    }

    later(
      runLuigiTurn,
      idx.length > 0 ? TIMING.swapHide + revealAt + TIMING.beforeLuigi : TIMING.beforeLuigi
    );
  }

  /* ---------------- Tour de Luigi ---------------- */

  function runLuigiTurn() {
    setPhase("luigi");
    setStatus("Luigi réfléchit…");

    later(() => {
      const current = luigiRef.current;
      const idx = luigiStrategy(current);

      setStatus(
        idx.length === 0
          ? "Luigi ne change aucune carte. Wahou…"
          : `Luigi échange ${idx.length} carte${idx.length > 1 ? "s" : ""}.`
      );

      if (idx.length === 0) {
        later(revealShowdown, TIMING.luigiSwap);
        return;
      }

      const fresh = idx.map(draw);
      const freshUids = idx.map(nextUid);
      const updated = current.map((c, j) => {
        const k = idx.indexOf(j);
        return k >= 0 ? fresh[k] : c;
      });

      luigiRef.current = updated;
      setLuigiHand(updated);
      setUids((u) => ({
        ...u,
        l: u.l.map((x, j) => {
          const k = idx.indexOf(j);
          return k >= 0 ? freshUids[k] : x;
        }),
      }));

      later(revealShowdown, TIMING.luigiSwap + idx.length * 2 * TIMING.dealStep);
    }, TIMING.luigiThink);
  }

  /* ---------------- Abattage et gains ---------------- */

  function revealShowdown() {
    setStatus("Abattage !");
    for (let i = 0; i < 5; i++) {
      later(
        () => setLuigiUp((prev) => prev.map((v, j) => (j === i ? true : v))),
        i * TIMING.showdownStep
      );
    }
    later(settle, 5 * TIMING.showdownStep + TIMING.beforeSettle);
  }

  function settle() {
    const p = playerRef.current;
    const l = luigiRef.current;
    const stake = betRef.current;

    const outcome = compareHands(p, l);
    const pEval = evaluate(p);
    const lEval = evaluate(l);
    const payout = HANDS[pEval.category].payout;

    let gain = 0;
    let title;

    if (outcome > 0) {
      gain = stake * payout;
      setChips((c) => c + stake + gain); // mise remboursée + gain
      title = "Vous gagnez !";
    } else if (outcome === 0) {
      setChips((c) => c + stake); // mise rendue
      title = "Égalité — mise rendue";
    } else {
      gain = -stake;
      title = "Luigi remporte la manche";
    }

    setStats((s) => ({
      wins: s.wins + (outcome > 0 ? 1 : 0),
      losses: s.losses + (outcome < 0 ? 1 : 0),
      ties: s.ties + (outcome === 0 ? 1 : 0),
      best: Math.max(s.best, pEval.category),
    }));

    setResult({
      outcome,
      gain,
      stake,
      title,
      player: pEval.category,
      luigi: lEval.category,
      payout,
    });
    setStatus(title);
    setPhase("result");
  }

  /* ---------------- Navigation entre manches ---------------- */

  function nextRound() {
    if (chips <= 0) {
      setPhase("gameover");
      setStatus("Plus un seul jeton. Luigi range le paquet.");
      return;
    }
    setPhase("bet");
    setResult(null);
    setPlayerUp(FIVE_FALSE);
    setLuigiUp(FIVE_FALSE);
    setStatus("Placez votre mise pour la manche suivante.");
  }

  function restart() {
    clearTimers();
    dealerRef.current.reset();
    setChips(STARTING_CHIPS);
    setBet(MIN_BET);
    setPhase("bet");
    setPlayerHand([]);
    setLuigiHand([]);
    setPlayerUp(FIVE_FALSE);
    setLuigiUp(FIVE_FALSE);
    setSelected(FIVE_FALSE);
    setResult(null);
    setStats({ wins: 0, losses: 0, ties: 0, best: -1 });
    setStatus("Nouvelle partie. Placez votre mise.");
  }


  /* ---------------- Valeurs dérivées ---------------- */

  const dealt = playerHand.length === 5;
  const selectedCount = selected.filter(Boolean).length;
  const showdown = phase === "result";
  const playerKeys = showdown && dealt ? keyIndices(playerHand) : [];
  const luigiKeys = showdown && dealt ? keyIndices(luigiHand) : [];
  const playerCat = dealt ? evaluate(playerHand).category : null;
  const luigiCat = dealt ? evaluate(luigiHand).category : null;
  const luigiAction = luigiActionFor(phase, result);

  // Les cartes du joueur apparaissent en bas au moment où leur double 3D
  // quitte l'écran du haut.
  const { order: playerOrder } = useArrivalOrder(uids.p, dealt);
  const playerDelay = (i) =>
    playerOrder[i] < 0 ? 0 : TIMING.cardFlight * 0.6 + playerOrder[i] * 2 * TIMING.dealStep;

  /* ---------------- Rendu ---------------- */

  return (
    <div
      className="flex h-full w-full justify-center overflow-hidden text-white"
      style={{
        background: "#03170F",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="flex h-full w-full max-w-md flex-col px-2 py-2">
        {/* ============ Écran du haut : Luigi ============ */}
        <section
          className="relative min-h-0 flex-[1_1_0] overflow-hidden rounded-2xl"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 20%, #2A8F66 0%, #0C5138 55%, #06301F 100%)",
            boxShadow: "inset 0 0 0 2px rgba(247,226,122,.22), 0 0 0 3px #0A2418",
          }}
          aria-label="Table de Luigi"
        >
          <TopScreen
            luigiHand={luigiHand}
            uids={uids}
            luigiUp={luigiUp}
            luigiKeys={luigiKeys}
            showdown={showdown}
            dealt={dealt}
            action={luigiAction}
          />

          {/* Barre d'état : solde, titre, règles */}
          <header className="pointer-events-none absolute inset-x-2 top-2 flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-lg font-black text-yellow-300"
              style={panel}
            >
              <Coin />
              <span className="tabular-nums">{chips}</span>
            </div>
            <p className="flex-1 truncate text-center text-[11px] font-black uppercase tracking-widest text-emerald-100/80">
              Picture Poker
            </p>
            <button
              type="button"
              onClick={music.toggle}
              className="pointer-events-auto flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl text-emerald-50 active:scale-95"
              style={panel}
              aria-label={music.on ? "Couper la musique" : "Activer la musique"}
              aria-pressed={music.on}
            >
              <SpeakerIcon on={music.on} />
            </button>
            <button
              type="button"
              onClick={() => setShowRules(true)}
              className="pointer-events-auto flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl text-lg font-black text-emerald-900 active:scale-95"
              style={{
                background: "linear-gradient(180deg,#FFE98A,#E3A81B)",
                boxShadow: "0 3px 0 #9A6D0B, 0 6px 14px rgba(0,0,0,.35)",
              }}
              aria-label="Voir les règles et les gains"
            >
              ?
            </button>
          </header>

          {/* Bulle de Luigi : état du tour ou résultat */}
          <div className="pointer-events-none absolute inset-x-3 bottom-2 flex justify-center" aria-live="polite">
            <div
              key={result ? "result" : status}
              className="lpp-pop max-w-full rounded-2xl px-3 py-1.5 text-center"
              style={{
                background: "rgba(4,32,20,.78)",
                boxShadow: "inset 0 0 0 1px rgba(247,226,122,.3)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
            >
              {result ? (
                <>
                  <p
                    className={`text-[15px] font-black leading-tight ${
                      result.outcome > 0
                        ? "text-yellow-300"
                        : result.outcome === 0
                          ? "text-emerald-200"
                          : "text-rose-300"
                    }`}
                  >
                    {result.title}
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-100">
                    {result.outcome > 0
                      ? `${HANDS[result.player].name} × ${result.payout} → +${result.gain} `
                      : result.outcome === 0
                        ? "Mains identiques, votre mise vous revient"
                        : `Luigi : ${HANDS[result.luigi].name} → −${result.stake} `}
                    {result.outcome !== 0 && <Coin />}
                  </p>
                </>
              ) : (
                <p className="text-[13px] font-bold text-emerald-50">{status}</p>
              )}
            </div>
          </div>

          {showdown && luigiCat !== null && (
            <span className="lpp-pop absolute right-2 top-16 rounded-full bg-emerald-950/85 px-2 py-0.5 text-[11px] font-black text-emerald-200 ring-1 ring-emerald-400">
              Luigi : {HANDS[luigiCat].short}
            </span>
          )}
        </section>

        {/* Charnière de la console */}
        <div className="flex h-3.5 shrink-0 items-center justify-between px-6" aria-hidden="true">
          <span className="h-1.5 w-10 rounded-full bg-emerald-950 ring-1 ring-emerald-800/60" />
          <span className="h-1.5 w-10 rounded-full bg-emerald-950 ring-1 ring-emerald-800/60" />
        </div>

        {/* ============ Écran du bas : vos cartes ============ */}
        <section
          className="flex min-h-0 flex-[1_1_0] flex-col rounded-2xl px-3 pb-3 pt-2"
          style={{
            background: "linear-gradient(180deg, #0C5A3A 0%, #06301F 100%)",
            boxShadow: "inset 0 0 0 2px rgba(247,226,122,.22), 0 0 0 3px #0A2418",
          }}
          aria-label="Votre jeu"
        >
          <div className="mb-1.5 flex items-end justify-between px-0.5">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-yellow-200">
              Votre main
            </h2>
            {playerCat !== null && (phase === "exchange" || showdown) && (
              <span className="rounded-full bg-yellow-300 px-2 py-0.5 text-[11px] font-black text-emerald-900">
                {HANDS[playerCat].name}
              </span>
            )}
          </div>

          <div className="my-auto flex gap-1.5 pt-3">
            {dealt
              ? playerHand.map((c, i) => (
                  <PlayingCard
                    key={uids.p[i]}
                    card={c}
                    faceUp={playerUp[i]}
                    selected={selected[i]}
                    disabled={phase !== "exchange"}
                    onClick={() => toggleCard(i)}
                    delay={playerDelay(i)}
                    glow={playerKeys.includes(i)}
                    dim={showdown && !playerKeys.includes(i)}
                  />
                ))
              : [0, 1, 2, 3, 4].map((i) => <EmptySlot key={i} />)}
          </div>

          {/* Zone d'action, calée en bas sous le pouce */}
          <div className="pt-3">
            {phase === "bet" && (
              <>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase leading-tight tracking-widest text-emerald-200">
                    Mise
                  </span>
                  {Array.from({ length: MAX_BET }, (_, k) => k + MIN_BET).map((n) => {
                    const on = bet === n;
                    const ok = n <= maxBet;
                    return (
                      <button
                        key={n}
                        type="button"
                        disabled={!ok}
                        onClick={() => setBet(n)}
                        className={`h-12 flex-1 touch-manipulation rounded-xl text-xl font-black transition-transform active:scale-95 ${
                          ok ? "" : "opacity-30"
                        }`}
                        style={{
                          background: on
                            ? "linear-gradient(180deg,#FFE98A,#E3A81B)"
                            : "linear-gradient(180deg,#0E8C48,#076134)",
                          color: on ? "#06301F" : "#D7F5E4",
                          boxShadow: on
                            ? "0 3px 0 #9A6D0B, 0 6px 14px rgba(0,0,0,.35)"
                            : "0 3px 0 #043C1D",
                        }}
                        aria-pressed={on}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <BigButton onClick={startRound} disabled={chips < MIN_BET}>
                  Distribuer — {bet} <Coin />
                </BigButton>
              </>
            )}

            {phase === "exchange" && (
              <BigButton onClick={confirmExchange}>
                {selectedCount === 0
                  ? "Garder ces 5 cartes"
                  : `Échanger ${selectedCount} carte${selectedCount > 1 ? "s" : ""}`}
              </BigButton>
            )}

            {(phase === "dealing" || phase === "swapping" || phase === "luigi") && (
              <div className="lpp-float flex h-14 items-center justify-center text-sm font-black text-emerald-200">
                {phase === "luigi" ? "Luigi joue son tour…" : "Patientez…"}
              </div>
            )}

            {showdown && (
              <BigButton onClick={nextRound}>
                {chips > 0 ? "Manche suivante" : "Terminer la partie"}
              </BigButton>
            )}

            {phase === "gameover" && (
              <div className="lpp-pop text-center">
                <p className="text-lg font-black text-yellow-300">Partie terminée</p>
                <p className="mb-2 text-xs font-semibold text-emerald-100">
                  {stats.wins} victoire{stats.wins > 1 ? "s" : ""} · {stats.losses}{" "}
                  défaite{stats.losses > 1 ? "s" : ""} · {stats.ties} égalité
                  {stats.ties > 1 ? "s" : ""}
                  {stats.best >= 0 && ` · meilleure main : ${HANDS[stats.best].name}`}
                </p>
                <BigButton onClick={restart}>
                  Rejouer avec {STARTING_CHIPS} jetons
                </BigButton>
              </div>
            )}

            <p className="mt-2 text-center text-[10px] font-semibold text-emerald-300">
              {stats.wins}V / {stats.losses}D / {stats.ties}N
            </p>
          </div>
        </section>
      </div>

      {showRules && <RulesSheet onClose={() => setShowRules(false)} />}
    </div>
  );
}

/** Haut-parleur, barré quand la musique est coupée. */
function SpeakerIcon({ on }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      {on ? (
        <path
          d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path d="M16 9.5l5 5M21 9.5l-5 5" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

const panel = {
  background: "linear-gradient(180deg,#0B7C3E,#075C2D)",
  boxShadow:
    "inset 0 2px 0 rgba(255,255,255,.18), 0 3px 0 #043C1D, 0 6px 14px rgba(0,0,0,.35)",
};

/**
 * Ce que fait Luigi à l'écran selon la phase de jeu :
 * il distribue, réfléchit, se réjouit quand il gagne, boude quand il perd.
 */
function luigiActionFor(phase, result) {
  switch (phase) {
    case "dealing":
    case "swapping":
      return "deal";
    case "luigi":
      return "think";
    case "result":
      if (!result || result.outcome === 0) return "idle";
      return result.outcome < 0 ? "win" : "lose";
    case "gameover":
      return "win";
    default:
      return "idle";
  }
}
