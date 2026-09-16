export function detectHotDice(
  activeDiceCount,
  removedDiceIndices,
) {
  if (
    !Number.isInteger(
      activeDiceCount,
    ) ||
    activeDiceCount <= 0
  ) {
    throw new RangeError(
      'activeDiceCount muss eine positive Ganzzahl sein.',
    );
  }

  if (
    !Array.isArray(
      removedDiceIndices,
    )
  ) {
    throw new TypeError(
      'removedDiceIndices muss ein Array sein.',
    );
  }

  const uniqueRemovedIndices =
    new Set(
      removedDiceIndices,
    );

  return (
    uniqueRemovedIndices.size ===
    activeDiceCount
  );
}