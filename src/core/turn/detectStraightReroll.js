const STRAIGHT_PATTERNS = Object.freeze([
  {
    type: 'small-straight',
    label: 'Kleine Straße 1-2-3-4-5',
    values: [1, 2, 3, 4, 5],
  },
  {
    type: 'small-straight',
    label: 'Kleine Straße 2-3-4-5-6',
    values: [2, 3, 4, 5, 6],
  },
  {
    type: 'large-straight',
    label: 'Große Straße 1-2-3-4-5-6',
    values: [1, 2, 3, 4, 5, 6],
  },
]);

export function detectStraightReroll({
  diceResults,
  removedDiceValues,
}) {
  validateDiceArray(
    diceResults,
    'diceResults',
  );

  validateDiceArray(
    removedDiceValues,
    'removedDiceValues',
  );

  /*
   * Laut Sonderregel sind ausschließlich bereits
   * herausgelegte 1en und/oder 5en relevant.
   *
   * Für eine Straße wird jede Augenzahl höchstens einmal
   * benötigt. Mehrere herausgelegte 1en oder 5en ändern
   * deshalb die möglichen Straßen nicht.
   */
  const eligibleRemovedValues = [
    ...new Set(
      removedDiceValues.filter(
        (value) =>
          value === 1 ||
          value === 5,
      ),
    ),
  ];

  if (
    eligibleRemovedValues.length === 0
  ) {
    return {
      isAvailable: false,
      matches: [],
    };
  }

  const currentValues =
    new Set(diceResults);

  const removedValueSubsets =
    createNonEmptySubsets(
      eligibleRemovedValues,
    );

  const matches = [];

  for (
    const pattern
    of STRAIGHT_PATTERNS
  ) {
    for (
      const usedRemovedValues
      of removedValueSubsets
    ) {
      const removedValuesFitPattern =
        usedRemovedValues.every(
          (value) =>
            pattern.values.includes(
              value,
            ),
        );

      if (!removedValuesFitPattern) {
        continue;
      }

      const valuesNeededFromCurrentRoll =
        pattern.values.filter(
          (value) =>
            !usedRemovedValues.includes(
              value,
            ),
        );

      const currentRollCompletesStraight =
        valuesNeededFromCurrentRoll.every(
          (value) =>
            currentValues.has(value),
        );

      if (
        !currentRollCompletesStraight
      ) {
        continue;
      }

      matches.push({
        type:
          pattern.type,

        label:
          pattern.label,

        straightValues: [
          ...pattern.values,
        ],

        usedRemovedValues: [
          ...usedRemovedValues,
        ],
      });
    }
  }

  return {
    isAvailable:
      matches.length > 0,

    matches:
      deduplicateMatches(
        matches,
      ),
  };
}

function createNonEmptySubsets(
  values,
) {
  const subsets = [];

  const count =
    2 ** values.length;

  for (
    let mask = 1;
    mask < count;
    mask += 1
  ) {
    const subset = [];

    for (
      let index = 0;
      index < values.length;
      index += 1
    ) {
      if (
        mask &
        (1 << index)
      ) {
        subset.push(
          values[index],
        );
      }
    }

    subsets.push(subset);
  }

  return subsets;
}

function deduplicateMatches(
  matches,
) {
  const unique =
    new Map();

  for (const match of matches) {
    const key = [
      match.type,
      match.straightValues.join(','),
      [...match.usedRemovedValues]
        .sort((a, b) => a - b)
        .join(','),
    ].join('|');

    if (!unique.has(key)) {
      unique.set(
        key,
        match,
      );
    }
  }

  return [
    ...unique.values(),
  ];
}

function validateDiceArray(
  values,
  name,
) {
  if (!Array.isArray(values)) {
    throw new TypeError(
      `${name} muss ein Array sein.`,
    );
  }

  for (const value of values) {
    if (
      !Number.isInteger(value) ||
      value < 1 ||
      value > 6
    ) {
      throw new RangeError(
        `Ungültiger Würfelwert in ${name}: ${value}`,
      );
    }
  }
}