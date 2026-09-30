import { useEffect, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";

import { LUIGI_CLIPS, LUIGI_MODEL_TRANSFORM } from "./config.js";

/**
 * Luigi chargé depuis un fichier .glb, animé par ses propres clips.
 * Utilisé automatiquement dès que LUIGI_MODEL_URL est renseigné.
 *
 * Même interface que LuigiPlaceholder : une seule prop `action`, que l'on
 * traduit en nom de clip via LUIGI_CLIPS, avec un fondu de 0,3 s.
 */
export default function LuigiModel({ url, action = "idle" }) {
  const group = useRef();
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    const clip = actions[LUIGI_CLIPS[action]] ?? actions[LUIGI_CLIPS.idle];
    if (!clip) return;
    clip.reset().fadeIn(0.3).play();
    return () => void clip.fadeOut(0.3);
  }, [action, actions]);

  return (
    <group ref={group} {...LUIGI_MODEL_TRANSFORM}>
      <primitive object={scene} />
    </group>
  );
}
