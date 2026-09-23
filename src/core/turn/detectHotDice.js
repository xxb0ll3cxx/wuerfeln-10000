export function detectHotDice(
  activeDiceCount,
  removedDiceIndices,
  scoringOptions = [],
) {
  if (
    !Number.isInteger(activeDiceCount) ||
    activeDiceCount <= 0
  ) {
    throw new RangeError(
      'activeDiceCount muss eine positive Ganzzahl sein.',
    );
  }

  if (!Array.isArray(removedDiceIndices)) {
    throw new TypeError(
      'removedDiceIndices muss ein Array sein.',
    );
  }

  const uniqueRemovedIndices =
    new Set(removedDiceIndices);

  // Bisherige Regel:
  // Alle aktuell aktiven Würfel wurden herausgelegt.
  const allDiceRemoved =
    uniqueRemovedIndices.size ===
    activeDiceCount;

  // Neue Sonderregel:
  // Bei sechs aktiven Würfeln genügt die Auswahl
  // der fünf Würfel einer kleinen Straße für HOT DICE.
  const smallStraightHotDice =
    activeDiceCount === 6 &&
    uniqueRemovedIndices.size === 5 &&
    scoringOptions.length === 1 &&
    scoringOptions[0].type ===
      'small-straight';

  return (
    allDiceRemoved ||
    smallStraightHotDice
  );
}