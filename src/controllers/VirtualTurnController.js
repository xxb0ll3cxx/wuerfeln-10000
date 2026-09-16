import {
  rollDice,
} from '../core/dice/rollDice.js';

import {
  validateScoringSelection,
} from '../core/scoring/validateScoringSelection.js';

import {
  applyScoringSelection,
} from '../core/turn/applyScoringSelection.js';

import {
  detectBust,
} from '../core/turn/detectBust.js';

import {
  detectHotDice,
} from '../core/turn/detectHotDice.js';

import {
  assertCanRoll,
  assertCanSelect,
  TURN_PHASES,
} from '../core/turn/TurnRules.js';

import {
  detectStraightReroll,
} from '../core/turn/detectStraightReroll.js';

import {
  applyStraightReroll,
} from '../core/turn/applyStraightReroll.js';

export class VirtualTurnController {
    constructor(
        gameStore,
        scoringEngine,
        random = Math.random,
    ) {
        this.gameStore =
        gameStore;

        this.scoringEngine =
        scoringEngine;

        this.random =
        random;
    }

    rollDice() {
    const state =
        this.gameStore.getState();

    const turn =
        state.turn;

    assertCanRoll(turn);

    /*
    * Zuerst wird der tatsächliche Wurf erzeugt.
    *
    * Wichtig:
    * Es werden nur die aktuell aktiven Würfel geworfen.
    */
    const diceResults =
        rollDice(
        turn.activeDiceCount,
        this.random,
        );

    /*
    * Danach werden die normalen Wertungsmöglichkeiten
    * ausschließlich aus diesem Wurf ermittelt.
    */
    const scoringOptions =
        this.scoringEngine
        .getScoringOptions(
            diceResults,
        );

    /*
    * Unabhängig vom normalen Scoring prüfen wir,
    * ob bereits herausgelegte 1en und/oder 5en
    * zusammen mit dem aktuellen Wurf eine Straße
    * ermöglichen.
    */
    const straightRerollOption =
        detectStraightReroll({
        diceResults,

        removedDiceValues:
            turn.removedDiceValues,
        });

    /*
    * Ein leerer Scoring-Wurf ist nur dann ein Bust,
    * wenn auch keine alternative regelkonforme
    * Aktion existiert.
    */
    const isBust =
        detectBust(
        scoringOptions,
        {
            hasAlternativeAction:
            straightRerollOption
                .isAvailable,
        },
        );

    const nextTurn = {
        ...turn,

        rollNumber:
        turn.rollNumber + 1,

        diceResults,

        scoringOptions,

        selectedDiceIndices: [],

        /*
        * Falls dieser Wurf aufgrund eines zuvor
        * gewählten Straßen-Nachwurfs durchgeführt
        * wurde, ist diese Würfelpflicht nun erfüllt.
        */
        mustRollAfterStraightReroll:
        false,
    };

    if (isBust) {
        const bustedTurn = {
        ...nextTurn,

        phase:
            TURN_PHASES.BUSTED,

        /*
        * Alle ungesicherten Zugpunkte gehen
        * bei einem Fehlwurf verloren.
        */
        turnScore: 0,

        mustScoreAfterHotDice:
            false,
        };

        this.#setTurn(
        bustedTurn,
        );

        return {
        diceResults,

        scoringOptions,

        straightRerollOption,

        isBust: true,

        /*
        * Vor diesem Wurf war rollNumber noch 0,
        * wenn dies der erste Wurf des Zuges war.
        */
        isFirstRollBust:
            turn.rollNumber === 0,

        turnState:
            bustedTurn,
        };
    }

    const selectingTurn = {
        ...nextTurn,

        phase:
        TURN_PHASES.SELECTING,
    };

    this.#setTurn(
        selectingTurn,
    );

    return {
        diceResults,

        scoringOptions,

        straightRerollOption,

        isBust: false,

        isFirstRollBust:
        false,

        turnState:
        selectingTurn,
    };
    }

  useStraightReroll() {
  const {
    turn,
  } =
    this.gameStore.getState();

  assertCanSelect(
    turn,
  );

  const option =
    detectStraightReroll({
      diceResults:
        turn.diceResults,

      removedDiceValues:
        turn.removedDiceValues,
    });

  if (!option.isAvailable) {
    throw new Error(
      'Für den aktuellen Wurf ist kein Straßen-Nachwurf möglich.',
    );
  }

  const nextTurn =
    applyStraightReroll(
      turn,
    );

  this.#setTurn(
    nextTurn,
  );

  return {
    turnState:
      nextTurn,

    straightRerollOption:
      option,
  };
}

  toggleDiceSelection(
    diceIndex,
  ) {
    const state =
      this.gameStore.getState();

    const turn =
      state.turn;

    assertCanSelect(
      turn,
    );

    if (
      !Number.isInteger(
        diceIndex,
      ) ||
      diceIndex < 0 ||
      diceIndex >=
        turn.diceResults.length
    ) {
      throw new RangeError(
        `Ungültiger Würfelindex: ${diceIndex}`,
      );
    }

    const isSelected =
      turn.selectedDiceIndices
        .includes(
          diceIndex,
        );

    const nextSelectedIndices =
      isSelected
        ? turn.selectedDiceIndices
            .filter(
              (index) =>
                index !==
                diceIndex,
            )
        : [
            ...turn.selectedDiceIndices,
            diceIndex,
          ].sort(
            (a, b) =>
              a - b,
          );

    this.#setTurn({
      ...turn,

      selectedDiceIndices:
        nextSelectedIndices,
    });

    return {
      selectedDiceIndices:
        nextSelectedIndices,

      selectionValidation:
        this.validateSelection(
          nextSelectedIndices,
        ),
    };
  }

  validateSelection(
    selectedDiceIndices,
  ) {
    const {
      turn,
    } =
      this.gameStore.getState();

    const validation =
      validateScoringSelection({
        dice:
          turn.diceResults,

        selectedDiceIndices,

        scoringOptions:
          turn.scoringOptions,
      });

    return {
      ...validation,

      interpretations:
        validation.interpretations
          .map(
            (
              interpretation,
            ) => ({
              ...interpretation,

              isHotDice:
                !interpretation
                  .isInstantWin &&
                detectHotDice(
                  turn.activeDiceCount,

                  interpretation
                    .removedDiceIndices,
                ),
            }),
          ),
    };
  }

  applySelectedScoring(
    interpretationId,
  ) {
    const {
      turn,
    } =
      this.gameStore.getState();

    assertCanSelect(
      turn,
    );

    const validation =
      this.validateSelection(
        turn.selectedDiceIndices,
      );

    if (!validation.isValid) {
      throw new Error(
        'Die aktuelle Würfelauswahl ist nicht wertbar.',
      );
    }

    const interpretation =
      validation.interpretations
        .find(
          (candidate) =>
            candidate.id ===
            interpretationId,
        );

    if (!interpretation) {
      throw new Error(
        `Unbekannte Wertungsinterpretation: ${interpretationId}`,
      );
    }

    const result =
      applyScoringSelection({
        turnState:
          turn,

        interpretation,
      });

    this.#setTurn(
      result.turnState,
    );

    return {
      ...result,

      interpretation,
    };
  }

  #setTurn(turn) {
    this.gameStore.setState(
      (state) => ({
        ...state,

        turn,
      }),
    );
  }
}