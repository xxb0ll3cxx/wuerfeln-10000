/*
 * =========================================================
 * COIN REWARD CALCULATION
 * =========================================================
 *
 * Grundlage:
 * Punkte einer einzelnen erfolgreichen Sicherung.
 *
 * Diese Funktion verändert weder GameStore
 * noch AccountStore oder Supabase.
 */

export function calculateCoinReward(
  bankedScore,
) {
  if (
    !Number.isSafeInteger(bankedScore) ||
    bankedScore < 0
  ) {
    throw new RangeError(
      'Die gesicherten Punkte müssen eine nicht negative Ganzzahl sein.',
    );
  }

  /*
   * Bis einschließlich 1.000 Punkten:
   * keine Coins.
   */

  if (
    bankedScore <= 1000
  ) {
    return 0;
  }

  /*
   * Grundbelohnung:
   * 1 Coin pro 10 gesicherte Punkte.
   */

  const baseCoins =
    Math.floor(
      bankedScore / 10,
    );

  /*
   * Unter 2.000 Punkten:
   * kein zusätzlicher Multiplikator.
   */

  if (
    bankedScore < 2000
  ) {
    return baseCoins;
  }

  /*
   * Ab einschließlich 2.000 Punkten:
   * Multiplikator = Floor(Punkte / 1000).
   */

  const multiplier =
    Math.floor(
      bankedScore / 1000,
    );

  return (
    baseCoins *
    multiplier
  );
}