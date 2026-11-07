import {
  TURN_PHASES,
} from './TurnRules.js';

export function applyStraightReroll(
  turnState,
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
    turnState.phase !==
    TURN_PHASES.SELECTING
  ) {
    throw new Error(
      'Der Straßen-Nachwurf ist nur nach einem aktuellen Wurf möglich.',
    );
  }

  return {
    ...turnState,

    phase:
      TURN_PHASES.READY_TO_ROLL,

    /*
     * Es werden keine Punkte vergeben und keine
     * weiteren Würfel herausgelegt.
     */
    diceResults: [],

    scoringOptions: [],

    selectedDiceIndices: [],

    /*
     * Der Spieler hat sich bereits für den Nachwurf
     * entschieden. Deshalb darf er jetzt nicht stattdessen
     * sichern, sondern muss tatsächlich erneut würfeln.
     */
    mustRollAfterStraightReroll:
      true,
  };
}