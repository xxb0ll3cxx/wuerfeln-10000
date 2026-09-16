import {
  describe,
  expect,
  test,
} from 'vitest';

import {
  applyStraightReroll,
} from '../../src/core/turn/applyStraightReroll.js';

import {
  TURN_PHASES,
} from '../../src/core/turn/TurnRules.js';

describe(
  'applyStraightReroll',
  () => {
    test(
      'behält Punkte, aktive Würfel und herausgelegte Würfel unverändert',
      () => {
        const turn = {
          phase:
            TURN_PHASES.SELECTING,

          rollNumber: 3,

          activeDiceCount: 5,

          diceResults: [
            2,
            3,
            4,
            5,
            5,
          ],

          scoringOptions: [
            {
              score: 50,
            },
          ],

          selectedDiceIndices: [
            3,
          ],

          turnScore: 750,

          removedDiceValues: [
            1,
          ],

          mustScoreAfterHotDice:
            false,

          mustRollAfterStraightReroll:
            false,

          isInstantWin:
            false,
        };

        const result =
          applyStraightReroll(
            turn,
          );

        expect(
          result.turnScore,
        ).toBe(750);

        expect(
          result.activeDiceCount,
        ).toBe(5);

        expect(
          result.removedDiceValues,
        ).toEqual([1]);

        expect(
          result.diceResults,
        ).toEqual([]);

        expect(
          result.phase,
        ).toBe(
          TURN_PHASES.READY_TO_ROLL,
        );

        expect(
          result
            .mustRollAfterStraightReroll,
        ).toBe(true);
      },
    );
  },
);