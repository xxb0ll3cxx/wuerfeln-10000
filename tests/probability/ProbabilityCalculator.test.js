import {
  describe,
  expect,
  test,
} from 'vitest';

import {
  ScoringEngine,
} from '../../src/core/scoring/ScoringEngine.js';

import {
  ProbabilityCalculator,
} from '../../src/core/probability/ProbabilityCalculator.js';

import {
  PROBABILITY_SCENARIOS,
} from '../../src/core/probability/probabilityRules.js';

describe(
  'ProbabilityCalculator',
  () => {
    const calculator =
      new ProbabilityCalculator(
        new ScoringEngine(),
      );

    test(
      'mit einem Würfel sind 1 und 5 direkte Wertungen',
      () => {
        const result =
          calculator.calculate({
            diceCount: 1,

            scenario:
              PROBABILITY_SCENARIOS.ANY_SCORE,
          });

        expect(
          result.totalOutcomes,
        ).toBe(6);

        expect(
          result.favorableOutcomes,
        ).toBe(2);

        expect(
          result.probability,
        ).toBeCloseTo(
          1 / 3,
        );
      },
    );

    test(
      'mit vier Würfeln gibt es 21 Ergebnisse mit mindestens drei bestimmten gleichen Zahlen',
      () => {
        const result =
          calculator.calculate({
            diceCount: 4,

            scenario:
              PROBABILITY_SCENARIOS.SPECIFIC_KIND,

            kindCount: 3,

            face: 5,
          });

        expect(
          result.totalOutcomes,
        ).toBe(1296);

        expect(
          result.favorableOutcomes,
        ).toBe(21);

        expect(
          result.percentage,
        ).toBeCloseTo(
          1.62037037,
        );
      },
    );

    test(
      'mit vier Würfeln gibt es 126 Ergebnisse mit mindestens einem beliebigen Dreierpasch',
      () => {
        const result =
          calculator.calculate({
            diceCount: 4,

            scenario:
              PROBABILITY_SCENARIOS.ANY_KIND,

            kindCount: 3,
          });

        expect(
          result.favorableOutcomes,
        ).toBe(126);

        expect(
          result.percentage,
        ).toBeCloseTo(
          9.72222222,
        );
      },
    );

    test(
      'mit fünf Würfeln gibt es 240 kleine Straßen',
      () => {
        const result =
          calculator.calculate({
            diceCount: 5,

            scenario:
              PROBABILITY_SCENARIOS.SMALL_STRAIGHT,
          });

        expect(
          result.totalOutcomes,
        ).toBe(7776);

        expect(
          result.favorableOutcomes,
        ).toBe(240);

        expect(
          result.percentage,
        ).toBeCloseTo(
          3.08641975,
        );
      },
    );

    test(
      'mit sechs Würfeln gibt es 720 große Straßen',
      () => {
        const result =
          calculator.calculate({
            diceCount: 6,

            scenario:
              PROBABILITY_SCENARIOS.LARGE_STRAIGHT,
          });

        expect(
          result.totalOutcomes,
        ).toBe(46656);

        expect(
          result.favorableOutcomes,
        ).toBe(720);

        expect(
          result.percentage,
        ).toBeCloseTo(
          1.54320988,
        );
      },
    );

    test(
      'unmöglicher Pasch liefert 0 Prozent',
      () => {
        const result =
          calculator.calculate({
            diceCount: 2,

            scenario:
              PROBABILITY_SCENARIOS.ANY_KIND,

            kindCount: 3,
          });

        expect(
          result.favorableOutcomes,
        ).toBe(0);

        expect(
          result.percentage,
        ).toBe(0);
      },
    );
  },
);