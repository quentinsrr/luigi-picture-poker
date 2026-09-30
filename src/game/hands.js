import { BY_ID } from "./symbols.js";

/**
 * Les sept combinaisons, de la plus faible à la plus forte.
 * L'index dans ce tableau EST la catégorie renvoyée par evaluate().
 * `payout` est le multiplicateur appliqué à la mise en cas de victoire.
 */
export const HANDS = [
  { name: "Carte haute", short: "Carte haute", payout: 1 },
  { name: "Une paire", short: "Paire", payout: 1 },
  { name: "Deux paires", short: "2 paires", payout: 2 },
  { name: "Brelan", short: "Brelan", payout: 3 },
  { name: "Full House", short: "Full", payout: 5 },
  { name: "Carré", short: "Carré", payout: 10 },
  { name: "Cinq d'un coup", short: "Cinq", payout: 20 },
];

export const CATEGORY = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  FULL_HOUSE: 4,
  FOUR_OF_A_KIND: 5,
  FIVE_OF_A_KIND: 6,
};

/** Motif des effectifs → catégorie. "32" = trois cartes + deux cartes = full. */
const PATTERNS = {
  5: CATEGORY.FIVE_OF_A_KIND,
  41: CATEGORY.FOUR_OF_A_KIND,
  32: CATEGORY.FULL_HOUSE,
  311: CATEGORY.THREE_OF_A_KIND,
  221: CATEGORY.TWO_PAIR,
  2111: CATEGORY.PAIR,
};

/**
 * Évalue une main de 5 cartes.
 * @param {Array<{id:string, rank:number}>} hand
 * @returns {{category:number, groups:Array, tiebreak:number[]}}
 *   groups   : figures regroupées, triées par effectif puis par force.
 *   tiebreak : forces des figures dans cet ordre, pour départager deux
 *              mains de même catégorie.
 */
export function evaluate(hand) {
  const counts = {};
  for (const card of hand) counts[card.id] = (counts[card.id] || 0) + 1;

  const groups = Object.entries(counts)
    .map(([id, count]) => ({ id, count, rank: BY_ID[id].rank }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);

  const pattern = groups.map((g) => g.count).join("");
  const category = PATTERNS[pattern] ?? CATEGORY.HIGH_CARD;

  return { category, groups, tiebreak: groups.map((g) => g.rank) };
}

/**
 * Compare deux mains.
 * @returns {number} 1 si `a` gagne, -1 si `b` gagne, 0 en cas d'égalité.
 */
export function compareHands(a, b) {
  const ea = evaluate(a);
  const eb = evaluate(b);

  if (ea.category !== eb.category) return ea.category > eb.category ? 1 : -1;

  const len = Math.max(ea.tiebreak.length, eb.tiebreak.length);
  for (let i = 0; i < len; i++) {
    const x = ea.tiebreak[i] ?? 0;
    const y = eb.tiebreak[i] ?? 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

/**
 * Indices des cartes qui forment réellement la combinaison.
 * Sert à surligner les bonnes cartes à l'abattage.
 */
export function keyIndices(hand) {
  const { category, groups } = evaluate(hand);

  if (category === CATEGORY.HIGH_CARD) {
    let best = 0;
    hand.forEach((card, i) => {
      if (card.rank > hand[best].rank) best = i;
    });
    return [best];
  }

  const ids = groups.filter((g) => g.count >= 2).map((g) => g.id);
  return hand
    .map((card, i) => (ids.includes(card.id) ? i : -1))
    .filter((i) => i >= 0);
}

/** Gain net en cas de victoire, hors remboursement de la mise. */
export function payoutFor(category, bet) {
  return bet * HANDS[category].payout;
}
