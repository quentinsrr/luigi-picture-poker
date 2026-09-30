import { SYMBOLS, BY_ID } from "./symbols.js";
import { COPIES_PER_SYMBOL } from "./config.js";

/**
 * Construit un paquet mélangé d'identifiants de figures.
 * Par défaut : 5 exemplaires de chacune des 6 figures = 30 cartes.
 */
export function buildDeck(copies = COPIES_PER_SYMBOL) {
  const deck = [];
  for (const s of SYMBOLS) {
    for (let i = 0; i < copies; i++) deck.push(s.id);
  }
  // Mélange de Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Sabot de distribution. Encapsule la pioche pour que le composant React
 * n'ait pas à manipuler le tableau directement.
 *
 *   const dealer = createDealer();
 *   dealer.reset();               // nouveau paquet mélangé
 *   const carte = dealer.draw();  // objet figure complet
 */
export function createDealer(copies = COPIES_PER_SYMBOL) {
  let pile = buildDeck(copies);

  return {
    /** Tire une carte. Remélange automatiquement si le paquet est vide. */
    draw() {
      if (pile.length === 0) pile = buildDeck(copies);
      return BY_ID[pile.pop()];
    },
    /** Tire n cartes d'un coup. */
    drawMany(n) {
      return Array.from({ length: n }, () => this.draw());
    },
    /** Repart d'un paquet neuf et mélangé. */
    reset() {
      pile = buildDeck(copies);
    },
    /** Nombre de cartes encore dans le sabot. */
    get remaining() {
      return pile.length;
    },
  };
}
