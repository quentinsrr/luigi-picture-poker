/**
 * Tous les réglages du jeu au même endroit.
 * Modifie ces valeurs pour ajuster l'équilibrage sans toucher au reste.
 */

export const STARTING_CHIPS = 10;
export const MIN_BET = 1;
export const MAX_BET = 5;

/** Nombre d'exemplaires de chaque figure dans le paquet (6 × 5 = 30 cartes). */
export const COPIES_PER_SYMBOL = 5;

/** Durées des animations, en millisecondes. */
export const TIMING = {
  dealStep: 100, // Luigi distribue une carte toutes les 100 ms (joueur, Luigi, joueur…)
  cardFlight: 380, // vol d'une carte, du paquet à sa place
  dealSettle: 1250, // temps avant le premier retournement (toutes les cartes posées)
  flipStep: 130, // décalage entre deux cartes qui se retournent
  afterDeal: 320, // pause avant de rendre la main au joueur
  swapHide: 400, // temps que la carte jetée reste face cachée
  swapShow: 650, // arrivée de la nouvelle carte avant de la révéler (+ 2 × dealStep par carte)
  beforeLuigi: 500, // pause avant le tour de Luigi
  luigiThink: 900, // « Luigi réfléchit… »
  luigiSwap: 900, // pause après son échange (+ 2 × dealStep par carte)
  showdownStep: 160, // décalage entre deux cartes de Luigi révélées
  beforeSettle: 480, // pause avant l'annonce du résultat
};
