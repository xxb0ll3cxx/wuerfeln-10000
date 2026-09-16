import {
  describe,
  expect,
  test,
} from 'vitest';

import {
  detectHotDice,
} from '../../src/core/turn/detectHotDice.js';

describe(
  'detectHotDice',
  () => {
    test(
      'liefert true wenn alle aktiven Würfel entfernt werden',
      () => {
        expect(
          detectHotDice(
            6,
            [
              0,
              1,
              2,
              3,
              4,
              5,
            ],
          ),
        ).toBe(true);
      },
    );

    test(
      'liefert false wenn ein Würfel aktiv bleibt',
      () => {
        expect(
          detectHotDice(
            6,
            [
              0,
              1,
              2,
              3,
              4,
            ],
          ),
        ).toBe(false);
      },
    );

    test(
      'Zwei-5er-Sonderregel erzeugt keine Hot Dice wenn eine 5 bleibt',
      () => {
        expect(
          detectHotDice(
            2,
            [0],
          ),
        ).toBe(false);
      },
    );

    test(
      'zwei normal gewertete 5en können Hot Dice erzeugen',
      () => {
        expect(
          detectHotDice(
            2,
            [0, 1],
          ),
        ).toBe(true);
      },
    );
  },
);