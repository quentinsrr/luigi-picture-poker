import { useEffect, useRef } from "react";

/**
 * Ordre d'arrivée des cartes d'une main, pour échelonner leurs animations.
 *
 * Compare les identifiants de cartes à ceux du rendu précédent :
 *   - une carte déjà là       → -1
 *   - une carte nouvelle      → son rang parmi les nouvelles (0, 1, 2…)
 * `fullDeal` vaut true quand les cinq sont neuves (distribution complète).
 *
 * Le résultat n'est lu qu'au montage d'une carte (délai d'animation),
 * il peut donc être recalculé à chaque rendu sans effet visible.
 */
export function useArrivalOrder(uids, active) {
  const prev = useRef([]);
  const fresh = active ? uids.filter((u) => !prev.current.includes(u)) : [];

  useEffect(() => {
    if (active) prev.current = uids;
  }, [uids, active]);

  return {
    order: uids.map((u) => fresh.indexOf(u)),
    fullDeal: fresh.length === uids.length,
  };
}
