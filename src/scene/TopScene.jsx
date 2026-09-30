import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";

import Card3D from "./Card3D.jsx";
import { useArrivalOrder } from "../hooks/useArrivalOrder.js";
import { TIMING } from "../game/config.js";
import LuigiPlaceholder from "./LuigiPlaceholder.jsx";
import { backTexture } from "./cardTextures.js";
import {
  CAMERA,
  CARD_W,
  CARD_H,
  DECK_POS,
  LUIGI_CARD_TILT,
  LUIGI_MODEL_URL,
  LUIGI_SLOTS,
  PLAYER_EXIT,
  TABLE_Y,
} from "./config.js";

const DEAL_STEP = TIMING.dealStep;

// Le chargeur glTF (drei) n'est téléchargé que si un modèle est configuré.
const LuigiModel = lazy(() => import("./LuigiModel.jsx"));

function CameraRig() {
  const { camera, size } = useThree();
  useEffect(() => {
    // Écran étroit : on recule un peu pour garder les 5 cartes dans le cadre.
    const aspect = size.width / size.height;
    const back = aspect < 1.25 ? (1.25 - aspect) * 1.6 : 0;
    camera.position.set(CAMERA.position[0], CAMERA.position[1] + back * 0.35, CAMERA.position[2] + back);
    camera.lookAt(...CAMERA.lookAt);
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function Table() {
  return (
    <group position={[0, TABLE_Y, 0.05]} scale={[1, 1, 0.62]}>
      <mesh position={[0, -0.035, 0]}>
        <cylinderGeometry args={[1.62, 1.62, 0.07, 64]} />
        <meshStandardMaterial color="#0E7A45" roughness={0.95} />
      </mesh>
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[1.74, 1.7, 0.1, 64]} />
        <meshStandardMaterial color="#8A5A2B" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.35, 1.38, 64]} />
        <meshBasicMaterial color="#F7E27A" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/** Le paquet : une petite pile, dos visible. */
function Deck() {
  return (
    <group position={DECK_POS} rotation={[-Math.PI / 2 + 0.35, 0, 0.25]}>
      <mesh position={[0, 0, -0.025]}>
        <boxGeometry args={[CARD_W, CARD_H, 0.05]} />
        <meshStandardMaterial color="#F4F1E6" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshStandardMaterial map={backTexture()} alphaTest={0.5} roughness={0.55} />
      </mesh>
    </group>
  );
}

/**
 * Cartes du joueur qui quittent la table vers l'écran du bas.
 * Chaque nouvel identifiant de carte du joueur fait partir une carte ;
 * elle disparaît une fois arrivée hors champ.
 */
function PlayerFlyers({ uids, dealt }) {
  const [flyers, setFlyers] = useState([]);
  const seen = useRef(new Set());

  useEffect(() => {
    if (!dealt) return;
    const fresh = uids.filter((u) => !seen.current.has(u));
    fresh.forEach((u) => seen.current.add(u));
    if (fresh.length === 0) return;
    setFlyers((f) => [
      ...f,
      ...fresh.map((uid, order) => ({ uid, delay: order * DEAL_STEP * 2 })),
    ]);
  }, [uids, dealt]);

  const remove = (uid) => setFlyers((f) => f.filter((x) => x.uid !== uid));

  return flyers.map((f) => (
    <Card3D
      key={f.uid}
      card={null}
      from={DECK_POS}
      to={PLAYER_EXIT}
      delay={f.delay}
      onArrive={() => remove(f.uid)}
    />
  ));
}

/**
 * Écran du haut : Luigi derrière sa table, ses cinq cartes devant lui.
 *
 * @param {object[]} luigiHand  figures de Luigi
 * @param {object}   uids       { p: [...], l: [...] } identifiants de cartes
 * @param {boolean[]} luigiUp   cartes de Luigi retournées
 * @param {number[]} luigiKeys  indices de sa combinaison, à l'abattage
 * @param {boolean}  showdown
 * @param {boolean}  dealt      les mains sont distribuées
 * @param {string}   action     ce que fait Luigi (voir LuigiPlaceholder)
 */
export default function TopScene({
  luigiHand,
  uids,
  luigiUp,
  luigiKeys,
  showdown,
  dealt,
  action,
}) {
  // Délai de vol de chaque carte de Luigi, lu seulement au montage de la
  // carte. À la distribution, ses cartes alternent avec celles du joueur ;
  // lors d'un échange, seules les nouvelles partent, l'une après l'autre.
  const { order, fullDeal } = useArrivalOrder(uids.l, dealt);
  const luigiDelays = order.map((k) =>
    k < 0 ? 0 : k * DEAL_STEP * 2 + (fullDeal ? DEAL_STEP : 0)
  );

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: CAMERA.fov, position: CAMERA.position, near: 0.1, far: 30 }}
    >
      <CameraRig />
      <ambientLight intensity={1.1} />
      <hemisphereLight args={["#FFF6D8", "#0B3D26", 0.9]} />
      <directionalLight position={[1.5, 4, 3]} intensity={1.6} />

      <Suspense fallback={<LuigiPlaceholder action={action} />}>
        {LUIGI_MODEL_URL ? (
          <LuigiModel url={LUIGI_MODEL_URL} action={action} />
        ) : (
          <LuigiPlaceholder action={action} />
        )}
      </Suspense>

      <Table />
      <Deck />

      {dealt &&
        luigiHand.map((card, i) => (
          <Card3D
            key={uids.l[i]}
            card={card}
            from={DECK_POS}
            to={LUIGI_SLOTS[i]}
            delay={luigiDelays[i]}
            tilt={LUIGI_CARD_TILT}
            faceUp={luigiUp[i]}
            glow={luigiKeys.includes(i)}
            dim={showdown && !luigiKeys.includes(i)}
          />
        ))}

      <PlayerFlyers uids={uids.p} dealt={dealt} />
    </Canvas>
  );
}
