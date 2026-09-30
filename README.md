# Luigi's Picture Poker

Le poker à symboles de Luigi, en React + Tailwind, avec un écran scindé façon Nintendo DS : **Luigi en 3D en haut** (three.js), **vos cartes en bas**, sous le pouce. Jouable dans le navigateur, installable comme appli, et empaquetable pour **iPhone et Android** avec Capacitor.

---

## 1. Démarrer

Il te faut **Node.js 18 ou plus** (`node -v` pour vérifier).

```bash
cd luigi-picture-poker
npm install
npm run dev
```

Vite affiche deux adresses :

```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.42:5173/
```

La seconde est celle à ouvrir **sur ton téléphone**, connecté au même Wi-Fi. C'est la façon la plus rapide de tester le tactile pour de vrai. Si elle ne s'affiche pas, vérifie que ton pare-feu laisse passer le port 5173.

| Commande | Ce qu'elle fait |
| --- | --- |
| `npm run dev` | serveur de développement avec rechargement à chaud |
| `npm run build` | build de production dans `dist/` |
| `npm run preview` | sert le `dist/` pour vérifier le build |
| `npm test` | joue les 10 tests de logique (runner natif de Node, aucune dépendance) |
| `npm run android` | build + copie dans `android/` + ouvre Android Studio |
| `npm run ios` | build + copie dans `ios/` + ouvre Xcode (Mac uniquement) |
| `npm run sync` | build + copie dans les deux projets natifs, sans rien ouvrir |
| `npm run icons` | régénère icônes et écrans de démarrage natifs depuis `assets/icon.png` |

---

## 2. Structure

```
luigi-picture-poker/
├── index.html                  page racine, métas mobiles, manifeste PWA
├── vite.config.js              React + Tailwind v4, chemins relatifs (web + natif)
├── capacitor.config.json       identifiant d'appli, barres système, fond
├── android/  ios/              projets natifs générés par Capacitor
├── assets/icon.png             source des icônes natives (1024 px)
├── public/
│   ├── manifest.webmanifest    installation « écran d'accueil »
│   └── icons/                  icônes web (SVG + PNG)
└── src/
    ├── main.jsx                montage React + réglages natifs
    ├── native.js               portrait verrouillé, barres système (appli seulement)
    ├── LuigiPicturePoker.jsx   le jeu : état, phases, les deux écrans
    ├── index.css               Tailwind + animations (@keyframes, flip 3D CSS)
    ├── game/                   logique pure, sans React, testable
    │   ├── config.js           jetons, mises, TOUTES les durées (HTML et 3D)
    │   ├── symbols.js          les 6 figures et leur force
    │   ├── deck.js             paquet de 30 cartes, mélange, sabot
    │   ├── hands.js            évaluation, comparaison, gains
    │   ├── ai.js               stratégie d'échange de Luigi
    │   └── hands.test.js       tests
    ├── hooks/
    │   └── useArrivalOrder.js  quelles cartes viennent d'arriver (échelonnage)
    ├── scene/                  l'écran du haut en 3D (three.js / react-three-fiber)
    │   ├── config.js           caméra, table, emplacements, modèle de Luigi
    │   ├── TopScene.jsx        Canvas, lumières, table, paquet, vols de cartes
    │   ├── Card3D.jsx          carte 3D : vol en arc, retournement, surbrillance
    │   ├── cardTextures.js     recto/verso dessinés au canvas, mis en cache
    │   ├── LuigiPlaceholder.jsx Luigi provisoire en primitives, animé
    │   └── LuigiModel.jsx      Luigi en .glb, animé par ses clips
    └── components/
        ├── TopScreen.jsx       charge la 3D à part, repli 2D sans WebGL
        ├── PlayingCard.jsx     carte HTML avec retournement 3D CSS
        ├── Glyph.jsx           emoji ou pastille à initiale
        ├── Coin.jsx            jeton doré
        ├── BigButton.jsx       bouton d'action 56 px
        ├── EmptySlot.jsx       emplacement avant distribution
        └── RulesSheet.jsx      panneau règles et gains
```

Le découpage tient en une règle : **`game/` ne connaît ni React ni la 3D, `components/` et `scene/` ne connaissent pas les règles.** Le composant principal fait le lien. La scène 3D ne reçoit que des données d'affichage (mains, cartes retournées, `action` de Luigi) : elle ne décide de rien.

---

## 3. Les règles

**Le paquet** — 30 cartes : 5 exemplaires de chacune des 6 figures.

Champignon < Fleur de feu < Étoile < Yoshi < Mario < Luigi

**Les combinaisons** et leur multiplicateur :

| Combinaison | Gain |
| --- | --- |
| Carte haute | × 1 |
| Une paire | × 1 |
| Deux paires | × 2 |
| Brelan | × 3 |
| Full House | × 5 |
| Carré | × 10 |
| Cinq d'un coup | × 20 |

À combinaison égale, la figure la plus forte l'emporte : une paire de Luigi bat une paire de Mario.

**Une manche** — mise de 1 à 5 jetons, prélevée à la distribution. Chacun reçoit 5 cartes, seules les tiennes sont révélées. Tu jettes de 0 à 5 cartes, Luigi fait de même, puis les mains sont comparées.

- Victoire : mise remboursée **+** mise × multiplicateur de ta combinaison
- Égalité : mise rendue
- Défaite : mise perdue

**L'IA** — Luigi ne casse jamais un full, un carré ou un cinq. Sinon il garde son ou ses groupes, conserve souvent un kicker Mario ou Luigi quand il n'a qu'une paire, et en carte haute garde sa figure la plus forte. Une part de hasard l'empêche d'être lisible.

---

## 4. Modifier le jeu

**Changer l'équilibrage** → `src/game/config.js`

```js
export const STARTING_CHIPS = 10;  // solde de départ
export const MAX_BET = 5;          // mise maximale
export const COPIES_PER_SYMBOL = 5; // 6 × 5 = 30 cartes
```

**Changer les gains** → le tableau `HANDS` dans `src/game/hands.js`. L'index dans ce tableau est la catégorie renvoyée par `evaluate()`, ne réordonne pas les lignes.

**Changer les figures** → `src/game/symbols.js`. Pour remplacer un emoji par un vrai visuel, ajoute un champ `svg` à la figure et gère-le dans `Glyph.jsx` ; le reste du code n'utilise que `id`, `name` et `rank`.

**Accélérer ou ralentir les animations** → l'objet `TIMING` dans `src/game/config.js`. `dealStep` et `cardFlight` règlent à la fois les vols 3D et l'apparition des cartes en bas : les deux écrans restent synchronisés. Les durées CSS sont dans `index.css` (`.lpp-flipper` pour le retournement).

**Recadrer la scène** → `src/scene/config.js` : position de la caméra, hauteur de la table, emplacement du paquet, inclinaison des cartes de Luigi (`LUIGI_CARD_TILT`).

**Rendre Luigi plus dur** → `src/game/ai.js`. La fonction accepte un second argument `random`, ce qui permet de la tester de façon déterministe :

```js
luigiStrategy(hand, () => 0)    // il garde toujours son kicker
luigiStrategy(hand, () => 0.99) // il ne le garde jamais
```

---

## 5. L'écran du haut en 3D

**Le moteur** : [three.js](https://threejs.org) piloté en JSX par `@react-three/fiber`. Toute la scène vit dans `src/scene/`. Elle est chargée **après** l'écran du bas (import différé) : sur un téléphone lent, on peut déjà miser pendant que Luigi arrive.

**Ce que la scène reçoit** — une seule prop dit ce que fait Luigi :

| `action` | quand | Luigi provisoire |
| --- | --- | --- |
| `idle` | mise, égalité | respire, regarde autour |
| `deal` | distribution, échange du joueur | lance les cartes du bras droit |
| `think` | tour de Luigi | main au menton, tête penchée |
| `win` | Luigi gagne, fin de partie | saute, bras en l'air |
| `lose` | le joueur gagne | tête basse, bras ballants |

La correspondance phase → action est dans `luigiActionFor()`, en bas de `LuigiPicturePoker.jsx`.

**Les cartes** — chaque carte de Luigi part du paquet et vole jusqu'à sa place ; chaque carte du joueur part du paquet vers le bas de l'écran du haut, puis apparaît dans l'écran du bas. Les textures sont dessinées au canvas à partir de `symbols.js` : changer une figure change aussi sa carte 3D.

**Sans WebGL** (vieux téléphone, contexte GPU perdu) — `TopScreen.jsx` bascule automatiquement sur une version 2D : médaillon de Luigi et cartes HTML. Le jeu reste jouable.

### Remplacer le Luigi provisoire par un vrai modèle

1. Modélise ou récupère un Luigi **que tu as le droit d'utiliser** (les modèles extraits des jeux Nintendo sont protégés : pour une appli publiée sur les stores, il faut un modèle original).
2. Dans Blender, crée les clips d'animation `Idle`, `Deal`, `Think`, `Cheer`, `Sad` (ou d'autres noms, voir l'étape 4), puis exporte en **glTF binaire (.glb)**, Luigi tourné vers **+Z** (vers la caméra), pieds à y = 0.
3. Dépose le fichier dans `public/models/luigi.glb`.
4. Dans `src/scene/config.js` :

```js
export const LUIGI_MODEL_URL = "./models/luigi.glb";
export const LUIGI_CLIPS = { idle: "Idle", deal: "Deal", think: "Think", win: "Cheer", lose: "Sad" };
export const LUIGI_MODEL_TRANSFORM = { position: [0, 0, -1.05], rotation: [0, 0, 0], scale: 1 };
```

Ajuste `scale` et `position` pour que sa taille corresponde à la table (plateau à y = 0,72). Tant que le modèle charge, le Luigi provisoire reste affiché. Vise un modèle léger (moins de 2–3 Mo, textures 1024 px) : il est téléchargé dans l'appli.

---

## 6. Sur iPhone et Android

Deux façons de faire, qui partent du même build.

### A. Appli installée depuis le navigateur (PWA), sans store

Mets le site en ligne (section 7), ouvre-le sur le téléphone puis :

- **iPhone (Safari)** : Partager → « Sur l'écran d'accueil ».
- **Android (Chrome)** : menu ⋮ → « Installer l'application ».

Le jeu s'ouvre alors en plein écran, en portrait, avec son icône.

### B. Vraies applis natives avec Capacitor

Les projets `android/` et `ios/` sont déjà générés. Après chaque modification du code web :

```bash
npm run sync          # rebuild + copie dans android/ et ios/
```

**Android** — installe [Android Studio](https://developer.android.com/studio), puis :

```bash
npm run android       # ouvre le projet dans Android Studio
```

Branche ton téléphone (débogage USB activé) et clique sur ▶. Pour un APK/AAB à distribuer : *Build → Generate Signed App Bundle / APK*.

**iPhone** — il faut un **Mac** avec Xcode (le projet iOS ne peut pas être compilé sous Linux ou Windows) :

```bash
npm run ios           # ouvre le projet dans Xcode
```

Choisis ton équipe de signature dans *Signing & Capabilities*, branche l'iPhone et clique sur ▶. Un compte Apple gratuit suffit pour installer sur ton propre téléphone ; la publication sur l'App Store demande le programme développeur payant.

**Réglages déjà faits** : portrait verrouillé (manifeste Android, `Info.plist` iPhone, et `src/native.js`), texte clair dans les barres système, gestion des encoches via `env(safe-area-inset-*)`, icônes et écrans de démarrage générés depuis `assets/icon.png`. L'identifiant d'appli est `com.luigipicturepoker.app` dans `capacitor.config.json` : change-le **avant** la première publication, il ne peut plus bouger ensuite.

---

## 7. Notes techniques

**Le retournement des cartes** repose sur `transform-style: preserve-3d` et `backface-visibility: hidden` (classes `.lpp-scene`, `.lpp-flipper`, `.lpp-face` dans `index.css`). Les deux faces sont superposées, le verso pré-tourné de 180°, et seul le conteneur pivote.

**Les timers** sont tous enregistrés dans une ref et purgés au démontage ainsi qu'au début de chaque manche. Sans ça, cliquer vite sur « Manche suivante » laisserait des animations de la manche précédente se déclencher par-dessus la nouvelle.

**Le mode strict de React** monte les composants deux fois en développement. C'est pour cette raison que les tirages de cartes sont faits *avant* les appels à `setState`, jamais à l'intérieur d'une fonction de mise à jour : sinon la pioche avancerait deux fois par échange.

**Les deux écrans** occupent chacun la moitié de la hauteur réelle (`100dvh`, barres du navigateur déduites). La caméra 3D recule automatiquement quand l'écran du haut est étroit, pour garder les cinq cartes de Luigi dans le cadre. La mise en page est vérifiée jusqu'à l'iPhone SE (375 × 667).

**Sur mobile** : `touch-manipulation` supprime le délai de 300 ms au tap, `maximum-scale=1` dans `index.html` bloque le zoom au double-tap, les zones cliquables font 44 px minimum, et `@media (prefers-reduced-motion: reduce)` coupe les animations pour qui les a désactivées.

---

## 8. Mettre en ligne

Le build est un site statique, aucun serveur nécessaire.

```bash
npm run build     # produit dist/
```

Dépose `dist/` sur Netlify, Vercel, Cloudflare Pages ou GitHub Pages. Les chemins sont relatifs (`base: "./"` dans `vite.config.js`), le build fonctionne donc aussi dans un sous-dossier, comme sur GitHub Pages, sans réglage.

---

## 9. Si tu préfères une autre stack

**Next.js** — copie `src/game/`, `src/hooks/`, `src/scene/`, `src/components/` et `LuigiPicturePoker.jsx` tels quels, ajoute `"use client";` en première ligne du composant principal, et reporte les `@keyframes` de `index.css` dans ton CSS global.

**Tailwind v3** au lieu de v4 — retire `@tailwindcss/vite` du `vite.config.js`, installe `tailwindcss@3 postcss autoprefixer`, crée un `tailwind.config.js` avec `content: ["./index.html", "./src/**/*.{js,jsx}"]`, et remplace le `@import "tailwindcss";` de `index.css` par les trois directives `@tailwind base; @tailwind components; @tailwind utilities;`. Le bloc `@theme` disparaît : déclare la police dans `theme.extend.fontFamily`.
