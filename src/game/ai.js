import { evaluate, CATEGORY } from "./hands.js";

/**
 * Décide quelles cartes Luigi jette.
 *
 * Sa logique :
 *   - Full, carré ou cinq d'un coup : il ne touche à rien.
 *   - Brelan, deux paires, paire : il garde son ou ses groupes.
 *   - Avec une simple paire, il conserve souvent un kicker Mario ou Luigi,
 *     ce qui lui donne une chance de full ou de deux paires fortes.
 *   - Carte haute : il garde sa figure la plus forte, et parfois la deuxième
 *     si elle vaut au moins un Yoshi.
 *
 * La part d'aléatoire l'empêche d'être totalement prévisible. Passe une
 * fonction `random` déterministe pour le tester.
 *
 * @param {Array<{id:string, rank:number}>} hand
 * @param {() => number} random
 * @returns {number[]} indices des cartes à remplacer
 */
export function luigiStrategy(hand, random = Math.random) {
  const { category, groups } = evaluate(hand);

  // Main déjà excellente : on n'y touche pas.
  if (category >= CATEGORY.FULL_HOUSE) return [];

  const keep = new Set();

  if (category >= CATEGORY.PAIR) {
    // Il existe au moins un groupe de 2 : on le garde entièrement.
    const keptIds = groups.filter((g) => g.count >= 2).map((g) => g.id);
    hand.forEach((card, i) => {
      if (keptIds.includes(card.id)) keep.add(i);
    });

    // Simple paire : garder un gros kicker (Mario ou Luigi) 2 fois sur 3.
    if (category === CATEGORY.PAIR) {
      const kicker = hand
        .map((card, i) => ({ i, rank: card.rank }))
        .filter((c) => !keep.has(c.i))
        .sort((a, b) => b.rank - a.rank)[0];

      if (kicker && kicker.rank >= 5 && random() < 0.65) keep.add(kicker.i);
    }
  } else {
    // Carte haute : conserver les figures fortes.
    const sorted = hand
      .map((card, i) => ({ i, rank: card.rank }))
      .sort((a, b) => b.rank - a.rank);

    keep.add(sorted[0].i);
    if (sorted[1] && sorted[1].rank >= 4 && random() < 0.5) keep.add(sorted[1].i);
  }

  return hand.map((_, i) => i).filter((i) => !keep.has(i));
}
