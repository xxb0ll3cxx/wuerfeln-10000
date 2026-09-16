import {
  GAME_RULES,
} from '../../config/gameRules.js';

export const ENDGAME_PHASES =
  Object.freeze({
    ACTIVE: 'active',

    FINAL_ROUND:
      'final-round',

    FINISHED:
      'finished',
  });

export const WIN_REASONS =
  Object.freeze({
    HIGHEST_SCORE:
      'highest-score',

    SIX_ONES:
      'six-ones',
  });

export function createInitialEndgameState() {
  return {
    phase:
      ENDGAME_PHASES.ACTIVE,

    /*
     * Spieler, der durch reguläres Sichern
     * zuerst mindestens 10.000 erreicht hat.
     */
    triggerPlayerId:
      null,

    /*
     * Spieler, die in der Nachziehrunde
     * noch genau einen Zug bekommen.
     *
     * Die Reihenfolge entspricht direkt
     * der Spielreihenfolge.
     */
    pendingPlayerIds: [],

    winnerId:
      null,

    tiedPlayerIds: [],

    winReason:
      null,
  };
}

export function hasReachedTargetScore(
  player,
) {
  if (
    !player ||
    typeof player !== 'object'
  ) {
    throw new TypeError(
      'player fehlt.',
    );
  }

  if (
    !Number.isFinite(
      player.totalScore,
    )
  ) {
    throw new TypeError(
      'player.totalScore muss eine Zahl sein.',
    );
  }

  return (
    player.totalScore >=
    GAME_RULES.TARGET_SCORE
  );
}

export function isFinalRound(
  endgameState,
) {
  return (
    endgameState.phase ===
    ENDGAME_PHASES.FINAL_ROUND
  );
}

export function isGameFinished(
  endgameState,
) {
  return (
    endgameState.phase ===
    ENDGAME_PHASES.FINISHED
  );
}