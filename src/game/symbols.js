/**
 * Les six figures du paquet, de la plus faible à la plus forte.
 *
 * rank   : force de la figure, sert au départage (une paire de Luigi bat
 *          une paire de Mario).
 * emoji  : glyphe affiché, OU
 * letter : lettre affichée dans une pastille colorée (Mario et Luigi).
 * face   : dégradé du recto de la carte.
 * edge   : couleur du liseré.
 * label  : classe Tailwind pour le nom écrit sous le glyphe.
 */
export const SYMBOLS = [
  {
    id: "mushroom",
    name: "Champignon",
    rank: 1,
    emoji: "🍄",
    face: "linear-gradient(160deg,#FFF7F5 0%,#FFE1DC 100%)",
    edge: "#E8503A",
    label: "text-rose-700",
  },
  {
    id: "fireflower",
    name: "Fleur de feu",
    rank: 2,
    emoji: "🔥",
    face: "linear-gradient(160deg,#FFFBF0 0%,#FFE7C2 100%)",
    edge: "#F08A1E",
    label: "text-orange-700",
  },
  {
    id: "star",
    name: "Étoile",
    rank: 3,
    emoji: "⭐",
    face: "linear-gradient(160deg,#FFFDF0 0%,#FFF2B8 100%)",
    edge: "#E3B01E",
    label: "text-amber-700",
  },
  {
    id: "yoshi",
    name: "Yoshi",
    rank: 4,
    emoji: "🥚",
    face: "linear-gradient(160deg,#F3FFF6 0%,#D6F7E0 100%)",
    edge: "#2FA95F",
    label: "text-emerald-700",
  },
  {
    id: "mario",
    name: "Mario",
    rank: 5,
    letter: "M",
    badge: "#D8271C",
    face: "linear-gradient(160deg,#FFF4F4 0%,#FFD9D6 100%)",
    edge: "#B71C13",
    label: "text-red-700",
  },
  {
    id: "luigi",
    name: "Luigi",
    rank: 6,
    letter: "L",
    badge: "#0E9F4F",
    face: "linear-gradient(160deg,#F2FFF7 0%,#CDF3DC 100%)",
    edge: "#0B7C3E",
    label: "text-green-700",
  },
];

/** Accès direct à une figure par son identifiant. */
export const BY_ID = Object.fromEntries(SYMBOLS.map((s) => [s.id, s]));
