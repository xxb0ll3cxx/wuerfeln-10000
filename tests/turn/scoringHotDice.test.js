import {
  describe,
  expect,
  test,
} from 'vitest';

import {
  ScoringEngine,
} from '../../src/core/scoring/ScoringEngine.js';

import {
  validateScoringSelection,
} from '../../src/core/scoring/validateScoringSelection.js';

import {
  detectHotDice,
} from '../../src/core/turn/detectHotDice.js';

describe(
  'Scoring + Hot Dice',
  () => {
    const scoringEngine =
      new ScoringEngine();

    test(
      '1-2-3-4-5 plus zusätzliche 5 verwertet alle sechs Würfel',
      () => {
        const dice = [
          1,
          2,
          3,
          4,
          5,
          5,
        ];

        const scoringOptions =
          scoringEngine
            .getScoringOptions(
              dice,
            );

        const validation =
          validateScoringSelection({
            dice,

            selectedDiceIndices: [
              0,
              1,
              2,
              3,
              4,
              5,
            ],

            scoringOptions,
          });

        const interpretation =
          validation.interpretations
            .find(
              (candidate) =>
                candidate.score ===
                550 &&
                candidate
                  .removedDiceIndices
                  .length === 6,
            );

        expect(
          interpretation,
        ).toBeDefined();

        expect(
          detectHotDice(
            dice.length,
            interpretation
              .removedDiceIndices,
          ),
        ).toBe(true);
      },
    );

    test(
      '2-3-4-5-6 plus zusätzliche 5 verwertet ebenfalls alle sechs Würfel',
      () => {
        const dice = [
          2,
          3,
          4,
          5,
          5,
          6,
        ];

        const scoringOptions =
          scoringEngine
            .getScoringOptions(
              dice,
            );

        const validation =
          validateScoringSelection({
            dice,

            selectedDiceIndices: [
              0,
              1,
              2,
              3,
              4,
              5,
            ],

            scoringOptions,
          });

        const interpretation =
          validation.interpretations
            .find(
              (candidate) =>
                candidate.score ===
                  550 &&
                candidate
                  .removedDiceIndices
                  .length === 6,
            );

        expect(
          interpretation,
        ).toBeDefined();

        expect(
          detectHotDice(
            dice.length,
            interpretation
              .removedDiceIndices,
          ),
        ).toBe(true);
      },
    );
  },
);