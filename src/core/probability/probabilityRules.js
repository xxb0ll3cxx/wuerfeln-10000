import {
  SCORING_TYPES,
} from '../scoring/ScoringEngine.js';

export const PROBABILITY_SCENARIOS =
  Object.freeze({
    ANY_SCORE:
      'any-score',

    ANY_KIND:
      'any-kind',

    SPECIFIC_KIND:
      'specific-kind',

    SMALL_STRAIGHT:
      'small-straight',

    LARGE_STRAIGHT:
      'large-straight',
  });

export function createProbabilityPredicate({
  scenario,
  face,
  kindCount,
  scoringEngine,
}) {
  switch (scenario) {
    case PROBABILITY_SCENARIOS.ANY_SCORE:
      return (roll) =>
        scoringEngine
          .getScoringOptions(
            roll,
          )
          .length > 0;

    case PROBABILITY_SCENARIOS.ANY_KIND:
      validateKindCount(
        kindCount,
      );

      return (roll) =>
        hasAnyKind(
          roll,
          kindCount,
        );

    case PROBABILITY_SCENARIOS.SPECIFIC_KIND:
      validateKindCount(
        kindCount,
      );

      validateFace(
        face,
      );

      return (roll) =>
        countValue(
          roll,
          face,
        ) >= kindCount;

    case PROBABILITY_SCENARIOS.SMALL_STRAIGHT:
      return (roll) =>
        hasScoringType(
          scoringEngine,
          roll,
          SCORING_TYPES.SMALL_STRAIGHT,
        );

    case PROBABILITY_SCENARIOS.LARGE_STRAIGHT:
      return (roll) =>
        hasScoringType(
          scoringEngine,
          roll,
          SCORING_TYPES.LARGE_STRAIGHT,
        );

    default:
      throw new Error(
        `Unbekanntes Wahrscheinlichkeitsszenario: ${scenario}`,
      );
  }
}

function hasAnyKind(
  roll,
  kindCount,
) {
  const counts =
    new Map();

  for (const value of roll) {
    const nextCount =
      (
        counts.get(value) ??
        0
      ) + 1;

    if (
      nextCount >=
      kindCount
    ) {
      return true;
    }

    counts.set(
      value,
      nextCount,
    );
  }

  return false;
}

function countValue(
  roll,
  targetValue,
) {
  return roll.reduce(
    (
      count,
      value,
    ) =>
      value === targetValue
        ? count + 1
        : count,
    0,
  );
}

function hasScoringType(
  scoringEngine,
  roll,
  scoringType,
) {
  return scoringEngine
    .getScoringOptions(
      roll,
    )
    .some(
      (option) =>
        option.type ===
        scoringType,
    );
}

function validateKindCount(
  kindCount,
) {
  if (
    !Number.isInteger(
      kindCount,
    ) ||
    kindCount < 2 ||
    kindCount > 6
  ) {
    throw new RangeError(
      'Die Anzahl gleicher Würfel muss zwischen 2 und 6 liegen.',
    );
  }
}

function validateFace(
  face,
) {
  if (
    !Number.isInteger(face) ||
    face < 1 ||
    face > 6
  ) {
    throw new RangeError(
      'Die Augenzahl muss zwischen 1 und 6 liegen.',
    );
  }
}