export function validateScoringSelection({
  dice,
  selectedDiceIndices,
  scoringOptions,
}) {
  validateInput({
    dice,
    selectedDiceIndices,
    scoringOptions,
  });

  const selectedIndices = [
    ...selectedDiceIndices,
  ].sort((a, b) => a - b);

  if (selectedIndices.length === 0) {
    return {
      isValid: false,
      reason: 'no-selection',
      selectedDiceIndices: [],
      interpretations: [],
    };
  }

  const selectedSet =
    new Set(selectedIndices);

  // Nur Wertungen betrachten, deren Würfel vollständig
  // innerhalb der aktuellen Spielerauswahl liegen.
  const candidateOptions =
    scoringOptions.filter(
      (option) =>
        option.diceIndices.length > 0 &&
        option.diceIndices.every(
          (index) =>
            selectedSet.has(index),
        ),
    );

  const interpretations = [];

  findExactScoringCovers({
    selectedIndices,
    candidateOptions,
    onMatch: (chosenOptions) => {
      interpretations.push(
        createInterpretation(
          dice,
          selectedIndices,
          chosenOptions,
        ),
      );
    },
  });

const uniqueInterpretations =
  deduplicateInterpretations(
    interpretations,
  );

const bestInterpretations =
  keepHighestScoringInterpretations(
    uniqueInterpretations,
  );

return {
  isValid:
    bestInterpretations.length > 0,

  reason:
    bestInterpretations.length > 0
      ? null
      : 'selection-not-scorable',

  selectedDiceIndices:
    selectedIndices,

  interpretations:
    bestInterpretations,
  };
}

function findExactScoringCovers({
  selectedIndices,
  candidateOptions,
  onMatch,
}) {
  const coveredIndices = new Set();

  const search = (
    chosenOptions,
  ) => {
    if (
      coveredIndices.size ===
      selectedIndices.length
    ) {
      onMatch([
        ...chosenOptions,
      ]);

      return;
    }

    const nextUncoveredIndex =
      selectedIndices.find(
        (index) =>
          !coveredIndices.has(index),
      );

    for (
      const option
      of candidateOptions
    ) {
      if (
        !option.diceIndices.includes(
          nextUncoveredIndex,
        )
      ) {
        continue;
      }

      const overlaps =
        option.diceIndices.some(
          (index) =>
            coveredIndices.has(index),
        );

      if (overlaps) {
        continue;
      }

      for (
        const index
        of option.diceIndices
      ) {
        coveredIndices.add(index);
      }

      chosenOptions.push(option);

      search(chosenOptions);

      chosenOptions.pop();

      for (
        const index
        of option.diceIndices
      ) {
        coveredIndices.delete(index);
      }
    }
  };

  search([]);
}

function createInterpretation(
  dice,
  selectedDiceIndices,
  scoringOptions,
) {
  const orderedOptions = [
    ...scoringOptions,
  ].sort(compareScoringOptions);

  const score =
    orderedOptions.reduce(
      (total, option) =>
        total + option.score,
      0,
    );

  const removedDiceIndices =
    getUniqueSortedIndices(
      orderedOptions.flatMap(
        getRemovedDiceIndices,
      ),
    );

  const remainingDiceIndices =
    dice
      .map((_, index) => index)
      .filter(
        (index) =>
          !removedDiceIndices.includes(
            index,
          ),
      );

  return {
    id:
      createInterpretationId(
        orderedOptions,
        removedDiceIndices,
      ),

    label:
      orderedOptions
        .map(
          (option) =>
            option.label,
        )
        .join(' + '),

    score,

    scoringOptions:
      orderedOptions,

    scoredDiceIndices: [
      ...selectedDiceIndices,
    ],

    removedDiceIndices,

    remainingDiceIndices,

    isInstantWin:
      orderedOptions.some(
        (option) =>
          option.isInstantWin,
      ),
  };
}

function getRemovedDiceIndices(
  option,
) {
  const diceIndices = [
    ...option.diceIndices,
  ].sort((a, b) => a - b);

  const removeCount =
    option.removeCount ??
    diceIndices.length;

  if (
    !Number.isInteger(removeCount) ||
    removeCount < 0 ||
    removeCount >
      diceIndices.length
  ) {
    throw new RangeError(
      `Ungültiger removeCount für ` +
      `${option.id}: ${removeCount}`,
    );
  }

  /*
   * Normalerweise werden alle zur Wertung gehörenden Würfel
   * entfernt.
   *
   * Die Zwei-5er-Sonderregel besitzt dagegen zwei beteiligte
   * Würfel bei removeCount = 1.
   *
   * Welche der identischen 5en liegen bleibt, ist fachlich
   * gleichwertig. Wir wählen deshalb deterministisch den
   * niedrigsten Index zum Herauslegen.
   */
  return diceIndices.slice(
    0,
    removeCount,
  );
}

function deduplicateInterpretations(
  interpretations,
) {
  const unique =
    new Map();

  for (
    const interpretation
    of interpretations
  ) {
    const optionTypes =
      interpretation.scoringOptions
        .map(
          (option) =>
            option.type,
        )
        .sort()
        .join(',');

    const key = [
      interpretation.score,
      interpretation
        .removedDiceIndices
        .join(','),
      optionTypes,
      interpretation.isInstantWin,
    ].join('|');

    if (!unique.has(key)) {
      unique.set(
        key,
        interpretation,
      );
    }
  }

  return [
    ...unique.values(),
  ];
}

function createInterpretationId(
  scoringOptions,
  removedDiceIndices,
) {
  const optionIds =
    scoringOptions
      .map(
        (option) =>
          option.id,
      )
      .sort()
      .join('+');

  return (
    `${optionIds}` +
    `|remove:` +
    removedDiceIndices.join(',')
  );
}

function compareScoringOptions(
  first,
  second,
) {
  const firstIndex =
    Math.min(
      ...first.diceIndices,
    );

  const secondIndex =
    Math.min(
      ...second.diceIndices,
    );

  return (
    firstIndex -
      secondIndex ||
    first.id.localeCompare(
      second.id,
    )
  );
}

function getUniqueSortedIndices(
  indices,
) {
  return [
    ...new Set(indices),
  ].sort((a, b) => a - b);
}

function validateInput({
  dice,
  selectedDiceIndices,
  scoringOptions,
}) {
  if (!Array.isArray(dice)) {
    throw new TypeError(
      'dice muss ein Array sein.',
    );
  }

  if (
    !Array.isArray(
      selectedDiceIndices,
    )
  ) {
    throw new TypeError(
      'selectedDiceIndices muss ein Array sein.',
    );
  }

  if (
    !Array.isArray(
      scoringOptions,
    )
  ) {
    throw new TypeError(
      'scoringOptions muss ein Array sein.',
    );
  }

  const uniqueIndices =
    new Set(
      selectedDiceIndices,
    );

  if (
    uniqueIndices.size !==
    selectedDiceIndices.length
  ) {
    throw new Error(
      'selectedDiceIndices enthält doppelte Indizes.',
    );
  }

  for (
    const index
    of selectedDiceIndices
  ) {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= dice.length
    ) {
      throw new RangeError(
        `Ungültiger Würfelindex: ${index}`,
      );
    }
  }
}

function keepHighestScoringInterpretations(
  interpretations,
) {
  if (interpretations.length <= 1) {
    return interpretations;
  }

  const highestScore =
    Math.max(
      ...interpretations.map(
        (interpretation) =>
          interpretation.score,
      ),
    );

  return interpretations.filter(
    (interpretation) =>
      interpretation.score ===
      highestScore,
  );
}