import {
  GAME_RULES,
} from '../../config/gameRules.js';

import {
  detectHotDice,
} from './detectHotDice.js';

import {
  TURN_PHASES,
} from './TurnRules.js';

export function applyScoringSelection({
  turnState,
  interpretation,
}) {
  validateInput(
    turnState,
    interpretation,
  );

  const removedDiceValues =
    interpretation.removedDiceIndices.map(
      (index) =>
        turnState.diceResults[index],
    );

  const isInstantWin =
    interpretation.isInstantWin === true;

  // Sechs 1en sind ein Sofortsieg und werden deshalb
  // nicht zusätzlich als normale Hot-Dice-Situation behandelt.
  const isHotDice =
    !isInstantWin &&
    detectHotDice(
      turnState.activeDiceCount,
      interpretation.removedDiceIndices,
    );

  const nextTurnScore =
    turnState.turnScore +
    interpretation.score;

  if (isInstantWin) {
    return {
      turnState: {
        ...turnState,

        phase:
          TURN_PHASES.FINISHED,

        turnScore:
          nextTurnScore,

        diceResults: [],

        scoringOptions: [],

        selectedDiceIndices: [],

        mustScoreAfterHotDice:
          false,

        isInstantWin:
          true,
      },

      isHotDice: false,

      isInstantWin: true,

      appliedScore:
        interpretation.score,

      removedDiceValues,
    };
  }

  if (isHotDice) {
    return {
      turnState: {
        ...turnState,

        phase:
          TURN_PHASES.READY_TO_ROLL,

        turnScore:
          nextTurnScore,

        // Alle sechs Würfel werden wieder aktiv.
        activeDiceCount:
          GAME_RULES.DICE_COUNT,

        diceResults: [],

        scoringOptions: [],

        selectedDiceIndices: [],

        // Eine neue Würfelserie beginnt.
        removedDiceValues: [],

        // Nach Hot Dice muss mit den neuen Würfeln
        // mindestens einmal erfolgreich weitergepunktet werden.
        mustScoreAfterHotDice:
          true,

        isInstantWin:
          false,
      },

      isHotDice: true,

      isInstantWin: false,

      appliedScore:
        interpretation.score,

      removedDiceValues,
    };
  }

  const nextActiveDiceCount =
    turnState.activeDiceCount -
    interpretation.removedDiceIndices.length;

  if (nextActiveDiceCount <= 0) {
    throw new Error(
      'Ungültiger Zugzustand: Alle Würfel entfernt, ohne Hot Dice zu erkennen.',
    );
  }

  return {
    turnState: {
      ...turnState,

      phase:
        TURN_PHASES.READY_TO_ROLL,

      turnScore:
        nextTurnScore,

      activeDiceCount:
        nextActiveDiceCount,

      diceResults: [],

      scoringOptions: [],

      selectedDiceIndices: [],

      removedDiceValues: [
        ...turnState.removedDiceValues,
        ...removedDiceValues,
      ],

      /*
       * Eine erfolgreiche Wertung nach Hot Dice erfüllt
       * zunächst die Weiterspielpflicht.
       *
       * Sollte diese Wertung selbst wieder Hot Dice erzeugen,
       * wären wir bereits im Hot-Dice-Zweig oben gelandet und
       * hätten eine neue Sperre gesetzt.
       */
      mustScoreAfterHotDice:
        false,

      isInstantWin:
        false,
    },

    isHotDice: false,

    isInstantWin: false,

    appliedScore:
      interpretation.score,

    removedDiceValues,
  };
}

function validateInput(
  turnState,
  interpretation,
) {
  if (
    !turnState ||
    typeof turnState !== 'object'
  ) {
    throw new TypeError(
      'turnState fehlt.',
    );
  }

  if (
    !interpretation ||
    typeof interpretation !== 'object'
  ) {
    throw new TypeError(
      'interpretation fehlt.',
    );
  }

  if (
    !Number.isFinite(
      interpretation.score,
    ) ||
    interpretation.score <= 0
  ) {
    throw new RangeError(
      'Die Wertung benötigt einen positiven Punktwert.',
    );
  }

  if (
    !Array.isArray(
      interpretation.removedDiceIndices,
    )
  ) {
    throw new TypeError(
      'removedDiceIndices fehlt.',
    );
  }

  for (
    const index
    of interpretation.removedDiceIndices
  ) {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >=
        turnState.diceResults.length
    ) {
      throw new RangeError(
        `Ungültiger zu entfernender Würfelindex: ${index}`,
      );
    }
  }
}