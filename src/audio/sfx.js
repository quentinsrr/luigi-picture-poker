/**
 * Effets sonores synthétisés avec la Web Audio API.
 *
 * Aucun fichier : chaque son est fabriqué à la volée (oscillateurs et bruit
 * filtré), façon console portable. Rien à télécharger, aucun droit à gérer.
 *
 *   import { sfx } from "./audio/sfx.js";
 *   sfx.deal();  sfx.flip();  sfx.win(3);
 *
 * Les navigateurs mobiles gardent le contexte audio suspendu jusqu'au
 * premier geste de l'utilisateur : `unlock()` est branché une fois pour
 * toutes sur le premier toucher de l'écran.
 */

let ctx = null;
let master = null;
let noise = null;
let enabled = true;

function audio() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);

  // Une seconde de bruit blanc, réutilisée par tous les sons « papier ».
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return ctx;
}

function unlock() {
  const c = audio();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

if (typeof window !== "undefined") {
  const once = () => {
    unlock();
    window.removeEventListener("pointerdown", once);
    window.removeEventListener("keydown", once);
  };
  window.addEventListener("pointerdown", once);
  window.addEventListener("keydown", once);
}

/** Contexte prêt à jouer, ou null (son coupé, pas encore de geste, pas de Web Audio). */
function ready() {
  if (!enabled) return null;
  const c = audio();
  return c && c.state === "running" ? c : null;
}

/** Note simple avec enveloppe attaque / déclin. */
function tone(c, { freq, to, type = "square", at = 0, dur = 0.12, vol = 0.2 }) {
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** Souffle de bruit filtré : glissement de carte, froissement. */
function swish(c, { at = 0, dur = 0.09, freq = 2400, q = 0.9, vol = 0.35 }) {
  const t = c.currentTime + at;
  const src = c.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(freq, t);
  filter.frequency.exponentialRampToValueAtTime(freq * 0.45, t + dur);
  filter.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(g).connect(master);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

// Notes (Hz) pour les petites mélodies.
const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568 };

export const sfx = {
  /** Active ou coupe tous les effets (suit le bouton haut-parleur). */
  setEnabled(on) {
    enabled = on;
  },

  /** Une carte part du paquet. */
  deal() {
    const c = ready();
    if (c) swish(c, { dur: 0.1, freq: 2600, vol: 0.3 });
  },

  /** Une carte se retourne. */
  flip() {
    const c = ready();
    if (!c) return;
    swish(c, { dur: 0.05, freq: 4200, q: 1.4, vol: 0.28 });
    tone(c, { freq: 1400, to: 900, type: "triangle", dur: 0.05, vol: 0.06 });
  },

  /** Carte touchée pour l'échange (plus aigu à la sélection). */
  select(on) {
    const c = ready();
    if (c) tone(c, { freq: on ? 880 : 660, to: on ? 1320 : 440, dur: 0.07, vol: 0.09 });
  },

  /** Jeton posé (choix de la mise). */
  coin() {
    const c = ready();
    if (!c) return;
    tone(c, { freq: N.E6, type: "square", dur: 0.06, vol: 0.07 });
    tone(c, { freq: N.G6, type: "square", at: 0.05, dur: 0.12, vol: 0.07 });
  },

  /**
   * Victoire : arpège montant, plus long et plus brillant pour les grosses
   * combinaisons, puis une pluie de jetons.
   * @param {number} category catégorie de la main gagnante (0 à 6)
   */
  win(category = 1) {
    const c = ready();
    if (!c) return;
    const notes = category >= 4
      ? [N.C5, N.E5, N.G5, N.C6, N.E6, N.G6]
      : [N.C5, N.E5, N.G5, N.C6];
    const step = 0.09;
    notes.forEach((f, i) => {
      tone(c, { freq: f, type: "square", at: i * step, dur: 0.14, vol: 0.1 });
      tone(c, { freq: f / 2, type: "triangle", at: i * step, dur: 0.16, vol: 0.12 });
    });
    const end = notes.length * step;
    tone(c, { freq: notes[notes.length - 1], type: "square", at: end, dur: 0.45, vol: 0.1 });
    const coins = Math.min(3 + category * 2, 12);
    for (let i = 0; i < coins; i++) {
      tone(c, { freq: N.E6 + Math.random() * 600, at: end + 0.1 + i * 0.06, dur: 0.07, vol: 0.05 });
    }
  },

  /** Défaite : « wah-wah » descendant. */
  lose() {
    const c = ready();
    if (!c) return;
    [
      [392, 370],
      [370, 349],
      [349, 262],
    ].forEach(([f, to], i) => {
      tone(c, {
        freq: f,
        to,
        type: "sawtooth",
        at: i * 0.28,
        dur: i === 2 ? 0.6 : 0.24,
        vol: 0.07,
      });
    });
  },

  /** Égalité : deux notes neutres. */
  tie() {
    const c = ready();
    if (!c) return;
    tone(c, { freq: N.G5, type: "triangle", dur: 0.14, vol: 0.12 });
    tone(c, { freq: N.G5, type: "triangle", at: 0.16, dur: 0.22, vol: 0.12 });
  },
};
