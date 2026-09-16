import {
  describe,
  expect,
  test,
} from 'vitest';

import {
  ScoringEngine,
} from '../../src/core/scoring/ScoringEngine.js';

describe(
  'ScoringEngine',
  () => {
    const scoringEngine =
      new ScoringEngine();

    test(
      'erkennt einzelne 1en mit 100 Punkten',
      () => {
        const options =
          scoringEngine
            .getScoringOptions(
              [1, 2, 3, 4, 6, 2],
            );

        const singleOne =
          options.find(
            (option) =>
              option.type ===
                'single' &&
              option.diceValues[0] ===
                1,
          );

        expect(singleOne)
          .toBeDefined();

        expect(singleOne.score)
          .toBe(100);
      },
    );

    test(
      'erkennt einzelne 5en mit 50 Punkten',
      () => {
        const options =
          scoringEngine
            .getScoringOptions(
              [2, 3, 5, 4, 6, 2],
            );

        const singleFive =
          options.find(
            (option) =>
              option.type ===
                'single' &&
              option.diceValues[0] ===
                5,
          );

        expect(singleFive)
          .toBeDefined();

        expect(singleFive.score)
          .toBe(50);
      },
    );

    test(
      'erkennt die Zwei-5er-Sonderregel',
      () => {
        const options =
          scoringEngine
            .getScoringOptions(
              [2, 3, 4, 5, 5, 6],
            );

        const pairOfFives =
          options.find(
            (option) =>
              option.type ===
              'pair-of-fives',
          );

        expect(pairOfFives)
          .toBeDefined();

        expect(pairOfFives.score)
          .toBe(100);

        expect(
          pairOfFives.diceIndices,
        ).toHaveLength(2);

        expect(
          pairOfFives.removeCount,
        ).toBe(1);
      },
    );

    test(
      'erkennt drei 3en als 300 Punkte',
      () => {
        const options =
          scoringEngine
            .getScoringOptions(
              [3, 3, 3, 2, 4, 6],
            );

        const triple =
          options.find(
            (option) =>
              option.type ===
                'kind' &&
              option.diceValues[0] ===
                3 &&
              option.diceIndices.length ===
                3,
          );

        expect(triple.score)
          .toBe(300);
      },
    );

    test(
      'erkennt vier 3en als 450 Punkte',
      () => {
        const options =
          scoringEngine
            .getScoringOptions(
              [3, 3, 3, 3, 2, 6],
            );

        const fourOfKind =
          options.find(
            (option) =>
              option.type ===
                'kind' &&
              option.diceValues[0] ===
                3 &&
              option.diceIndices.length ===
                4,
          );

        expect(fourOfKind.score)
          .toBe(450);
      },
    );

    test(
      'erkennt fünf 3en als 750 Punkte',
      () => {
        const options =
          scoringEngine
            .getScoringOptions(
              [3, 3, 3, 3, 3, 6],
            );

        const fiveOfKind =
          options.find(
            (option) =>
              option.type ===
                'kind' &&
              option.diceIndices.length ===
                5,
          );

        expect(fiveOfKind.score)
          .toBe(750);
      },
    );

    test(
      'erkennt sechs 3en als 1200 Punkte',
      () => {
        const options =
          scoringEngine
            .getScoringOptions(
              [3, 3, 3, 3, 3, 3],
            );

        const sixOfKind =
          options.find(
            (option) =>
              option.type ===
                'kind' &&
              option.diceIndices.length ===
                6,
          );

        expect(sixOfKind.score)
          .toBe(1200);
      },
    );

    test(
      'verwendet die Spezialwerte für 1er-Pasche',
      () => {
        const cases = [
          {
            dice:
              [1, 1, 1, 2, 3, 4],
            count: 3,
            score: 1000,
          },
          {
            dice:
              [1, 1, 1, 1, 3, 4],
            count: 4,
            score: 1500,
          },
          {
            dice:
              [1, 1, 1, 1, 1, 4],
            count: 5,
            score: 2500,
          },
        ];

        for (
          const currentCase
          of cases
        ) {
          const options =
            scoringEngine
              .getScoringOptions(
                currentCase.dice,
              );

          const option =
            options.find(
              (candidate) =>
                candidate.type ===
                  'kind' &&
                candidate.diceIndices
                  .length ===
                  currentCase.count,
            );

          expect(option.score)
            .toBe(
              currentCase.score,
            );
        }
      },
    );

    test(
      'erkennt kleine Straße 1-2-3-4-5',
      () => {
        const options =
          scoringEngine
            .getScoringOptions(
              [1, 2, 3, 4, 5, 5],
            );

        expect(
          options.some(
            (option) =>
              option.type ===
                'small-straight' &&
              option.score ===
                500,
          ),
        ).toBe(true);
      },
    );

    test(
      'erkennt kleine Straße 2-3-4-5-6',
      () => {
        const options =
          scoringEngine
            .getScoringOptions(
              [2, 3, 4, 5, 6, 6],
            );

        expect(
          options.some(
            (option) =>
              option.type ===
                'small-straight' &&
              option.score ===
                500,
          ),
        ).toBe(true);
      },
    );

    test(
      'erkennt große Straße mit 2000 Punkten',
      () => {
        const options =
          scoringEngine
            .getScoringOptions(
              [1, 2, 3, 4, 5, 6],
            );

        const largeStraight =
          options.find(
            (option) =>
              option.type ===
              'large-straight',
          );

        expect(largeStraight.score)
          .toBe(2000);
      },
    );

    test(
      'sechs 1en liefern ausschließlich den Sofortsieg',
      () => {
        const options =
          scoringEngine
            .getScoringOptions(
              [1, 1, 1, 1, 1, 1],
            );

        expect(options)
          .toHaveLength(1);

        expect(options[0].score)
          .toBe(10000);

        expect(
          options[0].isInstantWin,
        ).toBe(true);
      },
    );

    test(
      'ein 0er-Wurf besitzt keine ScoringOption',
      () => {
        const options =
          scoringEngine
            .getScoringOptions(
              [2, 3, 4, 6, 2, 3],
            );

        expect(options)
          .toEqual([]);
      },
    );
  },
);