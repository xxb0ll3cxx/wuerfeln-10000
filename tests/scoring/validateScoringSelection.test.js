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

describe(
  'validateScoringSelection',
  () => {
    const scoringEngine =
      new ScoringEngine();

    function validate(
      dice,
      selectedDiceIndices,
    ) {
      const scoringOptions =
        scoringEngine
          .getScoringOptions(
            dice,
          );

      return validateScoringSelection({
        dice,
        selectedDiceIndices,
        scoringOptions,
      });
    }

    test(
      'akzeptiert kleine Straße plus übrige einzelne 5',
      () => {
        const dice = [
          1,
          2,
          3,
          4,
          5,
          5,
        ];

        const validation =
          validate(
            dice,
            [
              0,
              1,
              2,
              3,
              4,
              5,
            ],
          );

        expect(
          validation.isValid,
        ).toBe(true);

        const interpretation =
          validation.interpretations
            .find(
              (candidate) =>
                candidate.score ===
                550,
            );

        expect(
          interpretation,
        ).toBeDefined();

        expect(
          interpretation
            .removedDiceIndices,
        ).toHaveLength(6);
      },
    );

    test(
      'akzeptiert Straße 2-3-4-5-6 plus übrige einzelne 5',
      () => {
        const dice = [
          2,
          3,
          4,
          5,
          5,
          6,
        ];

        const validation =
          validate(
            dice,
            [
              0,
              1,
              2,
              3,
              4,
              5,
            ],
          );

        expect(
          validation.isValid,
        ).toBe(true);

        expect(
          validation.interpretations
            .some(
              (interpretation) =>
                interpretation.score ===
                  550 &&
                interpretation
                  .removedDiceIndices
                  .length === 6,
            ),
        ).toBe(true);
      },
    );

    test(
      'unterscheidet zwei einzelne 5en von der Sonderregel',
      () => {
        const dice = [
          5,
          5,
        ];

        const validation =
          validate(
            dice,
            [0, 1],
          );

        expect(
          validation.isValid,
        ).toBe(true);

        const normalSelection =
          validation.interpretations
            .find(
              (interpretation) =>
                interpretation
                  .removedDiceIndices
                  .length === 2,
            );

        const specialSelection =
          validation.interpretations
            .find(
              (interpretation) =>
                interpretation
                  .removedDiceIndices
                  .length === 1,
            );

        expect(
          normalSelection,
        ).toBeDefined();

        expect(
          normalSelection.score,
        ).toBe(100);

        expect(
          specialSelection,
        ).toBeDefined();

        expect(
          specialSelection.score,
        ).toBe(100);
      },
    );

    test(
      'lehnt Auswahl mit nicht wertbarem Würfel ab',
      () => {
        const validation =
          validate(
            [
              1,
              2,
              3,
              4,
              6,
              6,
            ],
            [
              0,
              1,
            ],
          );

        expect(
          validation.isValid,
        ).toBe(false);
      },
    );

    test(
      'akzeptiert Pasch und Einzelwertung gemeinsam',
      () => {
        const validation =
          validate(
            [
              3,
              3,
              3,
              5,
            ],
            [
              0,
              1,
              2,
              3,
            ],
          );

        expect(
          validation.isValid,
        ).toBe(true);

        expect(
          validation.interpretations
            .some(
              (interpretation) =>
                interpretation.score ===
                350,
            ),
        ).toBe(true);
      },
    );
    test(
  'zeigt bei drei ausgewählten 5en nur den Dreierpasch',
  () => {
    const dice = [
      5,
      5,
      5,
      2,
      3,
      4,
    ];

    const validation =
      validate(
        dice,
        [
          0,
          1,
          2,
        ],
      );

    expect(
      validation.isValid,
    ).toBe(true);

    expect(
      validation.interpretations,
    ).toHaveLength(1);

    expect(
      validation
        .interpretations[0]
        .score,
    ).toBe(500);

    expect(
      validation
        .interpretations[0]
        .scoringOptions
        .some(
          (option) =>
            option.type ===
            'kind',
        ),
    ).toBe(true);
  },
);
  test(
  'zeigt bei vier ausgewählten 5en nur den Viererpasch',
  () => {
    const dice = [
      5,
      5,
      5,
      5,
      2,
      3,
    ];

    const validation =
      validate(
        dice,
        [
          0,
          1,
          2,
          3,
        ],
      );

    expect(
      validation.isValid,
    ).toBe(true);

    expect(
      validation.interpretations,
    ).toHaveLength(1);

    expect(
      validation
        .interpretations[0]
        .score,
    ).toBe(750);
  },
);

  test(
  'zeigt bei drei ausgewählten 1en nur den 1er-Dreierpasch',
  () => {
    const dice = [
      1,
      1,
      1,
      2,
      3,
      4,
    ];

    const validation =
      validate(
        dice,
        [
          0,
          1,
          2,
        ],
      );

    expect(
      validation.isValid,
    ).toBe(true);

    expect(
      validation.interpretations,
    ).toHaveLength(1);

    expect(
      validation
        .interpretations[0]
        .score,
    ).toBe(1000);
  },
);

test(
  'zeigt bei vier ausgewählten 1en nur den Viererpasch',
  () => {
    const dice = [
      1,
      1,
      1,
      1,
      3,
      4,
    ];

    const validation =
      validate(
        dice,
        [
          0,
          1,
          2,
          3,
        ],
      );

    expect(
      validation.isValid,
    ).toBe(true);

    expect(
      validation.interpretations,
    ).toHaveLength(1);

    expect(
      validation
        .interpretations[0]
        .score,
    ).toBe(1500);
  },
);

test(
  'behält bei zwei 5en gleichwertige Interpretationen mit unterschiedlicher Entfernungswirkung',
  () => {
    const dice = [
      5,
      5,
    ];

    const validation =
      validate(
        dice,
        [
          0,
          1,
        ],
      );

    expect(
      validation.isValid,
    ).toBe(true);

    /*
     * Beide Varianten haben 100 Punkte und dürfen
     * deshalb trotz Best-Score-Filter bestehen bleiben.
     */
    expect(
      validation.interpretations
        .every(
          (interpretation) =>
            interpretation.score ===
            100,
        ),
    ).toBe(true);

    expect(
      validation.interpretations
        .some(
          (interpretation) =>
            interpretation
              .removedDiceIndices
              .length === 2,
        ),
    ).toBe(true);

    expect(
      validation.interpretations
        .some(
          (interpretation) =>
            interpretation
              .removedDiceIndices
              .length === 1,
        ),
    ).toBe(true);
  },
);

test(
  'eine einzelne 5 aus einem vorhandenen Dreierpasch darf weiterhin einzeln gewählt werden',
  () => {
    const dice = [
      5,
      5,
      5,
      2,
      3,
      4,
    ];

    const validation =
      validate(
        dice,
        [
          0,
        ],
      );

    expect(
      validation.isValid,
    ).toBe(true);

    expect(
      validation.interpretations,
    ).toHaveLength(1);

    expect(
      validation
        .interpretations[0]
        .score,
    ).toBe(50);
  },
);
  },
);