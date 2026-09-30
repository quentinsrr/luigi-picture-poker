import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color } from "three";

import { frontTexture, backTexture } from "./cardTextures.js";
import { CARD_W, CARD_H } from "./config.js";
import { TIMING } from "../game/config.js";

const FLIGHT_MS = TIMING.cardFlight;

const WHITE = new Color("#ffffff");
const DIMMED = new Color("#6b7f73");

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Une carte en 3D : elle vole de `from` à `to` (en arc), puis se retourne
 * quand `faceUp` change. Posée à plat sur la table, haut de la carte vers
 * Luigi, pour qu'elle se lise à l'endroit depuis la caméra.
 *
 * @param {object|null} card    figure (null = carte toujours face cachée)
 * @param {number[]}    from    point de départ du vol
 * @param {number[]}    to      point d'arrivée
 * @param {number}      delay   attente avant le décollage, en ms
 * @param {boolean}     faceUp
 * @param {boolean}     glow    fait partie de la combinaison gagnante
 * @param {boolean}     dim     hors combinaison, à l'abattage
 * @param {number}      tilt    inclinaison vers la caméra une fois posée (radians)
 * @param {() => void}  onArrive appelé une fois posée (sert aux cartes du joueur)
 */
export default function Card3D({
  card,
  from,
  to,
  delay = 0,
  faceUp = false,
  glow = false,
  dim = false,
  tilt = 0,
  onArrive,
}) {
  const root = useRef();
  const tilter = useRef();
  const flipper = useRef();
  const frontMat = useRef();
  const halo = useRef();

  const born = useMemo(() => performance.now(), []);
  const state = useRef({ flip: Math.PI, arrived: false });

  const front = card ? frontTexture(card) : null;
  const back = backTexture();

  useFrame((_, dt) => {
    const g = root.current;
    if (!g) return;

    const t = Math.min(1, Math.max(0, (performance.now() - born - delay) / FLIGHT_MS));
    const e = easeOut(t);
    g.visible = t > 0;

    // Vol en arc, avec un léger pivot qui se résorbe à l'arrivée.
    g.position.set(
      from[0] + (to[0] - from[0]) * e,
      from[1] + (to[1] - from[1]) * e + Math.sin(Math.PI * t) * 0.28,
      from[2] + (to[2] - from[2]) * e
    );
    g.rotation.y = (1 - e) * 0.9;
    tilter.current.rotation.x = -Math.PI / 2 + tilt * e;

    if (t >= 1 && !state.current.arrived) {
      state.current.arrived = true;
      onArrive?.();
    }

    // Retournement amorti autour du grand axe, carte soulevée à mi-course
    // pour que son bord ne traverse pas la table.
    const s = state.current;
    const target = faceUp && card ? 0 : Math.PI;
    s.flip += (target - s.flip) * Math.min(1, dt * 9);
    flipper.current.rotation.y = s.flip;
    g.position.y += Math.abs(Math.sin(s.flip)) * CARD_W * 0.55;

    if (frontMat.current) {
      frontMat.current.color.lerp(dim ? DIMMED : WHITE, Math.min(1, dt * 6));
    }
    if (halo.current) halo.current.visible = glow && faceUp;
  });

  return (
    <group ref={root} visible={false}>
      <group ref={tilter} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh ref={halo} position={[0, 0, -0.003]} visible={false}>
          <planeGeometry args={[CARD_W * 1.14, CARD_H * 1.1]} />
          <meshBasicMaterial color="#FDE047" transparent opacity={0.9} />
        </mesh>

        <group ref={flipper} rotation={[0, Math.PI, 0]}>
          {front && (
            <mesh>
              <planeGeometry args={[CARD_W, CARD_H]} />
              <meshStandardMaterial
                ref={frontMat}
                map={front}
                alphaTest={0.5}
                roughness={0.55}
              />
            </mesh>
          )}
          <mesh rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[CARD_W, CARD_H]} />
            <meshStandardMaterial map={back} alphaTest={0.5} roughness={0.55} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
