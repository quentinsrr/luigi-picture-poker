import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";

/**
 * Réglages propres aux applis iOS / Android (Capacitor).
 * Sans effet dans un navigateur : le jeu reste une simple page web.
 */
export async function setupNative() {
  if (!Capacitor.isNativePlatform()) return;

  // Texte clair dans les barres système, sur le fond vert sombre.
  SystemBars.setStyle({ style: SystemBarsStyle.Dark }).catch(() => {});

  // Deux écrans empilés façon DS : le jeu se joue en portrait.
  const { ScreenOrientation } = await import("@capacitor/screen-orientation");
  ScreenOrientation.lock({ orientation: "portrait" }).catch(() => {});
}
