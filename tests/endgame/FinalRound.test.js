import {
  describe,
  expect,
  test,
} from 'vitest';

import {
  createFinalRound,
  completeFinalRoundTurn,
} from '../../src/core/endgame/FinalRound.js';

const players = [
  {
    id: 'anna',
  },
  {
    id: 'ben',
  },
  {
    id: 'chris',
  },
  {
    id: 'dora',
  },
];

describe(
  'FinalRound',
  () => {
    test(
      'alle anderen Spieler ziehen genau einmal in korrekter Reihenfolge nach',
      () => {
        const result =
          createFinalRound({
            players,

            triggerPlayerIndex:
              2,
          });

        expect(
          result.triggerPlayerId,
        ).toBe('chris');

        expect(
          result.pendingPlayerIds,
        ).toEqual([
          'dora',
          'anna',
          'ben',
        ]);
      },
    );

    test(
      'der Trigger-Spieler erhält keinen weiteren Zug',
      () => {
        const result =
          createFinalRound({
            players,

            triggerPlayerIndex:
              0,
          });

        expect(
          result.pendingPlayerIds,
        ).toEqual([
          'ben',
          'chris',
          'dora',
        ]);

        expect(
          result.pendingPlayerIds,
        ).not.toContain(
          'anna',
        );
      },
    );

    test(
      'ein abgeschlossener Nachziehzug wird aus der Warteschlange entfernt',
      () => {
        const remaining =
          completeFinalRoundTurn({
            pendingPlayerIds: [
              'ben',
              'chris',
            ],

            completedPlayerId:
              'ben',
          });

        expect(
          remaining,
        ).toEqual([
          'chris',
        ]);
      },
    );
  },
);