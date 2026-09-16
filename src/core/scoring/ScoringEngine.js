const SCORING_TYPES = Object.freeze({
  SINGLE: 'single',
  PAIR_OF_FIVES: 'pair-of-fives',
  KIND: 'kind',
  SMALL_STRAIGHT: 'small-straight',
  LARGE_STRAIGHT: 'large-straight',
});

export class ScoringEngine {
  getScoringOptions(dice) {
    this.#validateDice(dice);

    // Sechs 1en beenden die Partie laut Regelwerk unmittelbar.
    // Deshalb werden bei diesem Wurf keine alternativen Teilwertungen angeboten.
    if (this.#isInstantWin(dice)) {
      return [
        this.#createKindOption(
          dice,
          [0, 1, 2, 3, 4, 5],
          1,
        ),
      ];
    }

    return [
      ...this.#detectSingles(dice),
      ...this.#detectPairsOfFives(dice),
      ...this.#detectKinds(dice),
      ...this.#detectStraights(dice),
    ];
  }

  #detectSingles(dice) {
    const options = [];

    dice.forEach((value, index) => {
      if (value !== 1 && value !== 5) {
        return;
      }

      options.push({
        id: `single-${value}-${index}`,
        type: SCORING_TYPES.SINGLE,
        label:
          value === 1
            ? 'Einzelne 1'
            : 'Einzelne 5',
        score:
          value === 1
            ? 100
            : 50,
        diceIndices: [index],
        diceValues: [value],
        removeCount: 1,
        isInstantWin: false,
      });
    });

    return options;
  }

  #detectPairsOfFives(dice) {
    const fiveIndices = this.#findIndicesByValue(
      dice,
      5,
    );

    if (fiveIndices.length < 2) {
      return [];
    }

    return this.#getCombinations(
      fiveIndices,
      2,
    ).map((indices) => ({
      id: `pair-of-fives-${indices.join('-')}`,
      type: SCORING_TYPES.PAIR_OF_FIVES,
      label: 'Zwei-5er-Sonderregel',
      score: 100,
      diceIndices: indices,
      diceValues: indices.map(
        (index) => dice[index],
      ),

      // Beide 5en gehören zur Wertung,
      // aber laut Sonderregel wird nur eine herausgelegt.
      removeCount: 1,

      isInstantWin: false,
    }));
  }

  #detectKinds(dice) {
    const options = [];

    for (let value = 1; value <= 6; value += 1) {
      const matchingIndices =
        this.#findIndicesByValue(
          dice,
          value,
        );

      if (matchingIndices.length < 3) {
        continue;
      }

      for (
        let count = 3;
        count <= matchingIndices.length;
        count += 1
      ) {
        const combinations =
          this.#getCombinations(
            matchingIndices,
            count,
          );

        for (const indices of combinations) {
          options.push(
            this.#createKindOption(
              dice,
              indices,
              value,
            ),
          );
        }
      }
    }

    return options;
  }

  #createKindOption(
    dice,
    indices,
    value,
  ) {
    const count = indices.length;

    return {
      id:
        `kind-${value}-${count}-` +
        indices.join('-'),

      type: SCORING_TYPES.KIND,

      label:
        `${count}× ${value}`,

      score:
        this.#calculateKindScore(
          value,
          count,
        ),

      diceIndices: [...indices],

      diceValues: indices.map(
        (index) => dice[index],
      ),

      removeCount: count,

      isInstantWin:
        value === 1 &&
        count === 6,
    };
  }

  #calculateKindScore(
    value,
    count,
  ) {
    if (
      count < 3 ||
      count > 6
    ) {
      throw new Error(
        `Ungültige Pasch-Anzahl: ${count}`,
      );
    }

    if (value === 1) {
      const oneScores = {
        3: 1000,
        4: 1500,
        5: 2500,
        6: 10000,
      };

      return oneScores[count];
    }

    const tripleScore =
      value * 100;

    if (count === 3) {
      return tripleScore;
    }

    const fourOfKindScore =
      tripleScore +
      value * 50;

    if (count === 4) {
      return fourOfKindScore;
    }

    const fiveOfKindScore =
      fourOfKindScore +
      value * 100;

    if (count === 5) {
      return fiveOfKindScore;
    }

    return (
      fiveOfKindScore +
      value * 150
    );
  }

  #detectStraights(dice) {
    const options = [];

    options.push(
      ...this.#createStraightOptions(
        dice,
        [1, 2, 3, 4, 5],
        {
          type:
            SCORING_TYPES.SMALL_STRAIGHT,
          label:
            'Kleine Straße 1-2-3-4-5',
          score: 500,
        },
      ),
    );

    options.push(
      ...this.#createStraightOptions(
        dice,
        [2, 3, 4, 5, 6],
        {
          type:
            SCORING_TYPES.SMALL_STRAIGHT,
          label:
            'Kleine Straße 2-3-4-5-6',
          score: 500,
        },
      ),
    );

    options.push(
      ...this.#createStraightOptions(
        dice,
        [1, 2, 3, 4, 5, 6],
        {
          type:
            SCORING_TYPES.LARGE_STRAIGHT,
          label:
            'Große Straße 1-2-3-4-5-6',
          score: 2000,
        },
      ),
    );

    return options;
  }

  #createStraightOptions(
    dice,
    requiredValues,
    {
      type,
      label,
      score,
    },
  ) {
    const indexGroups =
      requiredValues.map((value) =>
        this.#findIndicesByValue(
          dice,
          value,
        ),
      );

    const hasEveryRequiredValue =
      indexGroups.every(
        (indices) =>
          indices.length > 0,
      );

    if (!hasEveryRequiredValue) {
      return [];
    }

    const combinations =
      this.#cartesianProduct(
        indexGroups,
      );

    return combinations.map(
      (indices) => ({
        id:
          `${type}-` +
          indices.join('-'),

        type,
        label,
        score,

        diceIndices:
          [...indices].sort(
            (a, b) => a - b,
          ),

        diceValues:
          indices.map(
            (index) => dice[index],
          ),

        removeCount:
          requiredValues.length,

        isInstantWin: false,
      }),
    );
  }

  #findIndicesByValue(
    dice,
    targetValue,
  ) {
    const indices = [];

    dice.forEach(
      (value, index) => {
        if (value === targetValue) {
          indices.push(index);
        }
      },
    );

    return indices;
  }

  #getCombinations(
    values,
    size,
  ) {
    const results = [];

    const buildCombination = (
      startIndex,
      current,
    ) => {
      if (current.length === size) {
        results.push([...current]);
        return;
      }

      for (
        let index = startIndex;
        index < values.length;
        index += 1
      ) {
        current.push(values[index]);

        buildCombination(
          index + 1,
          current,
        );

        current.pop();
      }
    };

    buildCombination(0, []);

    return results;
  }

  #cartesianProduct(groups) {
    return groups.reduce(
      (combinations, group) => {
        const nextCombinations = [];

        for (
          const combination
          of combinations
        ) {
          for (const value of group) {
            nextCombinations.push([
              ...combination,
              value,
            ]);
          }
        }

        return nextCombinations;
      },
      [[]],
    );
  }

  #isInstantWin(dice) {
    return (
      dice.length === 6 &&
      dice.every(
        (value) => value === 1,
      )
    );
  }

  #validateDice(dice) {
    if (!Array.isArray(dice)) {
      throw new TypeError(
        'dice muss ein Array sein.',
      );
    }

    if (
      dice.length < 1 ||
      dice.length > 6
    ) {
      throw new RangeError(
        'Ein Wurf muss zwischen 1 und 6 Würfeln enthalten.',
      );
    }

    for (const value of dice) {
      if (
        !Number.isInteger(value) ||
        value < 1 ||
        value > 6
      ) {
        throw new RangeError(
          `Ungültiger Würfelwert: ${value}`,
        );
      }
    }
  }
}

export {
  SCORING_TYPES,
};