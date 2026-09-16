import {
  describe,
  expect,
  test,
} from 'vitest';

import {
  determineWinner,
} from '../../src/core/endgame/determineWinner.js';

describe(
  'determineWinner',
  () => {
    test(
      'Spieler mit höchstem Gesamtpunktestand gewinnt',
      () => {
        const result =
          determineWinner([
            {
              id: 'anna',
              totalScore: 10100,
            },
            {
              id: 'ben',
              totalScore: 10650,
            },
            {
              id: 'chris',
              totalScore: 9900,
            },
          ]);

        expect(
          result.isTie,
        ).toBe(false);

        expect(
          result.winner.id,
        ).toBe('ben');
      },
    );

    test(
      'Gleichstand wird erkannt statt willkürlich aufgelöst',
      () => {
        const result =
          determineWinner([
            {
              id: 'anna',
              totalScore: 10500,
            },
            {
              id: 'ben',
              totalScore: 10500,
            },
          ]);

        expect(
          result.winner,
        ).toBeNull();

        expect(
          result.isTie,
        ).toBe(true);

        expect(
          result.tiedPlayers,
        ).toHaveLength(2);
      },
    );
  },
);