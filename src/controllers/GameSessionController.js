import {
  canBankTurn,
} from '../core/turn/canBankTurn.js';

import {
  TURN_PHASES,
} from '../core/turn/TurnRules.js';

import {
  createInitialTurnState,
} from '../state/createInitialState.js';

import {
  createInitialEndgameState,
  ENDGAME_PHASES,
  WIN_REASONS,
  hasReachedTargetScore,
} from '../core/endgame/EndgameRules.js';

import {
  createFinalRound,
  completeFinalRoundTurn,
  getPlayerIndexById,
} from '../core/endgame/FinalRound.js';

import {
  determineWinner,
} from '../core/endgame/determineWinner.js';

export class GameSessionController {
  constructor(gameStore) {
    this.gameStore =
      gameStore;
  }

  startGame({
    players,
    mode,
  }) {
    if (
      !Array.isArray(players) ||
      players.length === 0
    ) {
      throw new Error(
        'Eine Partie benötigt mindestens einen Spieler.',
      );
    }

    const matchPlayers =
      players.map(
        (player) => ({
          ...player,

          totalScore: 0,

          lastBankedScore: 0,
        }),
      );

    const turn =
      createInitialTurnState();

    const endgame =
      createInitialEndgameState();

    this.gameStore.setState(
      (state) => ({
        ...state,

        mode,

        players:
          matchPlayers,

        currentPlayerIndex:
          0,

        turn,

        endgame,
      }),
    );

    return {
      players:
        matchPlayers,

      currentPlayer:
        matchPlayers[0],

      turnState:
        turn,

      endgame,
    };
  }

  getState() {
    return this.gameStore
      .getState();
  }

  getCurrentPlayer() {
    const state =
      this.gameStore.getState();

    return (
      state.players[
        state.currentPlayerIndex
      ] ?? null
    );
  }

  canBankCurrentTurn() {
    const state =
      this.gameStore.getState();

    if (
      state.endgame.phase ===
      ENDGAME_PHASES.FINISHED
    ) {
      return false;
    }

    return canBankTurn(
      state.turn,
    );
  }

  bankCurrentTurn() {
  const state =
    this.gameStore.getState();

  if (
    !canBankTurn(
      state.turn,
    )
  ) {
    throw new Error(
      'Der aktuelle Zug darf noch nicht gesichert werden.',
    );
  }

  return this.#bankScore(
    state.turn.turnScore,
  );
}

  bankScoreboardTurn(
  score,
) {
  if (
    !Number.isInteger(score) ||
    score <= 0
  ) {
    throw new RangeError(
      'Der Score muss eine positive Ganzzahl sein.',
    );
  }

  /*
   * Absichtlich KEINE Prüfung auf MIN_BANK_SCORE.
   *
   * Im Scoreboard-Modus bestätigt der Benutzer,
   * dass dieser Wert im realen Spiel bereits
   * regelkonform gesichert wurde.
   */
  return this.#bankScore(
    score,
  );
}

#bankScore(
  bankedScore,
) {
  const state =
    this.gameStore.getState();

  if (
    state.endgame.phase ===
    ENDGAME_PHASES.FINISHED
  ) {
    throw new Error(
      'Die Partie ist bereits beendet.',
    );
  }

  const completedPlayerIndex =
    state.currentPlayerIndex;

  const updatedPlayers =
    state.players.map(
      (player, index) => {
        if (
          index !==
          completedPlayerIndex
        ) {
          return player;
        }

        return {
          ...player,

          totalScore:
            player.totalScore +
            bankedScore,

          lastBankedScore:
            bankedScore,
        };
      },
    );

  const endgameResolution =
    this.#resolveCompletedTurn({
      state,

      players:
        updatedPlayers,

      completedPlayerIndex,
    });

  const nextTurn =
    endgameResolution
      .matchFinished
      ? this.#createFinishedTurn()
      : createInitialTurnState();

  const nextPlayerIndex =
    endgameResolution
      .nextPlayerIndex ??
    completedPlayerIndex;

  this.gameStore.setState({
    ...state,

    players:
      updatedPlayers,

    currentPlayerIndex:
      nextPlayerIndex,

    turn:
      nextTurn,

    endgame:
      endgameResolution
        .endgame,
  });

  return {
    bankedScore,

    bankedPlayer:
      updatedPlayers[
        completedPlayerIndex
      ],

    nextPlayer:
      endgameResolution
        .matchFinished
        ? null
        : updatedPlayers[
            nextPlayerIndex
          ],

    currentPlayerIndex:
      endgameResolution
        .matchFinished
        ? null
        : nextPlayerIndex,

    turnState:
      nextTurn,

    endgame:
      endgameResolution
        .endgame,

    finalRoundStarted:
      endgameResolution
        .finalRoundStarted,

    isFinalRound:
      endgameResolution
        .endgame
        .phase ===
      ENDGAME_PHASES.FINAL_ROUND,

    matchFinished:
      endgameResolution
        .matchFinished,

    winner:
      endgameResolution
        .winner,

    tiedPlayers:
      endgameResolution
        .tiedPlayers,
  };
}


finishBustedTurn({
  isFirstRollBust,
}) {
  const state =
    this.gameStore.getState();

  if (
    state.turn.phase !==
    TURN_PHASES.BUSTED
  ) {
    throw new Error(
      'Der aktuelle Zug befindet sich nicht im Bust-Zustand.',
    );
  }

  return this.#finishLostTurn({
    isFirstRollBust,
  });
}

finishScoreboardLostTurn({
  isFirstRollBust = false,
} = {}) {
  return this.#finishLostTurn({
    isFirstRollBust,
  });
}


#finishLostTurn({
  isFirstRollBust,
}) {
  const state =
    this.gameStore.getState();

  if (
    state.endgame.phase ===
    ENDGAME_PHASES.FINISHED
  ) {
    throw new Error(
      'Die Partie ist bereits beendet.',
    );
  }

  const completedPlayerIndex =
    state.currentPlayerIndex;

  const lostPlayer =
    state.players[
      completedPlayerIndex
    ];

  if (!lostPlayer) {
    throw new Error(
      'Aktueller Spieler fehlt.',
    );
  }

  const penalty =
    isFirstRollBust
      ? lostPlayer
          .lastBankedScore
      : 0;

  const updatedPlayers =
    state.players.map(
      (player, index) => {
        if (
          index !==
          completedPlayerIndex
        ) {
          return player;
        }

        if (!isFirstRollBust) {
          return player;
        }

        return {
          ...player,

          totalScore:
            player.totalScore -
            penalty,

          /*
           * Die Erstwurf-0-Regel löscht
           * ausdrücklich den zuletzt
           * gesicherten Wert.
           */
          lastBankedScore: 0,
        };
      },
    );

  const endgameResolution =
    this.#resolveCompletedTurn({
      state,

      players:
        updatedPlayers,

      completedPlayerIndex,
    });

  const nextTurn =
    endgameResolution
      .matchFinished
      ? this.#createFinishedTurn()
      : createInitialTurnState();

  const nextPlayerIndex =
    endgameResolution
      .nextPlayerIndex ??
    completedPlayerIndex;

  this.gameStore.setState({
    ...state,

    players:
      updatedPlayers,

    currentPlayerIndex:
      nextPlayerIndex,

    turn:
      nextTurn,

    endgame:
      endgameResolution
        .endgame,
  });

  return {
    penaltyApplied:
      penalty,

    lostPlayer:
      updatedPlayers[
        completedPlayerIndex
      ],

    /*
     * Alias für den bestehenden VirtualGameScreen.
     * Dadurch müssen wir diesen nicht umbauen.
     */
    bustedPlayer:
      updatedPlayers[
        completedPlayerIndex
      ],

    nextPlayer:
      endgameResolution
        .matchFinished
        ? null
        : updatedPlayers[
            nextPlayerIndex
          ],

    currentPlayerIndex:
      endgameResolution
        .matchFinished
        ? null
        : nextPlayerIndex,

    turnState:
      nextTurn,

    endgame:
      endgameResolution
        .endgame,

    isFinalRound:
      endgameResolution
        .endgame
        .phase ===
      ENDGAME_PHASES.FINAL_ROUND,

    matchFinished:
      endgameResolution
        .matchFinished,

    winner:
      endgameResolution
        .winner,

    tiedPlayers:
      endgameResolution
        .tiedPlayers,
  };
}

finishScoreboardInstantWin() {
  return this.#finishInstantWin({
    instantWinScore:
      10_000,

    requireVirtualTurnFlag:
      false,
  });
}

finishInstantWin({
  instantWinScore,
}) {
  return this.#finishInstantWin({
    instantWinScore,

    requireVirtualTurnFlag:
      true,
  });
}


#finishInstantWin({
  instantWinScore,
  requireVirtualTurnFlag,
}) {
  const state =
    this.gameStore.getState();

  if (
    requireVirtualTurnFlag &&
    state.turn.isInstantWin !==
      true
  ) {
    throw new Error(
      'Der aktuelle Zug enthält keinen Sofortsieg.',
    );
  }

  if (
    state.endgame.phase ===
    ENDGAME_PHASES.FINISHED
  ) {
    throw new Error(
      'Die Partie ist bereits beendet.',
    );
  }

  if (
    !Number.isFinite(
      instantWinScore,
    ) ||
    instantWinScore <= 0
  ) {
    throw new RangeError(
      'instantWinScore muss positiv sein.',
    );
  }

  const winnerIndex =
    state.currentPlayerIndex;

  const updatedPlayers =
    state.players.map(
      (player, index) => {
        if (
          index !== winnerIndex
        ) {
          return player;
        }

        return {
          ...player,

          totalScore:
            player.totalScore +
            instantWinScore,
        };
      },
    );

  const winner =
    updatedPlayers[
      winnerIndex
    ];

  const endgame = {
    ...state.endgame,

    phase:
      ENDGAME_PHASES.FINISHED,

    pendingPlayerIds: [],

    winnerId:
      winner.id,

    tiedPlayerIds: [],

    winReason:
      WIN_REASONS.SIX_ONES,
  };

  const finishedTurn =
    this.#createFinishedTurn();

  this.gameStore.setState({
    ...state,

    players:
      updatedPlayers,

    turn:
      finishedTurn,

    endgame,
  });

  return {
    matchFinished:
      true,

    winner,

    tiedPlayers: [],

    endgame,

    turnState:
      finishedTurn,
  };
}
  /*
   * Wird ausschließlich für sechs 1en verwendet.
   *
   * Es wird KEINE reguläre Sicherung durchgeführt
   * und KEINE Nachziehrunde gestartet.
   */
  finishInstantWin({
    instantWinScore,
  }) {
    const state =
      this.gameStore.getState();

    if (
      state.turn.isInstantWin !==
      true
    ) {
      throw new Error(
        'Der aktuelle Zug enthält keinen Sofortsieg.',
      );
    }

    if (
      state.endgame.phase ===
      ENDGAME_PHASES.FINISHED
    ) {
      throw new Error(
        'Die Partie ist bereits beendet.',
      );
    }

    if (
      !Number.isFinite(
        instantWinScore,
      ) ||
      instantWinScore <= 0
    ) {
      throw new RangeError(
        'instantWinScore muss positiv sein.',
      );
    }

    const winnerIndex =
      state.currentPlayerIndex;

    const updatedPlayers =
      state.players.map(
        (player, index) => {
          if (
            index !== winnerIndex
          ) {
            return player;
          }

          /*
           * Wir schreiben hier exakt die Punkte der
           * Sofortsieg-Kombination gut.
           *
           * Die Quellen definieren nicht ausdrücklich,
           * wie vorherige ungesicherte Punkte desselben
           * Zuges beim Sofortsieg im finalen Score
           * behandelt werden.
           */
          return {
            ...player,

            totalScore:
              player.totalScore +
              instantWinScore,
          };
        },
      );

    const winner =
      updatedPlayers[
        winnerIndex
      ];

    const endgame = {
      ...state.endgame,

      phase:
        ENDGAME_PHASES.FINISHED,

      pendingPlayerIds: [],

      winnerId:
        winner.id,

      tiedPlayerIds: [],

      winReason:
        WIN_REASONS.SIX_ONES,
    };

    const finishedTurn =
      this.#createFinishedTurn();

    this.gameStore.setState({
      ...state,

      players:
        updatedPlayers,

      turn:
        finishedTurn,

      endgame,
    });

    return {
      matchFinished:
        true,

      winner,

      tiedPlayers: [],

      endgame,

      turnState:
        finishedTurn,
    };
  }

  #resolveCompletedTurn({
    state,
    players,
    completedPlayerIndex,
  }) {
    const endgame =
      state.endgame ??
      createInitialEndgameState();

    if (
      endgame.phase ===
      ENDGAME_PHASES.FINISHED
    ) {
      throw new Error(
        'Die Partie ist bereits beendet.',
      );
    }

    const completedPlayer =
      players[
        completedPlayerIndex
      ];

    if (!completedPlayer) {
      throw new Error(
        'Abgeschlossener Spielerzug konnte keinem Spieler zugeordnet werden.',
      );
    }

    /*
     * NORMALER SPIELBETRIEB
     */
    if (
      endgame.phase ===
      ENDGAME_PHASES.ACTIVE
    ) {
      /*
       * Erst das Sichern eines Punktestands von
       * mindestens 10.000 startet die Nachziehrunde.
       *
       * Bei einem Bust kann diese Bedingung im normalen
       * Spiel nicht neu entstehen.
       */
      if (
        hasReachedTargetScore(
          completedPlayer,
        )
      ) {
        const finalRound =
          createFinalRound({
            players,

            triggerPlayerIndex:
              completedPlayerIndex,
          });

        /*
         * Sonderfall eines Ein-Spieler-Spiels:
         * Es existiert niemand, der nachziehen kann.
         */
        if (
          finalRound
            .pendingPlayerIds
            .length === 0
        ) {
          return this.#finishByHighestScore({
            players,

            endgame: {
              ...endgame,

              triggerPlayerId:
                finalRound
                  .triggerPlayerId,
            },
          });
        }

        const nextPlayerId =
          finalRound
            .pendingPlayerIds[0];

        return {
          endgame: {
            ...endgame,

            phase:
              ENDGAME_PHASES
                .FINAL_ROUND,

            triggerPlayerId:
              finalRound
                .triggerPlayerId,

            pendingPlayerIds:
              finalRound
                .pendingPlayerIds,
          },

          nextPlayerIndex:
            getPlayerIndexById(
              players,
              nextPlayerId,
            ),

          finalRoundStarted:
            true,

          matchFinished:
            false,

          winner:
            null,

          tiedPlayers: [],
        };
      }

      return {
        endgame,

        nextPlayerIndex:
          this.#getNextPlayerIndex(
            completedPlayerIndex,
            players.length,
          ),

        finalRoundStarted:
          false,

        matchFinished:
          false,

        winner:
          null,

        tiedPlayers: [],
      };
    }

    /*
     * NACHZIEHRUNDE
     */
    if (
      endgame.phase ===
      ENDGAME_PHASES.FINAL_ROUND
    ) {
      const remainingPlayerIds =
        completeFinalRoundTurn({
          pendingPlayerIds:
            endgame
              .pendingPlayerIds,

          completedPlayerId:
            completedPlayer.id,
        });

      /*
       * Der letzte Nachzieh-Spieler hat seinen
       * Zug beendet.
       */
      if (
        remainingPlayerIds.length ===
        0
      ) {
        return this.#finishByHighestScore({
          players,

          endgame: {
            ...endgame,

            pendingPlayerIds:
              [],
          },
        });
      }

      const nextPlayerId =
        remainingPlayerIds[0];

      return {
        endgame: {
          ...endgame,

          pendingPlayerIds:
            remainingPlayerIds,
        },

        nextPlayerIndex:
          getPlayerIndexById(
            players,
            nextPlayerId,
          ),

        finalRoundStarted:
          false,

        matchFinished:
          false,

        winner:
          null,

        tiedPlayers: [],
      };
    }

    throw new Error(
      `Unbekannte Endgame-Phase: ${endgame.phase}`,
    );
  }

  #finishByHighestScore({
    players,
    endgame,
  }) {
    const result =
      determineWinner(
        players,
      );

    const finishedEndgame = {
      ...endgame,

      phase:
        ENDGAME_PHASES.FINISHED,

      pendingPlayerIds: [],

      winnerId:
        result.winner
          ?.id ??
        null,

      tiedPlayerIds:
        result.tiedPlayers
          .map(
            (player) =>
              player.id,
          ),

      winReason:
        WIN_REASONS
          .HIGHEST_SCORE,
    };

    return {
      endgame:
        finishedEndgame,

      nextPlayerIndex:
        null,

      finalRoundStarted:
        false,

      matchFinished:
        true,

      winner:
        result.winner,

      tiedPlayers:
        result.tiedPlayers,
    };
  }

  #createFinishedTurn() {
    return {
      ...createInitialTurnState(),

      phase:
        TURN_PHASES.FINISHED,
    };
  }

  #getNextPlayerIndex(
    currentPlayerIndex,
    playerCount,
  ) {
    if (playerCount <= 0) {
      throw new Error(
        'Spielerwechsel ohne Spieler ist nicht möglich.',
      );
    }

    return (
      currentPlayerIndex + 1
    ) %
    playerCount;
  }
}