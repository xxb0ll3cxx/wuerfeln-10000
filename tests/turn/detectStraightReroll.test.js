import {
  describe,
  expect,
  test,
} from 'vitest';

import {
  detectStraightReroll,
} from '../../src/core/turn/detectStraightReroll.js';

describe(
  'detectStraightReroll',
  () => {
    test(
      'erkennt herausgelegte 1 plus 2-3-4-5',
      () => {
        const result =
          detectStraightReroll({
            removedDiceValues: [
              1,
            ],

            diceResults: [
              2,
              3,
              4,
              5,
              5,
            ],
          });

        expect(
          result.isAvailable,
        ).toBe(true);

        expect(
          result.matches.some(
            (match) =>
              match.straightValues
                .join(',') ===
              '1,2,3,4,5',
          ),
        ).toBe(true);
      },
    );

    test(
      'erkennt herausgelegte 5 plus 1-2-3-4',
      () => {
        const result =
          detectStraightReroll({
            removedDiceValues: [
              5,
            ],

            diceResults: [
              1,
              2,
              3,
              4,
              6,
            ],
          });

        expect(
          result.isAvailable,
        ).toBe(true);
      },
    );

    test(
      'erkennt mit herausgelegter 1 und 5 die große Straße',
      () => {
        const result =
          detectStraightReroll({
            removedDiceValues: [
              1,
              5,
            ],

            diceResults: [
              2,
              3,
              4,
              6,
            ],
          });

        expect(
          result.isAvailable,
        ).toBe(true);

        expect(
          result.matches.some(
            (match) =>
              match.type ===
              'large-straight',
          ),
        ).toBe(true);
      },
    );

    test(
      'ohne herausgelegte 1 oder 5 gibt es keine Sonderaktion',
      () => {
        const result =
          detectStraightReroll({
            removedDiceValues: [
              3,
            ],

            diceResults: [
              1,
              2,
              4,
              5,
              6,
            ],
          });

        expect(
          result.isAvailable,
        ).toBe(false);
      },
    );

    test(
      'unvollständige Straße wird nicht akzeptiert',
      () => {
        const result =
          detectStraightReroll({
            removedDiceValues: [
              1,
            ],

            diceResults: [
              2,
              3,
              6,
              6,
              4,
            ],
          });

        expect(
          result.isAvailable,
        ).toBe(false);
      },
    );
  },
);