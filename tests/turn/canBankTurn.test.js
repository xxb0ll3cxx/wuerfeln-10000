import {
  describe,
  expect,
  test,
} from 'vitest';

import {
  canBankTurn,
} from '../../src/core/turn/canBankTurn.js';

import {
  TURN_PHASES,
} from '../../src/core/turn/TurnRules.js';

function createTurn(
  overrides = {},
) {
  return {
    phase:
      TURN_PHASES.READY_TO_ROLL,

    turnScore: 0,

    mustScoreAfterHotDice:
      false,

    isInstantWin:
      false,

    ...overrides,
  };
}

describe(
  'canBankTurn',
  () => {
    test(
      '349 Punkte reichen nicht',
      () => {
        expect(
          canBankTurn(
            createTurn({
              turnScore: 349,
            }),
          ),
        ).toBe(false);
      },
    );

    test(
      'ab 350 Punkten darf gesichert werden',
      () => {
        expect(
          canBankTurn(
            createTurn({
              turnScore: 350,
            }),
          ),
        ).toBe(true);
      },
    );

    test(
      'direkt nach Hot Dice darf nicht gesichert werden',
      () => {
        expect(
          canBankTurn(
            createTurn({
              turnScore: 1000,

              mustScoreAfterHotDice:
                true,
            }),
          ),
        ).toBe(false);
      },
    );

    test(
      'während der Würfelauswahl darf nicht gesichert werden',
      () => {
        expect(
          canBankTurn(
            createTurn({
              phase:
                TURN_PHASES.SELECTING,

              turnScore: 500,
              mustRollAfterStraightReroll:
                false,
            }),
          ),
        ).toBe(false);
      },
    );

    test(
    'nach gewähltem Straßen-Nachwurf darf vor dem erneuten Wurf nicht gesichert werden',
    () => {
        expect(
        canBankTurn(
            createTurn({
            turnScore: 800,

            mustRollAfterStraightReroll:
                true,
            }),
        ),
        ).toBe(false);
    },
    );
  },
);