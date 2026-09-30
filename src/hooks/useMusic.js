import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "lpp-music";

function readPref() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

function writePref(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    /* navigation privée : le choix ne sera juste pas retenu */
  }
}

/**
 * Musique de fond en boucle.
 *
 * Les navigateurs mobiles refusent de jouer un son avant un geste de
 * l'utilisateur : la lecture démarre donc au premier toucher de l'écran.
 * Elle se met en pause quand l'appli passe en arrière-plan et reprend au
 * retour. Le choix « musique coupée » est mémorisé d'une visite à l'autre.
 *
 * @param {string} src     chemin du fichier audio
 * @param {number} volume  0 à 1 (ignoré par iOS, qui suit le volume du téléphone)
 * @returns {{ on: boolean, toggle: () => void }}
 */
export function useMusic(src, volume = 0.45) {
  const [on, setOn] = useState(readPref);
  const audio = useRef(null);
  const onRef = useRef(on);
  onRef.current = on;

  const tryPlay = useCallback(() => {
    const a = audio.current;
    if (!a || !onRef.current || document.hidden) return;
    a.play().catch(() => {
      /* pas encore de geste utilisateur : on réessaiera au prochain toucher */
    });
  }, []);

  useEffect(() => {
    const a = new Audio(src);
    a.loop = true;
    a.volume = volume;
    a.preload = "auto";
    audio.current = a;

    const onGesture = () => {
      tryPlay();
      if (!a.paused) {
        window.removeEventListener("pointerdown", onGesture);
        window.removeEventListener("keydown", onGesture);
      }
    };
    const onVisibility = () => (document.hidden ? a.pause() : tryPlay());

    window.addEventListener("pointerdown", onGesture);
    window.addEventListener("keydown", onGesture);
    document.addEventListener("visibilitychange", onVisibility);
    tryPlay();

    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      document.removeEventListener("visibilitychange", onVisibility);
      a.pause();
      audio.current = null;
    };
  }, [src, volume, tryPlay]);

  const toggle = useCallback(() => {
    const next = !onRef.current;
    onRef.current = next;
    setOn(next);
    writePref(next);
    if (next) tryPlay();
    else audio.current?.pause();
  }, [tryPlay]);

  return { on, toggle };
}
