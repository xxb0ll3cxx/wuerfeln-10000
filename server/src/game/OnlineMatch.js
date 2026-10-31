import {
  randomInt,
  randomUUID,
} from 'node:crypto';

import {
  rollDice,
} from '../../../shared/core/dice/rollDice.js';

import {
  ScoringEngine,
} from '../../../shared/core/scoring/ScoringEngine.js';

import {
  validateScoringSelection,
} from '../../../shared/core/scoring/validateScoringSelection.js';

import {
  applyScoringSelection,
} from '../../../shared/core/turn/applyScoringSelection.js';

import {
  detectBust,
} from '../../../shared/core/turn/detectBust.js';

import {
  detectHotDice,
} from '../../../shared/core/turn/detectHotDice.js';

import {
  detectStraightReroll,
} from '../../../shared/core/turn/detectStraightReroll.js';

import {
  applyStraightReroll,
} from '../../../shared/core/turn/applyStraightReroll.js';

import {
  canBankTurn,
} from '../../../shared/core/turn/canBankTurn.js';

import {
  TURN_PHASES,
} from '../../../shared/core/turn/TurnRules.js';

import {
  GAME_RULES,
} from '../../../shared/config/gameRules.js';
import {
  createInitialEndgameState,
  ENDGAME_PHASES,
  WIN_REASONS,
} from '../../../shared/core/endgame/EndgameRules.js';

import {
  createFinalRound,
  completeFinalRoundTurn,
} from '../../../shared/core/endgame/FinalRound.js';

import {
  determineWinner,
} from '../../../shared/core/endgame/determineWinner.js';

const scoringEngine =
  new ScoringEngine();


function createTurnDice() {
  return Array.from(
    {
      length:
        GAME_RULES.DICE_COUNT,
    },

    (
      _,
      index,
    ) => ({
      id:
        index + 1,

      value:
        null,

      state:
        'active',
    }),
  );
}


function createEmptyStraightRerollOption() {
  return {
    isAvailable:
      false,

    matches:
      [],
  };
}


function createEmptySelectionValidation() {
  return {
    isValid:
      false,

    reason:
      'no-selection',

    selectedDiceIndices:
      [],

    interpretations:
      [],
  };
}


function cloneScoringOption(
  option,
) {
  return {
    ...option,

    diceIndices: [
      ...option.diceIndices,
    ],

    diceValues: [
      ...option.diceValues,
    ],
  };
}


function cloneInterpretation(
  interpretation,
) {
  return {
    ...interpretation,

    scoringOptions:
      interpretation
        .scoringOptions
        .map(
          cloneScoringOption,
        ),

    scoredDiceIndices: [
      ...interpretation
        .scoredDiceIndices,
    ],

    removedDiceIndices: [
      ...interpretation
        .removedDiceIndices,
    ],

    remainingDiceIndices: [
      ...interpretation
        .remainingDiceIndices,
    ],
  };
}


export class OnlineMatch {
  constructor({
    players,
    settings,
  }) {
    if (
      !Array.isArray(
        players,
      ) ||
      players.length !== 2
    ) {
      throw new Error(
        'Ein Online-Match benötigt genau zwei Spieler.',
      );
    }


    this.id =
      randomUUID();


    this.status =
      'playing';


    this.startedAt =
      Date.now();


    /*
     * Lobby-Einstellungen werden beim Matchstart kopiert.
     *
     * Änderungen an der Lobby dürfen dadurch
     * niemals ein laufendes Match verändern.
     */
    this.settings = {
      gameModeId:
        settings.gameModeId,

      targetScore:
        settings.targetScore,

      wagerCoins:
        settings.wagerCoins,
    };


    /*
     * Feste Zugreihenfolge.
     */
    this.turnOrder =
      players.map(
        (player) =>
          player.id,
      );


    this.turnNumber =
      1;


    this.activePlayerId =
      this.turnOrder[0];


    /*
     * Matchweit fortlaufende Wurfnummer.
     *
     * Sie wird nicht pro Zug zurückgesetzt.
     * Der Client kann damit zuverlässig erkennen,
     * ob ein neuer Serverwurf angekommen ist.
     */
    this.rollSequence =
      0;


    this.winnerPlayerId =
      null;

      /*
      * =====================================================
      * ENDGAME
      * =====================================================
      *
      * Der Endgame-State muss bereits beim Start
      * des Matches existieren.
      *
      * Er wird später sowohl beim Banken als auch
      * bei Bust und Sofortsieg weitergeführt.
      */
      this.endgame =
        createInitialEndgameState();
    /*
     * Letzter Serverwurf.
     *
     * Bleibt auch nach einem automatischen
     * Spielerwechsel durch Bust erhalten.
     */
    this.lastRoll =
      null;


    /*
     * Letztes Zugergebnis:
     *
     * z. B.
     * - bust
     * - instant-win
     *
     * Später zusätzlich:
     * - bank
     */
    this.lastTurnResult =
      null;


    /*
     * Der Online-Turn orientiert sich bewusst
     * am bestehenden lokalen Turn-State.
     */
    this.turn =
      this.#createTurnState();


    this.playerStates =
      players.map(
        (player) => ({
          playerId:
            player.id,

          totalScore:
            0,

          /*
           * Wird beim späteren echten Banken gesetzt.
           *
           * Bereits vorbereitet für die
           * Erstwurf-Bust-Sonderregel.
           */
          lastBankedScore:
            0,
        }),
      );
  }


  /*
   * =====================================================
   * TURN STATE
   * =====================================================
   */

  #createTurnState() {
    return {
      /*
       * Dieselben Turn-Phasen wie im lokalen Spiel.
       */
      phase:
        TURN_PHASES.READY_TO_ROLL,


      /*
       * Anzahl der Würfe innerhalb dieses Zuges.
       */
      rollNumber:
        0,


      /*
       * Noch nicht gesicherte Punkte dieses Zuges.
       */
      turnScore:
        0,


      /*
       * Anzahl aktuell aktiver Würfel.
       */
      activeDiceCount:
        GAME_RULES.DICE_COUNT,


      /*
       * Werte des aktuell letzten Wurfs.
       *
       * Genau dieses Format erwartet dein
       * vorhandener ScoringEngine.
       */
      diceResults:
        [],


      /*
       * Vom bestehenden ScoringEngine erkannte
       * Wertungsmöglichkeiten.
       */
      scoringOptions:
        [],


      /*
       * Auswahl des Spielers innerhalb
       * des aktuellen diceResults-Arrays.
       */
      selectedDiceIndices:
        [],


      /*
       * Bereits herausgelegte Würfelwerte.
       *
       * Wichtig für die Straßen-Nachwurf-Sonderregel.
       */
      removedDiceValues:
        [],


      /*
       * Nach Hot Dice darf nicht sofort gebankt werden.
       */
      mustScoreAfterHotDice:
        false,


      /*
       * Nach gewähltetem Straßen-Nachwurf
       * muss tatsächlich erneut gewürfelt werden.
       */
      mustRollAfterStraightReroll:
        false,


      /*
       * Sechs Einsen.
       */
      isInstantWin:
        false,


      /*
       * =================================================
       * ONLINE-ERGÄNZUNGEN
       * =================================================
       */


      /*
       * Matchweit eindeutige Wurfnummer.
       */
      rollSequence:
        this.rollSequence,


      /*
       * IDs der beim letzten Wurf tatsächlich
       * gewürfelten Würfel.
       */
      rolledDiceIds:
        [],


      /*
       * Zuordnung:
       *
       * diceResults[index]
       * gehört zu
       * rollDiceIds[index].
       *
       * Der bestehende Scoring-Core kann dadurch
       * weiterhin mit Indizes arbeiten.
       */
      rollDiceIds:
        [],


      /*
       * Ergebnis der Straßen-Sonderregel.
       */
      straightRerollOption:
        createEmptyStraightRerollOption(),


      /*
       * Serverseitig validierte aktuelle Auswahl.
       */
      selectionValidation:
        createEmptySelectionValidation(),


      /*
       * Stabile Serverrepräsentation der sechs Würfel.
       */
      dice:
        createTurnDice(),
    };
  }


  /*
   * =====================================================
   * PLAYER / TURN
   * =====================================================
   */

  isActivePlayer(
    playerId,
  ) {
    return (
      this.activePlayerId ===
      playerId
    );
  }


  #getPlayerState(
    playerId,
  ) {
    return (
      this.playerStates.find(
        (playerState) =>
          playerState.playerId ===
          playerId,
      ) ??
      null
    );
  }


  /*
   * =====================================================
   * ROLL
   * =====================================================
   */

  roll(
    playerId,
  ) {
    if (
      this.status !==
      'playing'
    ) {
      throw new Error(
        'Das Match läuft nicht.',
      );
    }


    if (
      !this.isActivePlayer(
        playerId,
      )
    ) {
      throw new Error(
        'Du bist aktuell nicht am Zug.',
      );
    }


    if (
      this.turn.phase !==
      TURN_PHASES.READY_TO_ROLL
    ) {
      throw new Error(
        'Aktuell darf nicht gewürfelt werden.',
      );
    }


    const activeDice =
      this.turn.dice.filter(
        (die) =>
          die.state ===
          'active',
      );


    /*
     * Der fachliche Turn-State und die
     * Server-Würfel müssen identisch sein.
     */
    if (
      activeDice.length !==
      this.turn.activeDiceCount
    ) {
      throw new Error(
        'Online-Würfelzustand und Turn-State sind nicht synchron.',
      );
    }


    if (
      activeDice.length === 0
    ) {
      throw new Error(
        'Es sind keine aktiven Würfel vorhanden.',
      );
    }


    /*
     * Ein altes Turn-Ergebnis wird beim
     * nächsten echten Wurf nicht mehr benötigt.
     */
    this.lastTurnResult =
      null;


    /*
     * =====================================================
     * SERVERSEITIG WÜRFELN
     * =====================================================
     *
     * Der Browser sendet keine Würfelwerte.
     */

    const values =
      rollDice(
        activeDice.length,

        () =>
          randomInt(
            1,
            7,
          ),
      );


    activeDice.forEach(
      (
        die,
        index,
      ) => {
        die.value =
          values[index];
      },
    );


    const diceResults = [
      ...values,
    ];


    /*
     * =====================================================
     * NORMAL SCORING
     * =====================================================
     *
     * Derselbe Engine wie im lokalen Spiel.
     */

    const scoringOptions =
      scoringEngine
        .getScoringOptions(
          diceResults,
        );


    /*
     * =====================================================
     * STRAIGHT REROLL
     * =====================================================
     *
     * Getrennte Prüfung, genau wie im
     * bestehenden VirtualTurnController.
     */

    const straightRerollOption =
      detectStraightReroll({
        diceResults,

        removedDiceValues:
          this.turn
            .removedDiceValues,
      });


    /*
     * Ein Wurf ohne normale Wertung ist
     * nur dann ein Bust, wenn auch kein
     * Straßen-Nachwurf möglich ist.
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


    /*
     * =====================================================
     * WURFSTATE
     * =====================================================
     */

    this.rollSequence +=
      1;


    const rolledDiceIds =
      activeDice.map(
        (die) =>
          die.id,
      );


    this.turn = {
      ...this.turn,

      phase:
        isBust
          ? TURN_PHASES.BUSTED
          : TURN_PHASES.SELECTING,

      rollNumber:
        this.turn.rollNumber +
        1,

      rollSequence:
        this.rollSequence,

      diceResults,

      scoringOptions,

      selectedDiceIndices:
        [],

      rollDiceIds:
        rolledDiceIds,

      rolledDiceIds,

      straightRerollOption,

      selectionValidation:
        createEmptySelectionValidation(),

      /*
       * Falls dieser Wurf durch einen zuvor
       * gewählten Straßen-Nachwurf erzwungen wurde,
       * wurde die Würfelpflicht jetzt erfüllt.
       */
      mustRollAfterStraightReroll:
        false,
    };


    /*
     * Wurf für Animation / UI separat merken.
     */
    this.lastRoll = {
      sequence:
        this.rollSequence,

      playerId,

      turnNumber:
        this.turnNumber,

      rollNumber:
        this.turn.rollNumber,

      isBust,

      dice:
        activeDice.map(
          (die) => ({
            id:
              die.id,

            value:
              die.value,
          }),
        ),
    };


    /*
     * =====================================================
     * BUST
     * =====================================================
     */

    if (
      isBust
    ) {
      this.#handleBust(
        playerId,
      );


      return {
        values: [
          ...values,
        ],

        isBust:
          true,

        scoringOptions:
          [],

        straightRerollOption,
      };
    }


    return {
      values: [
        ...values,
      ],

      isBust:
        false,

      scoringOptions,

      straightRerollOption,
    };
  }


  /*
   * =====================================================
   * DICE SELECTION
   * =====================================================
   */

  setSelectedDiceIndices(
    playerId,
    selectedDiceIndices,
  ) {
    if (
      this.status !==
      'playing'
    ) {
      throw new Error(
        'Das Match läuft nicht.',
      );
    }


    if (
      !this.isActivePlayer(
        playerId,
      )
    ) {
      throw new Error(
        'Du bist aktuell nicht am Zug.',
      );
    }


    if (
      this.turn.phase !==
      TURN_PHASES.SELECTING
    ) {
      throw new Error(
        'Aktuell können keine Würfel ausgewählt werden.',
      );
    }


    /*
     * validateScoringSelection prüft unter anderem:
     *
     * - gültige Indizes
     * - vollständige Scoring-Abdeckung
     * - mehrere Interpretationen
     * - Zwei-5er-Sonderregel
     */

    const validation =
      this.#validateSelection(
        selectedDiceIndices,
      );


    this.turn.selectedDiceIndices = [
      ...validation
        .selectedDiceIndices,
    ];


    this.turn.selectionValidation =
      validation;


    return validation;
  }


  /*
   * =====================================================
   * SCORING AUSWAHL ANWENDEN
   * =====================================================
   */

  applySelectedScoring(
    playerId,
    interpretationId,
  ) {
    if (
      this.status !==
      'playing'
    ) {
      throw new Error(
        'Das Match läuft nicht.',
      );
    }


    if (
      !this.isActivePlayer(
        playerId,
      )
    ) {
      throw new Error(
        'Du bist aktuell nicht am Zug.',
      );
    }


    if (
      this.turn.phase !==
      TURN_PHASES.SELECTING
    ) {
      throw new Error(
        'Aktuell kann keine Wertung übernommen werden.',
      );
    }


    if (
      typeof interpretationId !==
        'string' ||
      !interpretationId
    ) {
      throw new Error(
        'Eine Wertungsinterpretation fehlt.',
      );
    }


    /*
     * Der Server validiert erneut.
     *
     * Eine vom Browser behauptete Punktzahl
     * wird niemals übernommen.
     */

    const validation =
      this.#validateCurrentSelection();


    if (
      !validation.isValid
    ) {
      throw new Error(
        'Die aktuelle Würfelauswahl ist nicht wertbar.',
      );
    }


    const interpretation =
      validation
        .interpretations
        .find(
          (candidate) =>
            candidate.id ===
            interpretationId,
        );


    if (!interpretation) {
      throw new Error(
        'Unbekannte Wertungsinterpretation.',
      );
    }


    /*
     * =====================================================
     * INDEX → SERVER-WÜRFEL-ID
     * =====================================================
     *
     * Der lokale Scoring-Core benutzt Würfelindizes.
     *
     * Online müssen wir daraus die stabilen IDs
     * der Serverwürfel ermitteln.
     */

    const removedDiceIds =
      interpretation
        .removedDiceIndices
        .map(
          (diceIndex) =>
            this.turn
              .rollDiceIds[
                diceIndex
              ],
        );


    if (
      removedDiceIds.some(
        (diceId) =>
          diceId ===
          undefined,
      )
    ) {
      throw new Error(
        'Würfelauswahl konnte nicht auf Server-Würfel abgebildet werden.',
      );
    }


    const previousDice =
      this.turn.dice;


    /*
     * =====================================================
     * VORHANDENEN TURN-CORE VERWENDEN
     * =====================================================
     *
     * Dieser behandelt bereits:
     *
     * - TurnScore
     * - normale herausgelegte Würfel
     * - Zwei-5er-Sonderregel
     * - Hot Dice
     * - kleine-Straße-Hot-Dice-Sonderregel
     * - mustScoreAfterHotDice
     * - sechs Einsen / Sofortsieg
     */

    const result =
      applyScoringSelection({
        turnState:
          this.turn,

        interpretation,
      });


    let nextDice;


    /*
     * =====================================================
     * HOT DICE
     * =====================================================
     */

    if (
      result.isHotDice
    ) {
      /*
       * Alle sechs Würfel werden wieder aktiv.
       */
      nextDice =
        previousDice.map(
          (die) => ({
            ...die,

            state:
              'active',

            value:
              null,
          }),
        );
    }


    /*
     * =====================================================
     * SOFORTSIEG
     * =====================================================
     */

    else if (
      result.isInstantWin
    ) {
      /*
       * Letzten sichtbaren Wurf behalten.
       *
       * Die UI kann ihn dadurch noch animieren
       * beziehungsweise darstellen.
       */
      nextDice =
        previousDice.map(
          (die) => ({
            ...die,
          }),
        );
    }


    /*
     * =====================================================
     * NORMALE WERTUNG
     * =====================================================
     */

    else {
      const removedIdSet =
        new Set(
          removedDiceIds,
        );


      nextDice =
        previousDice.map(
          (die) => {
            /*
             * Bereits in einem vorherigen Wurf
             * herausgelegte Würfel bleiben draußen.
             */
            if (
              die.state ===
              'removed'
            ) {
              return {
                ...die,
              };
            }


            /*
             * Neu gewerteter Würfel.
             */
            if (
              removedIdSet.has(
                die.id,
              )
            ) {
              return {
                ...die,

                state:
                  'removed',
              };
            }


            /*
             * Restliche Würfel bleiben aktiv.
             *
             * Ihr alter Wert wird entfernt,
             * weil sie beim nächsten Serverwurf
             * neu gewürfelt werden.
             */
            return {
              ...die,

              state:
                'active',

              value:
                null,
            };
          },
        );
    }


    /*
     * =====================================================
     * NEUEN TURN-STATE ÜBERNEHMEN
     * =====================================================
     */

    this.turn = {
      ...result.turnState,

      dice:
        nextDice,

      rollSequence:
        this.rollSequence,

      rollDiceIds:
        [],

      rolledDiceIds:
        [],

      straightRerollOption:
        createEmptyStraightRerollOption(),

      selectionValidation:
        createEmptySelectionValidation(),
    };


    /*
     * =====================================================
     * SOFORTSIEG ABSCHLIESSEN
     * =====================================================
     */

if (
  result.isInstantWin
) {
  const playerState =
    this.#getPlayerState(
      playerId,
    );


  if (!playerState) {
    throw new Error(
      'Player-State fehlt.',
    );
  }


  playerState.totalScore +=
    result.appliedScore;


  this.status =
    'finished';


  this.winnerPlayerId =
    playerId;


  this.activePlayerId =
    null;


  this.endgame = {
    ...this.endgame,

    phase:
      ENDGAME_PHASES.FINISHED,

    pendingPlayerIds:
      [],

    winnerId:
      playerId,

    tiedPlayerIds:
      [],

    winReason:
      WIN_REASONS.SIX_ONES,
  };


  this.turn = {
    ...this.turn,

    phase:
      TURN_PHASES.FINISHED,
  };


  this.lastTurnResult = {
    type:
      'instant-win',

    playerId,

    turnNumber:
      this.turnNumber,

    appliedScore:
      result.appliedScore,

    rollSequence:
      this.rollSequence,
  };
}


    return {
      ...result,

      interpretation,

      removedDiceIds,
    };
  }


  /*
   * =====================================================
   * STRASSEN-NACHWURF
   * =====================================================
   */

  useStraightReroll(
    playerId,
  ) {
    if (
      this.status !==
      'playing'
    ) {
      throw new Error(
        'Das Match läuft nicht.',
      );
    }


    if (
      !this.isActivePlayer(
        playerId,
      )
    ) {
      throw new Error(
        'Du bist aktuell nicht am Zug.',
      );
    }


    if (
      this.turn.phase !==
      TURN_PHASES.SELECTING
    ) {
      throw new Error(
        'Aktuell ist kein Straßen-Nachwurf möglich.',
      );
    }


    /*
     * Wieder serverseitig prüfen.
     *
     * Wir vertrauen nicht dem Wert,
     * den der Browser vorher angezeigt hat.
     */

    const option =
      detectStraightReroll({
        diceResults:
          this.turn
            .diceResults,

        removedDiceValues:
          this.turn
            .removedDiceValues,
      });


    if (
      !option.isAvailable
    ) {
      throw new Error(
        'Für den aktuellen Wurf ist kein Straßen-Nachwurf möglich.',
      );
    }


    /*
     * Bestehende lokale Regel anwenden.
     */
    const nextTurn =
      applyStraightReroll(
        this.turn,
      );


    this.turn = {
      ...nextTurn,

      rollSequence:
        this.rollSequence,

      rollDiceIds:
        [],

      rolledDiceIds:
        [],

      straightRerollOption:
        createEmptyStraightRerollOption(),

      selectionValidation:
        createEmptySelectionValidation(),

      /*
       * Nur aktuell aktive Würfel
       * werden beim nächsten Roll neu gewürfelt.
       *
       * Bereits herausgelegte Würfel bleiben draußen.
       */
      dice:
        this.turn.dice.map(
          (die) =>
            die.state ===
            'active'
              ? {
                  ...die,

                  value:
                    null,
                }
              : {
                  ...die,
                },
        ),
    };


    return option;
  }
bank(
  playerId,
) {
  if (
    this.status !==
    'playing'
  ) {
    throw new Error(
      'Das Match läuft nicht.',
    );
  }


  if (
    !this.isActivePlayer(
      playerId,
    )
  ) {
    throw new Error(
      'Du bist aktuell nicht am Zug.',
    );
  }


  if (
    !canBankTurn(
      this.turn,
    )
  ) {
    throw new Error(
      'Der aktuelle Zug darf noch nicht gesichert werden.',
    );
  }


  const playerState =
    this.#getPlayerState(
      playerId,
    );


  if (!playerState) {
    throw new Error(
      'Player-State konnte nicht gefunden werden.',
    );
  }


  const bankedScore =
    this.turn.turnScore;


  if (
    !Number.isInteger(
      bankedScore,
    ) ||
    bankedScore <= 0
  ) {
    throw new Error(
      'Ungültiger zu sichernder Punktestand.',
    );
  }


  /*
   * =====================================================
   * PUNKTE SICHERN
   * =====================================================
   */

  playerState.totalScore +=
    bankedScore;


  playerState.lastBankedScore =
    bankedScore;


  const reachedTargetScore =
    playerState.totalScore >=
    this.settings.targetScore;


  /*
   * =====================================================
   * ENDGAME AUFLÖSEN
   * =====================================================
   *
   * Nur ein erfolgreich gesicherter Zug darf
   * im normalen Spiel erstmals die Nachziehrunde
   * auslösen.
   */

  const endgameResolution =
    this.#resolveCompletedTurn({
      completedPlayerId:
        playerId,

      canStartFinalRound:
        true,
    });


  this.lastTurnResult = {
    type:
      'bank',

    playerId,

    turnNumber:
      this.turnNumber,

    bankedScore,

    totalScore:
      playerState.totalScore,

    reachedTargetScore,

    finalRoundStarted:
      endgameResolution
        .finalRoundStarted,

    matchFinished:
      endgameResolution
        .matchFinished,

    rollSequence:
      this.rollSequence,
  };


  this.#applyEndgameResolution(
    endgameResolution,
  );


  return {
    bankedScore,

    totalScore:
      playerState.totalScore,

    lastBankedScore:
      playerState.lastBankedScore,

    reachedTargetScore,

    finalRoundStarted:
      endgameResolution
        .finalRoundStarted,

    isFinalRound:
      this.endgame.phase ===
      ENDGAME_PHASES.FINAL_ROUND,

    matchFinished:
      endgameResolution
        .matchFinished,

    winnerPlayerId:
      this.winnerPlayerId,

    tiedPlayerIds: [
      ...(
        this.endgame
          .tiedPlayerIds ??
        []
      ),
    ],

    nextPlayerId:
      this.activePlayerId,
  };
}


  /*
   * =====================================================
   * SELECTION VALIDATION
   * =====================================================
   */

  #validateCurrentSelection() {
    return this.#validateSelection(
      this.turn
        .selectedDiceIndices,
    );
  }


  #validateSelection(
    selectedDiceIndices,
  ) {
    const validation =
      validateScoringSelection({
        dice:
          this.turn
            .diceResults,

        selectedDiceIndices,

        scoringOptions:
          this.turn
            .scoringOptions,
      });


    /*
     * Zusätzlich zur vorhandenen
     * Scoring-Interpretation berechnen wir
     * für die UI direkt, ob diese Interpretation
     * Hot Dice erzeugen würde.
     */

    return {
      ...validation,

      interpretations:
        validation
          .interpretations
          .map(
            (
              interpretation,
            ) => ({
              ...interpretation,

              isHotDice:
                !interpretation
                  .isInstantWin &&
                detectHotDice(
                  this.turn
                    .activeDiceCount,

                  interpretation
                    .removedDiceIndices,

                  interpretation
                    .scoringOptions,
                ),
            }),
          ),
    };
  }


  /*
   * =====================================================
   * BUST
   * =====================================================
   */

  #handleBust(
  playerId,
) {
  const playerState =
    this.#getPlayerState(
      playerId,
    );


  if (!playerState) {
    throw new Error(
      'Player-State konnte nicht gefunden werden.',
    );
  }


  const lostTurnScore =
    this.turn.turnScore;


  /*
   * =====================================================
   * ERSTWURF-STRAFE
   * =====================================================
   */

  const firstRollPenalty =
    this.turn.rollNumber === 1
      ? playerState
          .lastBankedScore
      : 0;


  if (
    firstRollPenalty >
    0
  ) {
    playerState.totalScore =
      Math.max(
        0,

        playerState.totalScore -
        firstRollPenalty,
      );


    playerState.lastBankedScore =
      0;
  }


  /*
   * =====================================================
   * ENDGAME
   * =====================================================
   *
   * Ein Bust darf die Nachziehrunde beenden,
   * aber niemals im normalen Spiel erstmals
   * eine Nachziehrunde starten.
   */

  const endgameResolution =
    this.#resolveCompletedTurn({
      completedPlayerId:
        playerId,

      canStartFinalRound:
        false,
    });


  this.lastTurnResult = {
    type:
      'bust',

    playerId,

    turnNumber:
      this.turnNumber,

    lostTurnScore,

    firstRollPenalty,

    matchFinished:
      endgameResolution
        .matchFinished,

    rollSequence:
      this.rollSequence,
  };


  this.#applyEndgameResolution(
    endgameResolution,
  );
}
#getEndgamePlayers() {
  return this.turnOrder.map(
    (
      playerId,
    ) => {
      const playerState =
        this.#getPlayerState(
          playerId,
        );


      if (!playerState) {
        throw new Error(
          `Player-State fehlt: ${playerId}`,
        );
      }


      return {
        id:
          playerId,

        totalScore:
          playerState.totalScore,

        lastBankedScore:
          playerState
            .lastBankedScore,
      };
    },
  );
}
#resolveCompletedTurn({
  completedPlayerId,
  canStartFinalRound,
}) {
  const players =
    this.#getEndgamePlayers();


  const completedPlayerIndex =
    players.findIndex(
      (player) =>
        player.id ===
        completedPlayerId,
    );


  if (
    completedPlayerIndex === -1
  ) {
    throw new Error(
      'Abgeschlossener Spieler wurde nicht gefunden.',
    );
  }


  const completedPlayer =
    players[
      completedPlayerIndex
    ];


  if (
    this.endgame.phase ===
    ENDGAME_PHASES.FINISHED
  ) {
    throw new Error(
      'Die Partie ist bereits beendet.',
    );
  }


  /*
   * =====================================================
   * NORMALER SPIELBETRIEB
   * =====================================================
   */

  if (
    this.endgame.phase ===
    ENDGAME_PHASES.ACTIVE
  ) {
    /*
     * Online wichtig:
     *
     * Nicht fest auf 10.000 prüfen,
     * sondern auf die Lobby-Einstellung.
     */
    const reachedTarget =
      completedPlayer.totalScore >=
      this.settings.targetScore;


    if (
      canStartFinalRound &&
      reachedTarget
    ) {
      const finalRound =
        createFinalRound({
          players,

          triggerPlayerIndex:
            completedPlayerIndex,
        });


      /*
       * Normalerweise gibt es online zwei Spieler.
       *
       * Trotzdem bleibt der Code allgemein.
       */
      if (
        finalRound
          .pendingPlayerIds
          .length === 0
      ) {
        return this.#finishByHighestScore({
          players,

          endgame: {
            ...this.endgame,

            triggerPlayerId:
              finalRound
                .triggerPlayerId,
          },
        });
      }


      return {
        endgame: {
          ...this.endgame,

          phase:
            ENDGAME_PHASES
              .FINAL_ROUND,

          triggerPlayerId:
            finalRound
              .triggerPlayerId,

          pendingPlayerIds: [
            ...finalRound
              .pendingPlayerIds,
          ],
        },

        nextPlayerId:
          finalRound
            .pendingPlayerIds[
              0
            ],

        finalRoundStarted:
          true,

        matchFinished:
          false,

        winner:
          null,

        tiedPlayers:
          [],
      };
    }


    /*
     * Noch keine Nachziehrunde.
     */
    return {
      endgame:
        this.endgame,

      nextPlayerId:
        this.#getNextPlayerId(
          completedPlayerId,
        ),

      finalRoundStarted:
        false,

      matchFinished:
        false,

      winner:
        null,

      tiedPlayers:
        [],
    };
  }


  /*
   * =====================================================
   * NACHZIEHRUNDE
   * =====================================================
   */

  if (
    this.endgame.phase ===
    ENDGAME_PHASES.FINAL_ROUND
  ) {
    const remainingPlayerIds =
      completeFinalRoundTurn({
        pendingPlayerIds:
          this.endgame
            .pendingPlayerIds,

        completedPlayerId,
      });


    /*
     * Letzter Nachzieh-Spieler fertig.
     */
    if (
      remainingPlayerIds.length ===
      0
    ) {
      return this.#finishByHighestScore({
        players,

        endgame: {
          ...this.endgame,

          pendingPlayerIds:
            [],
        },
      });
    }


    return {
      endgame: {
        ...this.endgame,

        pendingPlayerIds: [
          ...remainingPlayerIds,
        ],
      },

      nextPlayerId:
        remainingPlayerIds[0],

      finalRoundStarted:
        false,

      matchFinished:
        false,

      winner:
        null,

      tiedPlayers:
        [],
    };
  }


  throw new Error(
    `Unbekannte Endgame-Phase: ${
      this.endgame.phase
    }`,
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

    pendingPlayerIds:
      [],

    winnerId:
      result.winner
        ?.id ??
      null,

    tiedPlayerIds:
      result.tiedPlayers.map(
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

    nextPlayerId:
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

#applyEndgameResolution(
  resolution,
) {
  this.endgame = {
    ...resolution.endgame,

    pendingPlayerIds: [
      ...(
        resolution
          .endgame
          .pendingPlayerIds ??
        []
      ),
    ],

    tiedPlayerIds: [
      ...(
        resolution
          .endgame
          .tiedPlayerIds ??
        []
      ),
    ],
  };


  /*
   * =====================================================
   * MATCH BEENDET
   * =====================================================
   */

  if (
    resolution.matchFinished
  ) {
    this.status =
      'finished';


    this.winnerPlayerId =
      resolution.winner
        ?.id ??
      null;


    this.activePlayerId =
      null;


    this.turn = {
      ...this.#createTurnState(),

      phase:
        TURN_PHASES.FINISHED,
    };


    return;
  }


  /*
   * =====================================================
   * NÄCHSTER TURN
   * =====================================================
   */

  this.#startPlayerTurn(
    resolution.nextPlayerId,
  );
}

#startPlayerTurn(
  playerId,
) {
  if (
    !this.turnOrder.includes(
      playerId,
    )
  ) {
    throw new Error(
      'Der nächste Spieler befindet sich nicht in der Zugreihenfolge.',
    );
  }


  this.activePlayerId =
    playerId;


  this.turnNumber +=
    1;


  this.turn =
    this.#createTurnState();
}
  /*
   * =====================================================
   * SPIELERWECHSEL
   * =====================================================
   */

  #advanceToNextPlayer() {
    this.#startPlayerTurn(
      this.#getNextPlayerId(
        this.activePlayerId,
      ),
    );
  }
#getNextPlayerId(
  playerId,
) {
  const currentIndex =
    this.turnOrder
      .indexOf(
        playerId,
      );


  if (
    currentIndex === -1
  ) {
    throw new Error(
      'Spieler befindet sich nicht in der Zugreihenfolge.',
    );
  }


  const nextIndex =
    (
      currentIndex +
      1
    ) %
    this.turnOrder.length;


  return this.turnOrder[
    nextIndex
  ];
}
finishByForfeit(
  loserPlayerId,
) {
  if (
    this.status !==
    'playing'
  ) {
    return null;
  }


  if (
    !this.turnOrder.includes(
      loserPlayerId,
    )
  ) {
    throw new Error(
      'Forfeit-Spieler gehört nicht zum Match.',
    );
  }


  const winnerPlayerId =
    this.turnOrder.find(
      (playerId) =>
        playerId !==
        loserPlayerId,
    );


  if (!winnerPlayerId) {
    throw new Error(
      'Forfeit-Gewinner konnte nicht ermittelt werden.',
    );
  }


  this.status =
    'finished';


  this.winnerPlayerId =
    winnerPlayerId;


  this.activePlayerId =
    null;


  this.endgame = {
    ...this.endgame,

    phase:
      ENDGAME_PHASES.FINISHED,

    pendingPlayerIds:
      [],

    winnerId:
      winnerPlayerId,

    tiedPlayerIds:
      [],

    winReason:
      WIN_REASONS.FORFEIT,
  };


  this.turn = {
    ...this.turn,

    phase:
      TURN_PHASES.FINISHED,
  };


  this.lastTurnResult = {
    type:
      'forfeit',

    loserPlayerId,

    winnerPlayerId,

    turnNumber:
      this.turnNumber,

    rollSequence:
      this.rollSequence,
  };


  return {
    loserPlayerId,
    winnerPlayerId,
  };
}
  /*
   * =====================================================
   * PUBLIC STATE
   * =====================================================
   */

  toPublicState() {
    return {
      id:
        this.id,

      status:
        this.status,

      startedAt:
        this.startedAt,

      settings: {
        ...this.settings,
      },


      /*
       * Nur bei Sofortsieg aktuell gesetzt.
       *
       * Normales Endgame folgt später.
       */
      winnerPlayerId:
        this.winnerPlayerId,
      endgame: {
        ...this.endgame,

        pendingPlayerIds: [
          ...(
            this.endgame
              .pendingPlayerIds ??
            []
          ),
        ],

        tiedPlayerIds: [
          ...(
            this.endgame
              .tiedPlayerIds ??
            []
          ),
        ],
      },

      turnNumber:
        this.turnNumber,

      activePlayerId:
        this.activePlayerId,

      turnOrder: [
        ...this.turnOrder,
      ],


      /*
       * Bereits serverseitig aus der
       * vorhandenen lokalen Bankregel berechnet.
       *
       * Ein echtes Bank-Event kommt im
       * nächsten Implementierungsschritt.
       */
      canBank:
        this.status ===
          'playing' &&
        canBankTurn(
          this.turn,
        ),


      /*
       * =================================================
       * TURN
       * =================================================
       */

      turn: {
        ...this.turn,


        diceResults: [
          ...this.turn
            .diceResults,
        ],


        scoringOptions:
          this.turn
            .scoringOptions
            .map(
              cloneScoringOption,
            ),


        selectedDiceIndices: [
          ...this.turn
            .selectedDiceIndices,
        ],


        removedDiceValues: [
          ...this.turn
            .removedDiceValues,
        ],


        rolledDiceIds: [
          ...this.turn
            .rolledDiceIds,
        ],


        rollDiceIds: [
          ...this.turn
            .rollDiceIds,
        ],


        straightRerollOption: {
          ...this.turn
            .straightRerollOption,

          matches:
            this.turn
              .straightRerollOption
              .matches
              .map(
                (match) => ({
                  ...match,

                  straightValues: [
                    ...match
                      .straightValues,
                  ],

                  usedRemovedValues: [
                    ...match
                      .usedRemovedValues,
                  ],
                }),
              ),
        },


        selectionValidation: {
          ...this.turn
            .selectionValidation,

          selectedDiceIndices: [
            ...this.turn
              .selectionValidation
              .selectedDiceIndices,
          ],

          interpretations:
            this.turn
              .selectionValidation
              .interpretations
              .map(
                cloneInterpretation,
              ),
        },


        dice:
          this.turn.dice.map(
            (die) => ({
              ...die,
            }),
          ),
      },


      /*
       * =================================================
       * LETZTER WURF
       * =================================================
       */

      lastRoll:
        this.lastRoll
          ? {
              ...this.lastRoll,

              dice:
                this.lastRoll
                  .dice
                  .map(
                    (die) => ({
                      ...die,
                    }),
                  ),
            }
          : null,


      /*
       * =================================================
       * LETZTES ZUGERGEBNIS
       * =================================================
       */

      lastTurnResult:
        this.lastTurnResult
          ? {
              ...this.lastTurnResult,
            }
          : null,


      /*
       * =================================================
       * SPIELERSTÄNDE
       * =================================================
       */

      playerStates:
        this.playerStates.map(
          (playerState) => ({
            ...playerState,
          }),
        ),
    };
  }
}