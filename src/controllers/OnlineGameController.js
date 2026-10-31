import {
  TURN_PHASES,
} from '../core/turn/TurnRules.js';

import {
  ENDGAME_PHASES,
} from '../core/endgame/EndgameRules.js';


const SERVER_ACTION_TIMEOUT_MS =
  8_000;


function createEmptyStraightRerollOption() {
  return {
    isAvailable:
      false,

    matches:
      [],
  };
}


function areSameNumberArrays(
  left,
  right,
) {
  if (
    !Array.isArray(left) ||
    !Array.isArray(right) ||
    left.length !==
      right.length
  ) {
    return false;
  }


  return left.every(
    (
      value,
      index,
    ) =>
      value ===
      right[index],
  );
}


export class OnlineGameController {
  constructor(
    multiplayerClient,
  ) {
    if (!multiplayerClient) {
      throw new Error(
        'OnlineGameController benötigt einen MultiplayerClient.',
      );
    }


    this.multiplayerClient =
      multiplayerClient;


    this.listeners =
      new Set();


    /*
     * Solange eine Serveraktion läuft, nehmen wir keine
     * zweite Game-Aktion an.
     *
     * Das verhindert z. B. zwei Rolls, bevor der erste
     * autoritative ROOM_STATE angekommen ist.
     */
    this.isActionPending =
      false;


    this.unsubscribeMultiplayer =
      this.multiplayerClient
        .subscribe(
          () => {
            this.#emit();
          },
        );
  }


  /*
   * =====================================================
   * STATE
   * =====================================================
   */

  getState() {
    const multiplayerState =
      this.multiplayerClient
        .getState();


    const room =
      multiplayerState
        .currentRoom;


    const match =
      room
        ?.match ??
      null;


    const localPlayerId =
      multiplayerState
        .localPlayerId;


    const players =
      (
        room?.players ??
        []
      )
        .map(
          (roomPlayer) => {
            const matchPlayer =
              match
                ?.playerStates
                ?.find(
                  (playerState) =>
                    playerState
                      .playerId ===
                    roomPlayer.id,
                );


            return {
              id:
                roomPlayer.id,

              name:
                roomPlayer
                  .displayName ??
                'Spieler',

              role:
                roomPlayer.role,

              connectionStatus:
                roomPlayer
                  .connectionStatus ??
                'connected',

              disconnectedAt:
                roomPlayer
                  .disconnectedAt ??
                null,

              reconnectDeadlineAt:
                roomPlayer
                  .reconnectDeadlineAt ??
                null,

              characterId:
                roomPlayer
                  .characterId ??
                null,

              skinId:
                roomPlayer
                  .skinId ??
                null,

              diceSkinId:
                roomPlayer
                  .diceSkinId ??
                null,
                
              totalScore:
                matchPlayer
                  ?.totalScore ??
                0,

              lastBankedScore:
                matchPlayer
                  ?.lastBankedScore ??
                0,
            };
          },
        );


    const activePlayerId =
      match
        ?.activePlayerId ??
      null;


    const currentPlayerIndex =
      activePlayerId
        ? players.findIndex(
            (player) =>
              player.id ===
              activePlayerId,
          )
        : -1;


    const disconnectedPlayers =
      players.filter(
        (player) =>
          player.connectionStatus !==
          'connected',
      );


    const isLocalPlayersTurn =
      Boolean(
        localPlayerId &&
        activePlayerId &&
        localPlayerId ===
          activePlayerId,
      );


    const isMatchPlaying =
      room?.status ===
        'playing' &&
      match?.status ===
        'playing';


    const isPausedForReconnect =
      isMatchPlaying &&
      disconnectedPlayers.length >
        0;


    const canAct =
      multiplayerState.status ===
        'connected' &&
      isMatchPlaying &&
      !isPausedForReconnect &&
      isLocalPlayersTurn &&
      !this.isActionPending;


    return {
      connectionStatus:
        multiplayerState.status,

      roomId:
        room?.id ??
        null,

      roomStatus:
        room?.status ??
        null,

      matchId:
        match?.id ??
        null,

      matchStatus:
        match?.status ??
        null,

      localPlayerId,

      activePlayerId,

      currentPlayerIndex,

      players,

      turn:
        match?.turn ??
        null,

      turnNumber:
        match?.turnNumber ??
        null,

      canBank:
        Boolean(
          canAct &&
          match?.canBank,
        ),

      canAct,

      isActionPending:
        this.isActionPending,

      isLocalPlayersTurn,

      isPausedForReconnect,

      disconnectedPlayers,

      winnerPlayerId:
        match
          ?.winnerPlayerId ??
        null,

      endgame:
        match?.endgame ??
        null,

      lastRoll:
        match?.lastRoll ??
        null,

      lastTurnResult:
        match
          ?.lastTurnResult ??
        null,

      gameError:
        multiplayerState
          .gameError,

      roomError:
        multiplayerState
          .roomError,
    };
  }


  getCurrentPlayer() {
    const state =
      this.getState();


    if (
      state.currentPlayerIndex <
      0
    ) {
      return null;
    }


    return (
      state.players[
        state.currentPlayerIndex
      ] ??
      null
    );
  }


  getLocalPlayer() {
    const state =
      this.getState();


    return (
      state.players.find(
        (player) =>
          player.id ===
          state.localPlayerId,
      ) ??
      null
    );
  }


  /*
   * =====================================================
   * SUBSCRIPTIONS
   * =====================================================
   */

  subscribe(
    listener,
  ) {
    if (
      typeof listener !==
      'function'
    ) {
      throw new TypeError(
        'OnlineGameController.subscribe benötigt eine Funktion.',
      );
    }


    this.listeners.add(
      listener,
    );


    listener(
      this.getState(),
    );


    return () => {
      this.listeners.delete(
        listener,
      );
    };
  }


  /*
   * =====================================================
   * ACTION STATE
   * =====================================================
   */

  canBankCurrentTurn() {
    return this.getState()
      .canBank;
  }


  canPerformGameAction() {
    return this.getState()
      .canAct;
  }


  /*
   * =====================================================
   * ROLL
   * =====================================================
   */

  rollDice() {
    if (
      !this.canPerformGameAction()
    ) {
      return Promise.reject(
        new Error(
          'Aktuell kann nicht gewürfelt werden.',
        ),
      );
    }


    const beforeState =
      this.getState();


    const previousRollSequence =
      beforeState
        .lastRoll
        ?.sequence ??
      0;


    return this.#sendAndWait({
      sendAction:
        () =>
          this.multiplayerClient
            .rollDice(),

      isComplete:
        (state) =>
          (
            state
              .lastRoll
              ?.sequence ??
            0
          ) >
          previousRollSequence,

      buildResult:
        (state) => {
          const lastRoll =
            state.lastRoll;


          const isBust =
            lastRoll?.isBust ===
            true;


          return {
            diceResults:
              (
                lastRoll
                  ?.dice ??
                []
              )
                .map(
                  (die) =>
                    die.value,
                ),

            scoringOptions:
              isBust
                ? []
                : [
                    ...(
                      state.turn
                        ?.scoringOptions ??
                      []
                    ),
                  ],

            straightRerollOption:
              isBust
                ? createEmptyStraightRerollOption()
                : (
                    state.turn
                      ?.straightRerollOption ??
                    createEmptyStraightRerollOption()
                  ),

            isBust,

            isFirstRollBust:
              isBust &&
              lastRoll?.rollNumber ===
                1,

            turnState:
              state.turn,

            lastTurnResult:
              state.lastTurnResult,

            matchFinished:
              state.matchStatus ===
              'finished',

            nextPlayerId:
              state.activePlayerId,

            rollSequence:
              lastRoll?.sequence ??
              null,
          };
        },

      timeoutMessage:
        'Der Server hat den Würfelwurf nicht rechtzeitig bestätigt.',
    });
  }


  /*
   * =====================================================
   * DICE SELECTION
   * =====================================================
   */

  toggleDiceSelection(
    diceIndex,
  ) {
    if (
      !this.canPerformGameAction()
    ) {
      return Promise.reject(
        new Error(
          'Aktuell können keine Würfel ausgewählt werden.',
        ),
      );
    }


    const beforeState =
      this.getState();


    const turn =
      beforeState.turn;


    if (
      !turn ||
      turn.phase !==
        TURN_PHASES.SELECTING
    ) {
      return Promise.reject(
        new Error(
          'Aktuell können keine Würfel ausgewählt werden.',
        ),
      );
    }


    if (
      !Number.isInteger(
        diceIndex,
      ) ||
      diceIndex < 0 ||
      diceIndex >=
        turn.diceResults.length
    ) {
      return Promise.reject(
        new RangeError(
          `Ungültiger Würfelindex: ${diceIndex}`,
        ),
      );
    }


    const currentSelection = [
      ...(
        turn.selectedDiceIndices ??
        []
      ),
    ];


    const isSelected =
      currentSelection.includes(
        diceIndex,
      );


    const nextSelection =
      isSelected
        ? currentSelection.filter(
            (index) =>
              index !==
              diceIndex,
          )
        : [
            ...currentSelection,
            diceIndex,
          ];


    nextSelection.sort(
      (
        left,
        right,
      ) =>
        left - right,
    );


    return this.#sendAndWait({
      /*
       * Nicht nochmals MultiplayerClient.toggleDiceSelection()
       * verwenden.
       *
       * Wir haben die gewünschte Auswahl bereits lokal
       * eindeutig berechnet und schicken exakt diese.
       */
      sendAction:
        () =>
          this.multiplayerClient
            .setDiceSelection(
              nextSelection,
            ),

      isComplete:
        (state) =>
          areSameNumberArrays(
            state.turn
              ?.selectedDiceIndices ??
              [],
            nextSelection,
          ),

      buildResult:
        (state) => ({
          selectedDiceIndices: [
            ...(
              state.turn
                ?.selectedDiceIndices ??
              []
            ),
          ],

          selectionValidation:
            state.turn
              ?.selectionValidation ??
            {
              isValid:
                false,

              selectedDiceIndices:
                [],

              interpretations:
                [],
            },
        }),

      timeoutMessage:
        'Der Server hat die Würfelauswahl nicht bestätigt.',
    });
  }


  /*
   * =====================================================
   * SCORING
   * =====================================================
   */

  applySelectedScoring(
    interpretationId,
  ) {
    if (
      !this.canPerformGameAction()
    ) {
      return Promise.reject(
        new Error(
          'Aktuell kann keine Wertung übernommen werden.',
        ),
      );
    }


    const beforeState =
      this.getState();


    const interpretation =
      beforeState
        .turn
        ?.selectionValidation
        ?.interpretations
        ?.find(
          (candidate) =>
            candidate.id ===
            interpretationId,
        );


    if (!interpretation) {
      return Promise.reject(
        new Error(
          `Unbekannte Wertungsinterpretation: ${interpretationId}`,
        ),
      );
    }


    return this.#sendAndWait({
      sendAction:
        () =>
          this.multiplayerClient
            .applyScoringInterpretation(
              interpretationId,
            ),

      /*
       * Vor dem Anwenden stehen wir in SELECTING.
       *
       * Nach erfolgreicher Wertung wechselt der
       * autoritative Server-State auf READY_TO_ROLL
       * oder bei sechs Einsen auf FINISHED.
       */
      isComplete:
        (state) =>
          state.matchStatus ===
            'finished' ||
          state.turn?.phase !==
            TURN_PHASES.SELECTING,

      buildResult:
        (state) => ({
          appliedScore:
            interpretation.score,

          isHotDice:
            interpretation
              .isHotDice ===
            true,

          isInstantWin:
            interpretation
              .isInstantWin ===
            true,

          interpretation,

          turnState:
            state.turn,

          matchFinished:
            state.matchStatus ===
            'finished',

          winnerPlayerId:
            state.winnerPlayerId,
        }),

      timeoutMessage:
        'Der Server hat die Wertung nicht bestätigt.',
    });
  }


  /*
   * =====================================================
   * STRAẞEN-NACHWURF
   * =====================================================
   */

  useStraightReroll() {
    if (
      !this.canPerformGameAction()
    ) {
      return Promise.reject(
        new Error(
          'Aktuell ist kein Straßen-Nachwurf möglich.',
        ),
      );
    }


    const beforeState =
      this.getState();


    const straightRerollOption =
      beforeState.turn
        ?.straightRerollOption;


    if (
      !straightRerollOption
        ?.isAvailable
    ) {
      return Promise.reject(
        new Error(
          'Für den aktuellen Wurf ist kein Straßen-Nachwurf möglich.',
        ),
      );
    }


    return this.#sendAndWait({
      sendAction:
        () =>
          this.multiplayerClient
            .useStraightReroll(),

      isComplete:
        (state) =>
          state.turn?.phase ===
            TURN_PHASES.READY_TO_ROLL &&
          state.turn
            ?.mustRollAfterStraightReroll ===
            true,

      buildResult:
        (state) => ({
          turnState:
            state.turn,

          straightRerollOption,
        }),

      timeoutMessage:
        'Der Server hat den Straßen-Nachwurf nicht bestätigt.',
    });
  }


  /*
   * =====================================================
   * BANK / SICHERN
   * =====================================================
   */

  bankCurrentTurn() {
    if (
      !this.canBankCurrentTurn()
    ) {
      return Promise.reject(
        new Error(
          'Der aktuelle Zug kann nicht gesichert werden.',
        ),
      );
    }


    const beforeState =
      this.getState();


    const localPlayerId =
      beforeState.localPlayerId;


    const previousResultSignature =
      JSON.stringify(
        beforeState
          .lastTurnResult ??
        null,
      );


    return this.#sendAndWait({
      sendAction:
        () =>
          this.multiplayerClient
            .bankTurn(),

      isComplete:
        (state) => {
          const result =
            state.lastTurnResult;


          if (
            result?.type !==
              'bank' ||
            result.playerId !==
              localPlayerId
          ) {
            return false;
          }


          return (
            JSON.stringify(
              result,
            ) !==
            previousResultSignature
          );
        },

      buildResult:
        (state) => {
          const result =
            state.lastTurnResult;


          const bankedPlayer =
            state.players.find(
              (player) =>
                player.id ===
                result.playerId,
            ) ??
            null;


          const nextPlayer =
            state.players.find(
              (player) =>
                player.id ===
                state.activePlayerId,
            ) ??
            null;


          return {
            bankedScore:
              result.bankedScore,

            totalScore:
              result.totalScore,

            lastBankedScore:
              bankedPlayer
                ?.lastBankedScore ??
              result.bankedScore,

            reachedTargetScore:
              result
                .reachedTargetScore ===
              true,

            finalRoundStarted:
              result
                .finalRoundStarted ===
              true,

            isFinalRound:
              state.endgame
                ?.phase ===
              ENDGAME_PHASES.FINAL_ROUND,

            matchFinished:
              state.matchStatus ===
                'finished',

            winnerPlayerId:
              state.winnerPlayerId,

            tiedPlayerIds: [
              ...(
                state.endgame
                  ?.tiedPlayerIds ??
                []
              ),
            ],

            nextPlayerId:
              state.activePlayerId,

            bankedPlayer,

            nextPlayer,

            turnState:
              state.turn,
          };
        },

      timeoutMessage:
        'Der Server hat das Sichern nicht bestätigt.',
    });
  }
    /*
    * =====================================================
    * SERVERSEITIG BEREITS ABGESCHLOSSENE TURN-EVENTS
    * =====================================================
    *
    * Offline führt GameSessionController diese Änderungen
    * selbst aus.
    *
    * Online hat OnlineMatch den autoritativen State bereits
    * verändert. Diese Methoden übersetzen ihn nur noch in
    * die Ergebnisform, die GameScreen erwartet.
    */

    finishBustedTurn({
    isFirstRollBust =
        false,
    } = {}) {
    const state =
        this.getState();


    const result =
        state.lastTurnResult;


    if (
        result?.type !==
        'bust'
    ) {
        throw new Error(
        'Es liegt kein serverseitiger Fehlwurf vor.',
        );
    }


    const bustedPlayer =
        state.players.find(
        (player) =>
            player.id ===
            result.playerId,
        ) ??
        null;


    const nextPlayer =
        state.players.find(
        (player) =>
            player.id ===
            state.activePlayerId,
        ) ??
        null;


    /*
    * Der Server ist maßgeblich.
    *
    * isFirstRollBust kommt zwar vom Roll-Ergebnis des
    * Clients, für die tatsächliche Strafe verwenden wir
    * ausschließlich firstRollPenalty aus dem Server-State.
    */
    return {
        matchFinished:
        state.matchStatus ===
        'finished',

        penaltyApplied:
        Number(
            result.firstRollPenalty ??
            0,
        ),

        isFirstRollBust:
        Boolean(
            isFirstRollBust,
        ),

        bustedPlayer,

        nextPlayer,

        turnState:
        state.turn,

        winnerPlayerId:
        state.winnerPlayerId,
    };
    }


    finishInstantWin({
    instantWinScore =
        0,
    } = {}) {
    const state =
        this.getState();


    const result =
        state.lastTurnResult;


    if (
        state.matchStatus !==
        'finished' ||
        result?.type !==
        'instant-win'
    ) {
        throw new Error(
        'Es liegt kein serverseitiger Sofortsieg vor.',
        );
    }


    return {
        matchFinished:
        true,

        winnerPlayerId:
        state.winnerPlayerId,

        instantWinScore:
        Number(
            result.appliedScore ??
            instantWinScore ??
            0,
        ),

        turnState:
        state.turn,
    };
    }

  /*
   * =====================================================
   * SERVER ACTION → AUTORITATIVER STATE
   * =====================================================
   */

  #sendAndWait({
    sendAction,
    isComplete,
    buildResult,
    timeoutMessage,
  }) {
    if (
      this.isActionPending
    ) {
      return Promise.reject(
        new Error(
          'Es läuft bereits eine Serveraktion.',
        ),
      );
    }


    this.isActionPending =
      true;


    this.#emit();


    return new Promise(
      (
        resolve,
        reject,
      ) => {
        let actionSent =
          false;


        let settled =
          false;


        let timeoutId =
          null;


        let unsubscribe =
          null;


        const cleanup =
          () => {
            if (timeoutId) {
              clearTimeout(
                timeoutId,
              );
            }


            unsubscribe?.();
          };


        const succeed =
          (result) => {
            if (settled) {
              return;
            }


            settled =
              true;


            cleanup();


            resolve(
              result,
            );
          };


        const fail =
          (error) => {
            if (settled) {
              return;
            }


            settled =
              true;


            cleanup();


            reject(
              error,
            );
          };


        const handleState =
          () => {
            /*
             * subscribe() liefert sofort den aktuellen
             * Zustand. Vor dem eigentlichen Emit dürfen
             * wir diesen alten State noch nicht auswerten.
             */
            if (
              !actionSent ||
              settled
            ) {
              return;
            }


            const state =
              this.getState();


            if (
              state.gameError
            ) {
              fail(
                new Error(
                  state
                    .gameError
                    .message ??
                  'Die Serveraktion ist fehlgeschlagen.',
                ),
              );


              return;
            }


            let complete =
              false;


            try {
              complete =
                isComplete(
                  state,
                );
            } catch (
              error
            ) {
              fail(
                error,
              );


              return;
            }


            if (!complete) {
              return;
            }


            try {
              succeed(
                buildResult(
                  state,
                ),
              );
            } catch (
              error
            ) {
              fail(
                error,
              );
            }
          };


        unsubscribe =
          this.multiplayerClient
            .subscribe(
              handleState,
            );


        let sent =
          false;


        try {
          sent =
            sendAction();
        } catch (
          error
        ) {
          actionSent =
            true;


          fail(
            error,
          );


          return;
        }


        actionSent =
          true;


        if (!sent) {
          fail(
            new Error(
              'Die Serveraktion konnte nicht gesendet werden.',
            ),
          );


          return;
        }


        timeoutId =
          setTimeout(
            () => {
              fail(
                new Error(
                  timeoutMessage,
                ),
              );
            },
            SERVER_ACTION_TIMEOUT_MS,
          );


        /*
         * Sicherheitsprüfung für den Fall, dass sich der
         * State während sendAction() bereits geändert hat.
         */
        handleState();
      },
    )
      .finally(
        () => {
          this.isActionPending =
            false;


          this.#emit();
        },
      );
  }


  /*
   * =====================================================
   * CLEANUP
   * =====================================================
   */

  destroy() {
    this.unsubscribeMultiplayer?.();


    this.unsubscribeMultiplayer =
      null;


    this.listeners.clear();
  }


  #emit() {
    const state =
      this.getState();


    for (
      const listener
      of this.listeners
    ) {
      listener(
        state,
      );
    }
  }
}