import {
  describe,
  expect,
  test,
} from 'vitest';

import {
  GameStore,
} from '../../src/state/GameStore.js';

import {
  createInitialState,
} from '../../src/state/createInitialState.js';

import {
  ScoringEngine,
} from '../../src/core/scoring/ScoringEngine.js';

import {
  VirtualTurnController,
} from '../../src/controllers/VirtualTurnController.js';

import {
  TURN_PHASES,
} from '../../src/core/turn/TurnRules.js';

describe(
  'VirtualTurnController - Straßen-Nachwurf',
  () => {
    test(
      '1 und 5 draußen plus 2-3-4-6 ist kein Bust',
      () => {
        const store =
          new GameStore(
            createInitialState(),
          );

        store.setState(
          (state) => ({
            ...state,

            turn: {
              ...state.turn,

              phase:
                TURN_PHASES.READY_TO_ROLL,

              rollNumber: 2,

              activeDiceCount: 4,

              removedDiceValues: [
                1,
                5,
              ],

              turnScore: 500,
            },
          }),
        );

        const randomValues = [
          0.20, // 2
          0.40, // 3
          0.50, // 4
          0.90, // 6
        ];

        let randomIndex = 0;

        const random = () =>
          randomValues[
            randomIndex++
          ];

        const controller =
          new VirtualTurnController(
            store,
            new ScoringEngine(),
            random,
          );

        const rollResult =
          controller.rollDice();

        expect(
          rollResult.diceResults,
        ).toEqual([
          2,
          3,
          4,
          6,
        ]);

        expect(
          rollResult.scoringOptions,
        ).toEqual([]);

        expect(
          rollResult
            .straightRerollOption
            .isAvailable,
        ).toBe(true);

        expect(
          rollResult.isBust,
        ).toBe(false);

        const rerollResult =
          controller
            .useStraightReroll();

        expect(
          rerollResult.turnState
            .turnScore,
        ).toBe(500);

        expect(
          rerollResult.turnState
            .activeDiceCount,
        ).toBe(4);

        expect(
          rerollResult.turnState
            .removedDiceValues,
        ).toEqual([
          1,
          5,
        ]);

        expect(
          rerollResult.turnState
            .mustRollAfterStraightReroll,
        ).toBe(true);

        expect(
          rerollResult.turnState
            .phase,
        ).toBe(
          TURN_PHASES.READY_TO_ROLL,
        );
      },
    );
  },
);