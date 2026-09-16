import {
  GAME_RULES,
} from '../config/gameRules.js';

import {
  TURN_PHASES,
} from '../core/turn/TurnRules.js';

import {
  createInitialEndgameState,
} from '../core/endgame/EndgameRules.js';

export function createInitialTurnState() {
  return {
    phase:
      TURN_PHASES.READY_TO_ROLL,

    rollNumber: 0,

    activeDiceCount:
      GAME_RULES.DICE_COUNT,

    diceResults: [],

    scoringOptions: [],

    selectedDiceIndices: [],

    turnScore: 0,

    removedDiceValues: [],

    mustScoreAfterHotDice:
      false,

    mustRollAfterStraightReroll:
      false,

    isInstantWin:
      false,
  };
}

export function createInitialState() {
  return {
    mode:
      null,

    players: [],

    currentPlayerIndex:
      0,

    turn:
      createInitialTurnState(),

    endgame:
      createInitialEndgameState(),
  };
}