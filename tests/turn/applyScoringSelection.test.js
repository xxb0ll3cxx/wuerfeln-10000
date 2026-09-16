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
  applyScoringSelection,
} from '../../src/core/turn/applyScoringSelection.js';

import {
  TURN_PHASES,
} from '../../src/core/turn/TurnRules.js';

function createTurnState(
  diceResults,
  overrides = {},
) {
  return {
    phase:
      TURN_PHASES.SELECTING,

    rollNumber: 1,

    activeDiceCount:
      diceResults.length,

    diceResults,

    scoringOptions: [],

    selectedDiceIndices: [],

    turnScore: 0,

    removedDiceValues: [],

    mustScoreAfterHotDice:
      false,

    isInstantWin:
      false,

    ...overrides,
  };
}

function getInterpretations(
  dice,
  selectedDiceIndices,
) {
  const engine =
    new ScoringEngine();

  const scoringOptions =
    engine.getScoringOptions(
      dice,
    );

  return validateScoringSelection({
    dice,
    selectedDiceIndices,
    scoringOptions,
  }).interpretations;
}

describe(
  'applyScoringSelection',
  () => {
    test(
      'entfernt eine einzelne 1 und addiert 100 Punkte',
      () => {
        const dice = [
          1,
          2,
          3,
          4,
          6,
          2,
        ];

        const interpretation =
          getInterpretations(
            dice,
            [0],
          )[0];

        const result =
          applyScoringSelection({
            turnState:
              createTurnState(
                dice,
              ),

            interpretation,
          });

        expect(
          result.turnState.turnScore,
        ).toBe(100);

        expect(
          result.turnState
            .activeDiceCount,
        ).toBe(5);

        expect(
          result.turnState
            .removedDiceValues,
        ).toEqual([1]);

        expect(
          result.isHotDice,
        ).toBe(false);
      },
    );

    test(
      'Straße plus zusätzliche 5 erzeugt 550 Punkte und Hot Dice',
      () => {
        const dice = [
          1,
          2,
          3,
          4,
          5,
          5,
        ];

        const interpretation =
          getInterpretations(
            dice,
            [
              0,
              1,
              2,
              3,
              4,
              5,
            ],
          ).find(
            (candidate) =>
              candidate.score ===
              550,
          );

        const result =
          applyScoringSelection({
            turnState:
              createTurnState(
                dice,
              ),

            interpretation,
          });

        expect(
          result.turnState.turnScore,
        ).toBe(550);

        expect(
          result.isHotDice,
        ).toBe(true);

        expect(
          result.turnState
            .activeDiceCount,
        ).toBe(6);

        expect(
          result.turnState
            .removedDiceValues,
        ).toEqual([]);

        expect(
          result.turnState
            .mustScoreAfterHotDice,
        ).toBe(true);
      },
    );

    test(
      'Zwei-5er-Sonderregel entfernt nur eine 5',
      () => {
        const dice = [
          5,
          5,
          2,
          3,
          4,
          6,
        ];

        const interpretation =
          getInterpretations(
            dice,
            [0, 1],
          ).find(
            (candidate) =>
              candidate
                .removedDiceIndices
                .length === 1,
          );

        const result =
          applyScoringSelection({
            turnState:
              createTurnState(
                dice,
              ),

            interpretation,
          });

        expect(
          result.turnState.turnScore,
        ).toBe(100);

        expect(
          result.turnState
            .activeDiceCount,
        ).toBe(5);

        expect(
          result.turnState
            .removedDiceValues,
        ).toEqual([5]);

        expect(
          result.isHotDice,
        ).toBe(false);
      },
    );

    test(
      'Zugpunkte werden über mehrere Würfe akkumuliert',
      () => {
        const dice = [
          3,
          3,
          3,
          2,
          4,
        ];

        const interpretation =
          getInterpretations(
            dice,
            [0, 1, 2],
          ).find(
            (candidate) =>
              candidate.score ===
              300,
          );

        const result =
          applyScoringSelection({
            turnState:
              createTurnState(
                dice,
                {
                  activeDiceCount: 5,
                  turnScore: 100,
                  removedDiceValues: [
                    1,
                  ],
                },
              ),

            interpretation,
          });

        expect(
          result.turnState.turnScore,
        ).toBe(400);

        expect(
          result.turnState
            .activeDiceCount,
        ).toBe(2);

        expect(
          result.turnState
            .removedDiceValues,
        ).toEqual([
          1,
          3,
          3,
          3,
        ]);
      },
    );

    test(
      'erfolgreiches Punkten nach Hot Dice hebt die alte Sperre wieder auf',
      () => {
        const dice = [
          1,
          2,
          3,
          4,
          6,
          2,
        ];

        const interpretation =
          getInterpretations(
            dice,
            [0],
          )[0];

        const result =
          applyScoringSelection({
            turnState:
              createTurnState(
                dice,
                {
                  turnScore: 550,

                  mustScoreAfterHotDice:
                    true,
                },
              ),

            interpretation,
          });

        expect(
          result.turnState.turnScore,
        ).toBe(650);

        expect(
          result.turnState
            .mustScoreAfterHotDice,
        ).toBe(false);
      },
    );

    test(
      'sechs 1en beenden den Zug als Sofortsieg statt Hot Dice',
      () => {
        const dice = [
          1,
          1,
          1,
          1,
          1,
          1,
        ];

        const interpretation =
          getInterpretations(
            dice,
            [
              0,
              1,
              2,
              3,
              4,
              5,
            ],
          )[0];

        const result =
          applyScoringSelection({
            turnState:
              createTurnState(
                dice,
              ),

            interpretation,
          });

        expect(
          result.isInstantWin,
        ).toBe(true);

        expect(
          result.isHotDice,
        ).toBe(false);

        expect(
          result.turnState.phase,
        ).toBe(
          TURN_PHASES.FINISHED,
        );

        expect(
          result.turnState.turnScore,
        ).toBe(10000);
      },
    );
  },
);