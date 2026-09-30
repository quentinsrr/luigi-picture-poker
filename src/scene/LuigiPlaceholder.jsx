import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { capEmblemTexture } from "./cardTextures.js";

const GREEN = "#1FA34A";
const BLUE = "#2446B8";
const SKIN = "#F6C9A0";
const BROWN = "#3B2414";
const WHITE = "#FFFFFF";

/**
 * Pose cible de chaque action : angles des bras (x = vers l'avant,
 * z = écarté), inclinaison de la tête et hauteur du corps.
 * Les valeurs dynamiques (balancier, saut) sont ajoutées dans useFrame.
 */
const POSES = {
  idle: { rArm: [-0.35, 0, 0.12], lArm: [-1.0, 0, -0.1], head: [0, 0, 0], y: 0 },
  deal: { rArm: [-1.05, 0, 0.2], lArm: [-1.0, 0, -0.1], head: [0.12, 0, 0], y: 0 },
  think: { rArm: [-2.15, 0, 0.55], lArm: [-0.9, 0, -0.1], head: [0.05, 0.15, 0.22], y: 0 },
  win: { rArm: [0, 0, 2.7], lArm: [0, 0, -2.7], head: [-0.2, 0, 0], y: 0.02 },
  lose: { rArm: [-0.1, 0, 0.05], lArm: [-0.1, 0, -0.05], head: [0.45, 0, 0], y: -0.06 },
};

const damp = (cur, target, k) => cur + (target - cur) * k;

function Arm({ side, armRef }) {
  return (
    <group ref={armRef} position={[side * 0.3, 1.18, 0]}>
      <mesh position={[0, -0.05, 0]}>
        <sphereGeometry args={[0.1, 16, 12]} />
        <meshStandardMaterial color={GREEN} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[0.075, 0.07, 0.34, 14]} />
        <meshStandardMaterial color={GREEN} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.43, 0]}>
        <sphereGeometry args={[0.1, 16, 12]} />
        <meshStandardMaterial color={WHITE} roughness={0.5} />
      </mesh>
    </group>
  );
}

/**
 * Luigi provisoire, construit en primitives : il occupe la place du futur
 * modèle 3D et en valide déjà les besoins (pivot de tête, bras, actions).
 *
 * @param {"idle"|"deal"|"think"|"win"|"lose"} action
 */
export default function LuigiPlaceholder({ action = "idle", position = [0, 0, -1.05] }) {
  const body = useRef();
  const head = useRef();
  const rArm = useRef();
  const lArm = useRef();
  const eyes = useRef();

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const k = Math.min(1, dt * 8);
    const pose = POSES[action] ?? POSES.idle;

    // Corps : respiration, saut de joie ou affaissement.
    const jump = action === "win" ? Math.abs(Math.sin(t * 7)) * 0.14 : 0;
    const breathe = Math.sin(t * 2) * 0.008;
    body.current.position.y = pose.y + breathe + jump;
    body.current.rotation.z = damp(
      body.current.rotation.z,
      action === "think" ? Math.sin(t * 1.4) * 0.05 : 0,
      k
    );

    // Tête : pose de base + petit balancement.
    const sway = action === "idle" ? Math.sin(t * 0.9) * 0.08 : 0;
    const nod = action === "deal" ? Math.sin(t * 14) * 0.06 : 0;
    head.current.rotation.x = damp(head.current.rotation.x, pose.head[0] + nod, k);
    head.current.rotation.y = damp(head.current.rotation.y, pose.head[1] + sway, k);
    head.current.rotation.z = damp(head.current.rotation.z, pose.head[2], k);

    // Bras droit : il lance les cartes pendant la distribution.
    const flick = action === "deal" ? Math.sin(t * 16) * 0.4 : 0;
    const wave = action === "win" ? Math.sin(t * 7) * 0.25 : 0;
    rArm.current.rotation.x = damp(rArm.current.rotation.x, pose.rArm[0] + flick, k);
    rArm.current.rotation.z = damp(rArm.current.rotation.z, pose.rArm[2] + wave, k);
    lArm.current.rotation.x = damp(lArm.current.rotation.x, pose.lArm[0], k);
    lArm.current.rotation.z = damp(lArm.current.rotation.z, pose.lArm[2] - wave, k);

    // Clignement toutes les ~4 s.
    eyes.current.scale.y = t % 4 < 0.12 ? 0.15 : 1;
  });

  return (
    <group position={position}>
      <group ref={body}>
        {/* Salopette et chemise */}
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.3, 0.33, 0.6, 24]} />
          <meshStandardMaterial color={BLUE} roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.07, 0]}>
          <cylinderGeometry args={[0.26, 0.3, 0.34, 24]} />
          <meshStandardMaterial color={GREEN} roughness={0.7} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * 0.13, 1.05, 0.27]} rotation={[-0.12, 0, 0]}>
              <boxGeometry args={[0.07, 0.36, 0.02]} />
              <meshStandardMaterial color={BLUE} roughness={0.8} />
            </mesh>
            <mesh position={[s * 0.13, 0.93, 0.3]}>
              <sphereGeometry args={[0.035, 12, 10]} />
              <meshStandardMaterial color="#F7C325" metalness={0.4} roughness={0.3} />
            </mesh>
          </group>
        ))}

        <Arm side={-1} armRef={rArm} />
        <Arm side={1} armRef={lArm} />

        {/* Tête, pivot au niveau du cou */}
        <group ref={head} position={[0, 1.25, 0]}>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.25, 32, 24]} />
            <meshStandardMaterial color={SKIN} roughness={0.6} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.245, 0.19, -0.01]} scale={[0.5, 1, 0.8]}>
              <sphereGeometry args={[0.07, 12, 10]} />
              <meshStandardMaterial color={SKIN} roughness={0.6} />
            </mesh>
          ))}

          {/* Casquette */}
          <mesh position={[0, 0.27, 0]}>
            <sphereGeometry args={[0.265, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={GREEN} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.275, 0.2]} rotation={[0.1, 0, 0]} scale={[1, 1, 0.75]}>
            <cylinderGeometry args={[0.2, 0.2, 0.025, 24, 1, false, -Math.PI / 2, Math.PI]} />
            <meshStandardMaterial color={GREEN} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.39, 0.215]} rotation={[-0.55, 0, 0]}>
            <circleGeometry args={[0.075, 24]} />
            <meshStandardMaterial map={capEmblemTexture()} roughness={0.6} />
          </mesh>

          {/* Yeux */}
          <group ref={eyes} position={[0, 0.25, 0]}>
            {[-1, 1].map((s) => (
              <group key={s} position={[s * 0.068, 0, 0.215]}>
                <mesh scale={[0.045, 0.07, 0.03]}>
                  <sphereGeometry args={[1, 16, 12]} />
                  <meshStandardMaterial color={WHITE} roughness={0.3} />
                </mesh>
                <mesh position={[0, -0.005, 0.024]} scale={[0.022, 0.035, 0.012]}>
                  <sphereGeometry args={[1, 12, 10]} />
                  <meshStandardMaterial color="#1E4FA8" roughness={0.3} />
                </mesh>
              </group>
            ))}
          </group>

          {/* Nez et moustache */}
          <mesh position={[0, 0.17, 0.26]}>
            <sphereGeometry args={[0.07, 20, 16]} />
            <meshStandardMaterial color="#F2B389" roughness={0.5} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh
              key={s}
              position={[s * 0.065, 0.1, 0.225]}
              rotation={[0, 0, s * -0.3]}
              scale={[0.085, 0.035, 0.04]}
            >
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color={BROWN} roughness={0.9} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
