import { Component, Suspense, lazy, useState } from "react";

import PlayingCard from "./PlayingCard.jsx";
import EmptySlot from "./EmptySlot.jsx";

// Three.js pèse lourd : on le charge à part, pour que l'écran du bas
// s'affiche et réponde sans l'attendre.
const TopScene = lazy(() => import("../scene/TopScene.jsx"));

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Si la 3D plante (contexte WebGL perdu, pilote capricieux), on bascule en 2D. */
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.warn("Scène 3D désactivée :", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Écran du haut sans 3D : médaillon de Luigi et ses cartes en HTML. */
function FlatLuigi({ luigiHand, uids, luigiUp, luigiKeys, showdown, dealt }) {
  return (
    <div className="absolute inset-x-3 bottom-3 top-14 flex flex-col items-center justify-end gap-3">
      <span
        className="lpp-float flex h-16 w-16 items-center justify-center rounded-full text-3xl font-black text-white"
        style={{ background: "#0E9F4F", boxShadow: "0 0 0 4px #fff, 0 6px 14px rgba(0,0,0,.4)" }}
        aria-hidden="true"
      >
        L
      </span>
      <div className="flex w-full max-w-xs gap-1.5">
        {dealt
          ? luigiHand.map((c, i) => (
              <PlayingCard
                key={uids.l[i]}
                card={c}
                faceUp={luigiUp[i]}
                disabled
                glow={luigiKeys.includes(i)}
                dim={showdown && !luigiKeys.includes(i)}
              />
            ))
          : [0, 1, 2, 3, 4].map((i) => <EmptySlot key={i} />)}
      </div>
    </div>
  );
}

/**
 * Écran du haut, façon Nintendo DS : Luigi en 3D qui distribue.
 * Mêmes props que TopScene ; en cas d'absence de WebGL, version 2D.
 */
export default function TopScreen(props) {
  const [webgl] = useState(hasWebGL);
  const flat = <FlatLuigi {...props} />;

  if (!webgl) return flat;

  return (
    <SceneBoundary fallback={flat}>
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center text-xs font-black uppercase tracking-widest text-emerald-200">
            <span className="lpp-float">Luigi arrive…</span>
          </div>
        }
      >
        <TopScene {...props} />
      </Suspense>
    </SceneBoundary>
  );
}
