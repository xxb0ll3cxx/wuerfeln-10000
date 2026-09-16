import {
  describe,
  expect,
  test,
} from 'vitest';

import {
  detectBust,
} from '../../src/core/turn/detectBust.js';

describe(
  'detectBust',
  () => {
    test(
      'erkennt einen Wurf ohne Wertungsoptionen als Bust',
      () => {
        expect(
          detectBust([]),
        ).toBe(true);
      },
    );

    test(
      'ein Wurf mit mindestens einer Wertungsoption ist kein Bust',
      () => {
        expect(
          detectBust([
            {
              score: 100,
            },
          ]),
        ).toBe(false);
      },
    );
  },
);

test(
  'kein Bust wenn trotz leerer ScoringOptions eine alternative Regelaktion existiert',
  () => {
    expect(
      detectBust(
        [],
        {
          hasAlternativeAction:
            true,
        },
      ),
    ).toBe(false);
  },
);