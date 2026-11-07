import {
  GAME_RULES,
} from '../../config/gameRules.js';

import {
  TURN_PHASES,
} from './TurnRules.js';

export function canBankTurn(
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

  return (
    turnState.phase ===
      TURN_PHASES.READY_TO_ROLL &&

    turnState.turnScore >=
      GAME_RULES.MIN_BANK_SCORE &&

    turnState
      .mustScoreAfterHotDice ===
      false &&

    turnState
      .mustRollAfterStraightReroll !==
      true &&

    turnState.isInstantWin !==
      true
  );
}