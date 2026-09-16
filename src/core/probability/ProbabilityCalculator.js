import {
  createProbabilityPredicate,
} from './probabilityRules.js';

export class ProbabilityCalculator {
  #cache =
    new Map();

  constructor(
    scoringEngine,
  ) {
    if (
      !scoringEngine ||
      typeof scoringEngine
        .getScoringOptions !==
        'function'
    ) {
      throw new TypeError(
        'ProbabilityCalculator benötigt eine ScoringEngine.',
      );
    }

    this.scoringEngine =
      scoringEngine;
  }

  calculate({
    diceCount,
    scenario,
    face = null,
    kindCount = null,
  }) {
    this.#validateDiceCount(
      diceCount,
    );

    const cacheKey =
      JSON.stringify({
        diceCount,
        scenario,
        face,
        kindCount,
      });

    const cachedResult =
      this.#cache.get(
        cacheKey,
      );

    if (cachedResult) {
      return cachedResult;
    }

    const predicate =
      createProbabilityPredicate({
        scenario,
        face,
        kindCount,

        scoringEngine:
          this.scoringEngine,
      });

    const totalOutcomes =
      6 ** diceCount;

    let favorableOutcomes =
      0;

    const roll =
      new Array(
        diceCount,
      );

    const enumerate =
      (index) => {
        if (
          index === diceCount
        ) {
          if (
            predicate(
              roll,
            )
          ) {
            favorableOutcomes +=
              1;
          }

          return;
        }

        for (
          let value = 1;
          value <= 6;
          value += 1
        ) {
          roll[index] =
            value;

          enumerate(
            index + 1,
          );
        }
      };

    enumerate(0);

    const probability =
      favorableOutcomes /
      totalOutcomes;

    const result =
      Object.freeze({
        diceCount,

        scenario,

        favorableOutcomes,

        totalOutcomes,

        probability,

        percentage:
          probability * 100,
      });

    this.#cache.set(
      cacheKey,
      result,
    );

    return result;
  }

  #validateDiceCount(
    diceCount,
  ) {
    if (
      !Number.isInteger(
        diceCount,
      ) ||
      diceCount < 1 ||
      diceCount > 6
    ) {
      throw new RangeError(
        'Die Würfelanzahl muss zwischen 1 und 6 liegen.',
      );
    }
  }
}