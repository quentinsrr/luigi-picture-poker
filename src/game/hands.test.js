/**
 * Tests de la logique pure, sans dépendance externe.
 * Lancement : npm test   (utilise le runner intégré de Node 18+)
 */
import test from "node:test";
import assert from "node:assert/strict";

import { BY_ID } from "./symbols.js";
import { evaluate, compareHands, keyIndices, CATEGORY } from "./hands.js";
import { luigiStrategy } from "./ai.js";
import { buildDeck, createDealer } from "./deck.js";

/** Raccourci : main("luigi", "luigi", "mario", ...) */
const main = (...ids) => ids.map((id) => BY_ID[id]);

test("reconnaît les sept combinaisons", () => {
  const cas = [
    [main("luigi", "luigi", "luigi", "luigi", "luigi"), CATEGORY.FIVE_OF_A_KIND],
    [main("luigi", "luigi", "luigi", "luigi", "mushroom"), CATEGORY.FOUR_OF_A_KIND],
    [main("luigi", "luigi", "luigi", "mario", "mario"), CATEGORY.FULL_HOUSE],
    [main("luigi", "luigi", "luigi", "mario", "star"), CATEGORY.THREE_OF_A_KIND],
    [main("luigi", "luigi", "mario", "mario", "star"), CATEGORY.TWO_PAIR],
    [main("luigi", "luigi", "mario", "star", "yoshi"), CATEGORY.PAIR],
    [main("luigi", "mario", "star", "yoshi", "mushroom"), CATEGORY.HIGH_CARD],
  ];
  for (const [hand, attendu] of cas) {
    assert.equal(evaluate(hand).category, attendu);
  }
});

test("une combinaison plus forte l'emporte", () => {
  const full = main("mario", "mario", "mario", "star", "star");
  const brelan = main("luigi", "luigi", "luigi", "star", "yoshi");
  assert.equal(compareHands(full, brelan), 1);
  assert.equal(compareHands(brelan, full), -1);
});

test("à combinaison égale, la figure la plus forte départage", () => {
  const paireLuigi = main("luigi", "luigi", "star", "yoshi", "mushroom");
  const paireMario = main("mario", "mario", "star", "yoshi", "mushroom");
  assert.equal(compareHands(paireLuigi, paireMario), 1);
});

test("deux mains identiques donnent une égalité", () => {
  const m = main("luigi", "luigi", "star", "yoshi", "mushroom");
  assert.equal(compareHands(m, [...m]), 0);
});

test("keyIndices isole les cartes de la combinaison", () => {
  const deuxPaires = main("luigi", "luigi", "mario", "mario", "star");
  assert.deepEqual(keyIndices(deuxPaires), [0, 1, 2, 3]);

  const carteHaute = main("mushroom", "fireflower", "star", "yoshi", "luigi");
  assert.deepEqual(keyIndices(carteHaute), [4]);
});

test("Luigi ne casse jamais un full ou mieux", () => {
  assert.deepEqual(luigiStrategy(main("luigi", "luigi", "luigi", "mario", "mario")), []);
  assert.deepEqual(luigiStrategy(main("star", "star", "star", "star", "mario")), []);
});

test("Luigi garde ses groupes", () => {
  // Brelan : il jette les deux cartes isolées.
  assert.deepEqual(
    luigiStrategy(main("luigi", "luigi", "luigi", "mario", "star")),
    [3, 4]
  );
  // Deux paires : il ne jette que la cinquième carte.
  assert.deepEqual(
    luigiStrategy(main("luigi", "luigi", "mario", "mario", "star")),
    [4]
  );
});

test("Luigi garde son kicker fort quand le hasard le veut", () => {
  const hand = main("mushroom", "mushroom", "star", "yoshi", "luigi");
  // random() bas => il conserve le Luigi (index 4)
  assert.deepEqual(luigiStrategy(hand, () => 0), [2, 3]);
  // random() haut => il le jette aussi
  assert.deepEqual(luigiStrategy(hand, () => 0.99), [2, 3, 4]);
});

test("le paquet contient 30 cartes et 6 figures", () => {
  const deck = buildDeck();
  assert.equal(deck.length, 30);
  assert.equal(new Set(deck).size, 6);
});

test("le sabot remélange quand il est vide", () => {
  const dealer = createDealer();
  for (let i = 0; i < 30; i++) dealer.draw();
  assert.equal(dealer.remaining, 0);
  assert.ok(dealer.draw().id); // pioche encore sans planter
});
