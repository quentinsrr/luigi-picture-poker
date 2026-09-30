/**
 * Réglages de la scène 3D de l'écran du haut.
 *
 * Unités : 1 unité ≈ 1 mètre. La table est centrée en x = 0, son plateau
 * est à y = TABLE_Y, Luigi se tient derrière (z négatif), la caméra devant.
 */

/**
 * Modèle 3D de Luigi. Laisse `null` pour garder le Luigi provisoire
 * construit en formes simples (LuigiPlaceholder.jsx).
 *
 * Pour brancher un vrai modèle : dépose un fichier glTF binaire dans
 * `public/models/luigi.glb` puis mets ici "./models/luigi.glb" (chemin
 * relatif : il doit marcher aussi dans les applis Capacitor). Voir la
 * section 5 du README.
 */
export const LUIGI_MODEL_URL = null;

/**
 * Correspondance action du jeu → nom du clip d'animation dans le .glb.
 * Adapte les noms de droite à ceux exportés depuis Blender. Un clip absent
 * est simplement ignoré (Luigi reste sur le clip précédent).
 */
export const LUIGI_CLIPS = {
  idle: "Idle",
  deal: "Deal",
  think: "Think",
  win: "Cheer",
  lose: "Sad",
};

/** Échelle et position du modèle .glb, à ajuster selon l'export. */
export const LUIGI_MODEL_TRANSFORM = {
  position: [0, 0, -1.05],
  rotation: [0, 0, 0],
  scale: 1,
};

export const TABLE_Y = 0.72;

export const CAMERA = {
  position: [0, 1.8, 2.45],
  lookAt: [0, 1.02, -0.3],
  fov: 42,
};

/** Dimensions d'une carte (ratio 5/7 comme les cartes HTML). */
export const CARD_W = 0.34;
export const CARD_H = CARD_W * 1.4;

/**
 * Inclinaison des cartes de Luigi vers la caméra (radians, 0 = à plat).
 * Un peu redressées, elles se lisent mieux sur un petit écran.
 */
export const LUIGI_CARD_TILT = 0.55;

/** Emplacements des cartes de Luigi, bord inférieur posé sur la table. */
export const LUIGI_SLOTS = [-2, -1, 0, 1, 2].map((k) => [
  k * (CARD_W + 0.05),
  TABLE_Y + (CARD_H / 2) * Math.sin(LUIGI_CARD_TILT) + 0.01,
  0.12,
]);

/** Le paquet, dans la main gauche de Luigi (à droite pour le joueur). */
export const DECK_POS = [0.42, TABLE_Y + 0.12, -0.55];

/** Point de fuite des cartes distribuées au joueur : vers l'écran du bas. */
export const PLAYER_EXIT = [0, TABLE_Y + 0.35, 2.6];
