import {
  TURN_PHASES,
} from '../core/turn/TurnRules.js';

import {
  ENDGAME_PHASES,
  WIN_REASONS,
} from '../core/endgame/EndgameRules.js';

export class OnlineGameScreen {
  constructor({
    multiplayerClient,
  }) {
    this.multiplayerClient =
      multiplayerClient;


    /*
     * =====================================================
     * MATCH INFO
     * =====================================================
     */

    this.matchIdElement =
      null;

    this.modeElement =
      null;

    this.targetElement =
      null;

    this.turnElement =
      null;

    this.activePlayerElement =
      null;

    this.endgameElement =
      null;


    /*
     * =====================================================
     * TURN INFO
     * =====================================================
     */

    this.turnScoreElement =
      null;

    this.activeDiceCountElement =
      null;

    this.canBankElement =
      null;

    this.removedDiceElement =
      null;


    /*
     * =====================================================
     * DICE
     * =====================================================
     */

    this.diceElement =
      null;

    this.rollButton =
      null;


    /*
     * =====================================================
     * SCORING
     * =====================================================
     */

    this.selectionStatusElement =
      null;

    this.interpretationsElement =
      null;

    this.straightRerollButton =
      null;


    /*
     * =====================================================
     * BANK
     * =====================================================
     */

    this.bankButton =
      null;


    /*
     * =====================================================
     * PLAYER / ERROR
     * =====================================================
     */

    this.playersElement =
      null;

    this.errorElement =
      null;


    /*
     * =====================================================
     * HANDLER
     * =====================================================
     */

    this.handleRoll =
      null;

    this.handleDiceClick =
      null;

    this.handleInterpretationClick =
      null;

    this.handleStraightReroll =
      null;

    this.handleBank =
      null;


    /*
     * =====================================================
     * SUBSCRIPTION
     * =====================================================
     */

    this.unsubscribeMultiplayer =
      null;


    /*
     * Verhindert, dass derselbe Serverwurf
     * mehrfach animiert wird.
     */
    this.lastAnimatedRollSequence =
      0;
  }


  /*
   * =======================================================
   * MOUNT
   * =======================================================
   */

  mount(
    rootElement,
  ) {
    rootElement.innerHTML = `
      <main
        class="
          screen
          online-game-screen
        "
      >
        <h1>
          Online-Spiel
        </h1>


        <section>
          <h2>
            Match
          </h2>


          <p>
            Match:
            <strong
              data-match-id
            >
              —
            </strong>
          </p>


          <p>
            Modus:
            <strong
              data-game-mode
            >
              —
            </strong>
          </p>


          <p>
            Ziel:
            <strong
              data-target-score
            >
              —
            </strong>
          </p>


          <p>
            Zug:
            <strong
              data-turn-number
            >
              —
            </strong>
          </p>


          <p>
            Am Zug:
            <strong
              data-active-player
            >
              —
            </strong>
          </p>


          <p>
            Endgame:
            <strong
              data-endgame-status
            >
              Normal
            </strong>
          </p>
        </section>


        <section>
          <h2>
            Aktueller Zug
          </h2>


          <p>
            Zugpunkte:
            <strong
              data-turn-score
            >
              0
            </strong>
          </p>


          <p>
            Aktive Würfel:
            <strong
              data-active-dice-count
            >
              6
            </strong>
          </p>


          <p>
            Sichern erlaubt:
            <strong
              data-can-bank
            >
              Nein
            </strong>
          </p>


          <p>
            Herausgelegt:
            <strong
              data-removed-dice
            >
              —
            </strong>
          </p>
        </section>


        <section>
          <h2>
            Würfel
          </h2>


          <div
            class="online-game__dice"
            data-game-dice
          ></div>


          <button
            type="button"
            data-action="roll-dice"
          >
            Würfeln
          </button>
        </section>


        <section>
          <h2>
            Wertung
          </h2>


          <p
            data-selection-status
          >
            Noch keine Auswahl.
          </p>


          <div
            data-scoring-interpretations
          ></div>


          <button
            type="button"
            data-action="straight-reroll"
            hidden
          >
            Straßen-Nachwurf
          </button>
        </section>


        <section>
          <h2>
            Zug sichern
          </h2>


          <button
            type="button"
            data-action="bank-turn"
          >
            Sichern nicht möglich
          </button>
        </section>


        <section>
          <h2>
            Spielstand
          </h2>


          <ul
            data-game-players
          ></ul>
        </section>


        <p
          data-game-error
          role="alert"
        ></p>
      </main>
    `;


    /*
     * =====================================================
     * MATCH INFO
     * =====================================================
     */

    this.matchIdElement =
      rootElement.querySelector(
        '[data-match-id]',
      );


    this.modeElement =
      rootElement.querySelector(
        '[data-game-mode]',
      );


    this.targetElement =
      rootElement.querySelector(
        '[data-target-score]',
      );


    this.turnElement =
      rootElement.querySelector(
        '[data-turn-number]',
      );


    this.activePlayerElement =
      rootElement.querySelector(
        '[data-active-player]',
      );


    this.endgameElement =
      rootElement.querySelector(
        '[data-endgame-status]',
      );


    /*
     * =====================================================
     * TURN INFO
     * =====================================================
     */

    this.turnScoreElement =
      rootElement.querySelector(
        '[data-turn-score]',
      );


    this.activeDiceCountElement =
      rootElement.querySelector(
        '[data-active-dice-count]',
      );


    this.canBankElement =
      rootElement.querySelector(
        '[data-can-bank]',
      );


    this.removedDiceElement =
      rootElement.querySelector(
        '[data-removed-dice]',
      );


    /*
     * =====================================================
     * DICE
     * =====================================================
     */

    this.diceElement =
      rootElement.querySelector(
        '[data-game-dice]',
      );


    this.rollButton =
      rootElement.querySelector(
        '[data-action="roll-dice"]',
      );


    /*
     * =====================================================
     * SCORING
     * =====================================================
     */

    this.selectionStatusElement =
      rootElement.querySelector(
        '[data-selection-status]',
      );


    this.interpretationsElement =
      rootElement.querySelector(
        '[data-scoring-interpretations]',
      );


    this.straightRerollButton =
      rootElement.querySelector(
        '[data-action="straight-reroll"]',
      );


    /*
     * =====================================================
     * BANK
     * =====================================================
     */

    this.bankButton =
      rootElement.querySelector(
        '[data-action="bank-turn"]',
      );


    /*
     * =====================================================
     * PLAYERS / ERROR
     * =====================================================
     */

    this.playersElement =
      rootElement.querySelector(
        '[data-game-players]',
      );


    this.errorElement =
      rootElement.querySelector(
        '[data-game-error]',
      );


    /*
     * =====================================================
     * EVENT HANDLER
     * =====================================================
     */

    this.handleRoll =
      () => {
        this.multiplayerClient
          .rollDice();
      };


    this.handleDiceClick =
      (
        event,
      ) => {
        const target =
          event.target.closest(
            '[data-roll-index]',
          );


        if (!target) {
          return;
        }


        const diceIndex =
          Number(
            target.dataset
              .rollIndex,
          );


        if (
          !Number.isInteger(
            diceIndex,
          )
        ) {
          return;
        }


        this.multiplayerClient
          .toggleDiceSelection(
            diceIndex,
          );
      };


    this.handleInterpretationClick =
      (
        event,
      ) => {
        const target =
          event.target.closest(
            '[data-interpretation-id]',
          );


        if (!target) {
          return;
        }


        const interpretationId =
          target.dataset
            .interpretationId;


        if (!interpretationId) {
          return;
        }


        this.multiplayerClient
          .applyScoringInterpretation(
            interpretationId,
          );
      };


    this.handleStraightReroll =
      () => {
        this.multiplayerClient
          .useStraightReroll();
      };


    this.handleBank =
      () => {
        this.multiplayerClient
          .bankTurn();
      };


    /*
     * =====================================================
     * LISTENER
     * =====================================================
     */

    this.rollButton
      ?.addEventListener(
        'click',
        this.handleRoll,
      );


    /*
     * Event-Delegation wird benutzt,
     * weil die Würfel bei jedem State-Update
     * neu erzeugt werden.
     */
    this.diceElement
      ?.addEventListener(
        'click',
        this.handleDiceClick,
      );


    this.interpretationsElement
      ?.addEventListener(
        'click',
        this.handleInterpretationClick,
      );


    this.straightRerollButton
      ?.addEventListener(
        'click',
        this.handleStraightReroll,
      );


    this.bankButton
      ?.addEventListener(
        'click',
        this.handleBank,
      );


    /*
     * =====================================================
     * MULTIPLAYER STATE
     * =====================================================
     */

    this.unsubscribeMultiplayer =
      this.multiplayerClient
        .subscribe(
          (
            state,
          ) => {
            this.#renderState(
              state,
            );
          },
        );
  }


  /*
   * =======================================================
   * STATE RENDER
   * =======================================================
   */

  #renderState(
    state,
  ) {
    const room =
      state.currentRoom;


    const match =
      room?.match;


    /*
     * Match immer zuerst prüfen.
     *
     * Dadurch greifen wir niemals auf
     * match.turn zu, wenn noch kein Match existiert.
     */
    if (!match) {
      this.#renderNoMatch(
        state,
      );


      return;
    }


    const turn =
      match.turn;


    if (!turn) {
      this.#renderNoMatch(
        state,
      );


      return;
    }


    /*
     * =====================================================
     * NORMALER FEHLER
     * =====================================================
     */

    if (
      this.errorElement
    ) {
      this.errorElement
        .textContent =
        state.gameError
          ?.message ??
        state.error ??
        '';
    }


    /*
     * =====================================================
     * MATCH INFO
     * =====================================================
     */

    if (
      this.matchIdElement
    ) {
      this.matchIdElement
        .textContent =
        match.id;
    }


    if (
      this.modeElement
    ) {
      this.modeElement
        .textContent =
        match.settings
          .gameModeId;
    }


    if (
      this.targetElement
    ) {
      this.targetElement
        .textContent =
        Number(
          match.settings
            .targetScore,
        )
          .toLocaleString(
            'de-DE',
          );
    }


    if (
      this.turnElement
    ) {
      this.turnElement
        .textContent =
        String(
          match.turnNumber,
        );
    }


    /*
     * =====================================================
     * ACTIVE PLAYER
     * =====================================================
     */

    const activePlayer =
      match.activePlayerId
        ? room.players.find(
            (player) =>
              player.id ===
              match.activePlayerId,
          ) ??
          null
        : null;


    if (
      this.activePlayerElement
    ) {
      if (
        match.status ===
        'finished'
      ) {
        this.activePlayerElement
          .textContent =
          'Spiel beendet';
      }
      else {
        this.activePlayerElement
          .textContent =
          activePlayer
            ?.displayName ??
          'Unbekannt';
      }
    }


    /*
     * =====================================================
     * ENDGAME
     * =====================================================
     */

    this.#renderEndgame({
      room,
      match,
    });


    /*
     * =====================================================
     * TURN INFO
     * =====================================================
     */

    if (
      this.turnScoreElement
    ) {
      this.turnScoreElement
        .textContent =
        Number(
          turn.turnScore ??
          0,
        )
          .toLocaleString(
            'de-DE',
          );
    }


    if (
      this.activeDiceCountElement
    ) {
      this.activeDiceCountElement
        .textContent =
        String(
          turn.activeDiceCount ??
          0,
        );
    }


    if (
      this.canBankElement
    ) {
      this.canBankElement
        .textContent =
        match.canBank
          ? 'Ja'
          : 'Nein';
    }


    if (
      this.removedDiceElement
    ) {
      this.removedDiceElement
        .textContent =
        turn.removedDiceValues
          ?.length
          ? turn
              .removedDiceValues
              .join(
                ', ',
              )
          : '—';
    }


    /*
     * =====================================================
     * LOCAL PLAYER
     * =====================================================
     */

    const localIsActive =
      match.activePlayerId ===
      state.localPlayerId;


    /*
     * =====================================================
     * DICE
     * =====================================================
     */

    this.#renderDice({
      turn,
      localIsActive,
      matchFinished:
        match.status ===
        'finished',
    });


    /*
     * =====================================================
     * ROLL BUTTON
     * =====================================================
     */

    const canRoll =
      localIsActive &&
      match.status ===
        'playing' &&
      turn.phase ===
        TURN_PHASES.READY_TO_ROLL;


    if (
      this.rollButton
    ) {
      this.rollButton.disabled =
        !canRoll;


      if (
        match.status ===
        'finished'
      ) {
        this.rollButton
          .textContent =
          'Spiel beendet';
      }
      else if (
        !localIsActive
      ) {
        this.rollButton
          .textContent =
          'Anderer Spieler ist am Zug';
      }
      else if (
        turn.phase ===
        TURN_PHASES.READY_TO_ROLL
      ) {
        this.rollButton
          .textContent =
          'Würfeln';
      }
      else if (
        turn.phase ===
        TURN_PHASES.SELECTING
      ) {
        this.rollButton
          .textContent =
          'Wertung auswählen';
      }
      else {
        this.rollButton
          .textContent =
          'Würfeln nicht möglich';
      }
    }


    /*
     * =====================================================
     * SCORING
     * =====================================================
     */

    this.#renderSelection({
      turn,
      localIsActive,
      matchFinished:
        match.status ===
        'finished',
    });


    /*
     * =====================================================
     * STRAIGHT REROLL
     * =====================================================
     */

    const straightRerollAvailable =
      turn
        .straightRerollOption
        ?.isAvailable ===
      true;


    const canUseStraightReroll =
      localIsActive &&
      match.status ===
        'playing' &&
      turn.phase ===
        TURN_PHASES.SELECTING &&
      straightRerollAvailable;


    if (
      this.straightRerollButton
    ) {
      this.straightRerollButton.hidden =
        !straightRerollAvailable ||
        match.status ===
          'finished';


      this.straightRerollButton.disabled =
        !canUseStraightReroll;
    }


    /*
     * =====================================================
     * BANK
     * =====================================================
     */

    this.#renderBankButton({
      match,
      turn,
      localIsActive,
    });


    /*
     * =====================================================
     * PLAYERS
     * =====================================================
     */

    this.#renderPlayers({
      room,
      match,
    });


    /*
     * =====================================================
     * MATCH FINISHED
     * =====================================================
     */

    this.#renderFinishedState({
      room,
      match,
    });
  }


  /*
   * =======================================================
   * ENDGAME
   * =======================================================
   */

  #renderEndgame({
    room,
    match,
  }) {
    if (
      !this.endgameElement
    ) {
      return;
    }


    const endgame =
      match.endgame;


    if (!endgame) {
      this.endgameElement
        .textContent =
        'Normal';


      return;
    }


    /*
     * =====================================================
     * FINAL ROUND
     * =====================================================
     */

    if (
      endgame.phase ===
      ENDGAME_PHASES.FINAL_ROUND
    ) {
      const pendingPlayerIds =
        endgame.pendingPlayerIds ??
        [];


      const pendingNames =
        pendingPlayerIds.map(
          (playerId) =>
            room.players.find(
              (player) =>
                player.id ===
                playerId,
            )
              ?.displayName ??
            'Unbekannt',
        );


      this.endgameElement
        .textContent =
        pendingNames.length > 0
          ? `Nachziehrunde: ${
              pendingNames.join(
                ', ',
              )
            }`
          : 'Nachziehrunde';


      return;
    }


    /*
     * =====================================================
     * FINISHED
     * =====================================================
     */

    if (
      endgame.phase ===
      ENDGAME_PHASES.FINISHED
    ) {
      this.endgameElement
        .textContent =
        'Beendet';


      return;
    }


    /*
     * =====================================================
     * NORMAL GAME
     * =====================================================
     */

    this.endgameElement
      .textContent =
      'Normal';
  }


  /*
   * =======================================================
   * DICE
   * =======================================================
   */

  #renderDice({
    turn,
    localIsActive,
    matchFinished,
  }) {
    if (
      !this.diceElement
    ) {
      return;
    }


    this.diceElement
      .replaceChildren();


    const rolledDiceIds =
      new Set(
        turn.rolledDiceIds ??
        [],
      );


    const selectedDiceIndices =
      new Set(
        turn.selectedDiceIndices ??
        [],
      );


    const isNewRoll =
      Number(
        turn.rollSequence ??
        0,
      ) >
      this.lastAnimatedRollSequence;


    for (
      const die
      of turn.dice ?? []
    ) {
      const element =
        document.createElement(
          'button',
        );


      element.type =
        'button';


      element.className =
        'online-game__die';


      element.dataset.dieId =
        String(
          die.id,
        );


      /*
       * Der Scoring-Core arbeitet mit dem Index
       * innerhalb des aktuellen Wurfs.
       *
       * rollDiceIds übersetzt:
       *
       * Server-Würfel-ID
       * →
       * Index in diceResults
       */
      const rollIndex =
        (
          turn.rollDiceIds ??
          []
        )
          .indexOf(
            die.id,
          );


      const isCurrentRollDie =
        rollIndex !==
        -1;


      const isSelected =
        isCurrentRollDie &&
        selectedDiceIndices.has(
          rollIndex,
        );


      const canSelect =
        !matchFinished &&
        localIsActive &&
        turn.phase ===
          TURN_PHASES.SELECTING &&
        die.state ===
          'active' &&
        isCurrentRollDie;


      if (
        isCurrentRollDie
      ) {
        element.dataset.rollIndex =
          String(
            rollIndex,
          );
      }


      element.disabled =
        !canSelect;


      /*
       * Herausgelegter Würfel.
       */
      if (
        die.state ===
        'removed'
      ) {
        element.classList.add(
          'online-game__die--removed',
        );
      }


      /*
       * Aktuell ausgewählt.
       */
      if (
        isSelected
      ) {
        element.classList.add(
          'online-game__die--selected',
        );
      }


      element.textContent =
        this.#getDieFace(
          die.value,
        );


      /*
       * Animation entscheidet niemals das Ergebnis.
       *
       * Die Würfelwerte stehen bereits im
       * autoritativen Server-State.
       */
      if (
        isNewRoll &&
        rolledDiceIds.has(
          die.id,
        )
      ) {
        element.classList.add(
          'online-game__die--rolling',
        );
      }


      this.diceElement
        .append(
          element,
        );
    }


    if (
      isNewRoll
    ) {
      this.lastAnimatedRollSequence =
        Number(
          turn.rollSequence ??
          0,
        );
    }
  }


  #getDieFace(
    value,
  ) {
    const faces = {
      1:
        '⚀',

      2:
        '⚁',

      3:
        '⚂',

      4:
        '⚃',

      5:
        '⚄',

      6:
        '⚅',
    };


    return (
      faces[value] ??
      '–'
    );
  }


  /*
   * =======================================================
   * SCORING SELECTION
   * =======================================================
   */

  #renderSelection({
    turn,
    localIsActive,
    matchFinished,
  }) {
    const selectedDiceIndices =
      turn.selectedDiceIndices ??
      [];


    const validation =
      turn.selectionValidation;


    /*
     * =====================================================
     * STATUS TEXT
     * =====================================================
     */

    if (
      this.selectionStatusElement
    ) {
      if (
        matchFinished
      ) {
        this.selectionStatusElement
          .textContent =
          'Spiel beendet.';
      }
      else if (
        turn.phase !==
        TURN_PHASES.SELECTING
      ) {
        this.selectionStatusElement
          .textContent =
          'Zuerst würfeln.';
      }
      else if (
        selectedDiceIndices.length ===
        0
      ) {
        this.selectionStatusElement
          .textContent =
          'Wähle mindestens einen wertbaren Würfel.';
      }
      else if (
        validation
          ?.isValid
      ) {
        this.selectionStatusElement
          .textContent =
          'Auswahl ist gültig.';
      }
      else {
        this.selectionStatusElement
          .textContent =
          'Diese Auswahl ist nicht vollständig wertbar.';
      }
    }


    /*
     * =====================================================
     * INTERPRETATIONS
     * =====================================================
     */

    if (
      !this.interpretationsElement
    ) {
      return;
    }


    this.interpretationsElement
      .replaceChildren();


    const interpretations =
      validation
        ?.interpretations ??
      [];


    if (
      interpretations.length ===
      0
    ) {
      const text =
        document.createElement(
          'p',
        );


      text.textContent =
        'Keine Wertungsinterpretation ausgewählt.';


      this.interpretationsElement
        .append(
          text,
        );


      return;
    }


    for (
      const interpretation
      of interpretations
    ) {
      const button =
        document.createElement(
          'button',
        );


      button.type =
        'button';


      button.dataset.interpretationId =
        interpretation.id;


      button.className =
        'scoring-interpretation';


      button.disabled =
        !localIsActive ||
        matchFinished;


      let label =
        `${interpretation.label} — ` +
        `${Number(
          interpretation.score,
        )
          .toLocaleString(
            'de-DE',
          )} Punkte`;


      if (
        interpretation.isHotDice
      ) {
        label +=
          ' — HOT DICE';
      }


      if (
        interpretation.isInstantWin
      ) {
        label +=
          ' — SOFORTSIEG';
      }


      button.textContent =
        label;


      this.interpretationsElement
        .append(
          button,
        );
    }
  }


  /*
   * =======================================================
   * BANK
   * =======================================================
   */

  #renderBankButton({
    match,
    turn,
    localIsActive,
  }) {
    if (
      !this.bankButton
    ) {
      return;
    }


    const canBank =
      localIsActive &&
      match.status ===
        'playing' &&
      match.canBank ===
        true;


    this.bankButton.disabled =
      !canBank;


    if (
      match.status ===
      'finished'
    ) {
      this.bankButton
        .textContent =
        'Spiel beendet';


      return;
    }


    if (
      !localIsActive
    ) {
      this.bankButton
        .textContent =
        'Anderer Spieler ist am Zug';


      return;
    }


    if (
      match.canBank
    ) {
      this.bankButton
        .textContent =
        `Sichern (${
          Number(
            turn.turnScore ??
            0,
          )
            .toLocaleString(
              'de-DE',
            )
        })`;


      return;
    }


    this.bankButton
      .textContent =
      'Sichern nicht möglich';
  }


  /*
   * =======================================================
   * PLAYERS
   * =======================================================
   */

  #renderPlayers({
    room,
    match,
  }) {
    if (
      !this.playersElement
    ) {
      return;
    }


    this.playersElement
      .replaceChildren();


    const pendingPlayerIds =
      new Set(
        match.endgame
          ?.pendingPlayerIds ??
        [],
      );


    for (
      const player
      of room.players
    ) {
      const playerState =
        match.playerStates
          .find(
            (entry) =>
              entry.playerId ===
              player.id,
          );


      const item =
        document.createElement(
          'li',
        );


      const totalScore =
        Number(
          playerState
            ?.totalScore ??
          0,
        )
          .toLocaleString(
            'de-DE',
          );


      const lastBankedScore =
        Number(
          playerState
            ?.lastBankedScore ??
          0,
        )
          .toLocaleString(
            'de-DE',
          );


      const labels =
        [];
      if (
        player.connectionStatus ===
        'disconnected'
      ) {
        labels.push(
          'VERBINDUNG GETRENNT',
        );
      }

      if (
        player.id ===
        match.activePlayerId
      ) {
        labels.push(
          'AM ZUG',
        );
      }


      if (
        player.id ===
        match.endgame
          ?.triggerPlayerId
      ) {
        labels.push(
          'NACHZIEHRUNDE AUSGELÖST',
        );
      }


      if (
        pendingPlayerIds.has(
          player.id,
        )
      ) {
        labels.push(
          'LETZTER ZUG OFFEN',
        );
      }


      if (
        player.id ===
        match.winnerPlayerId
      ) {
        labels.push(
          'GEWINNER',
        );
      }


      const suffix =
        labels.length > 0
          ? ` — ${labels.join(
              ' | ',
            )}`
          : '';


      item.textContent =
        `${player.displayName}: ` +
        `${totalScore} Punkte | ` +
        `Letzte Sicherung: ${lastBankedScore}` +
        suffix;


      this.playersElement
        .append(
          item,
        );
    }
  }


  /*
   * =======================================================
   * FINISHED STATE
   * =======================================================
   */

  #renderFinishedState({
    room,
    match,
  }) {
    if (
      match.status !==
      'finished'
    ) {
      return;
    }


    const winner =
      match.winnerPlayerId
        ? room.players.find(
            (player) =>
              player.id ===
              match.winnerPlayerId,
          ) ??
          null
        : null;


    /*
     * Sechs Einsen.
     */
    if (
      match.endgame
        ?.winReason ===
      WIN_REASONS.SIX_ONES
    ) {
      if (
        this.errorElement
      ) {
        this.errorElement
          .textContent =
          `Sofortsieg: ${
            winner
              ?.displayName ??
            'Unbekannter Spieler'
          }`;
      }


      return;
    }


    /*
     * Normaler Sieg nach Nachziehrunde.
     */
    if (winner) {
      if (
        this.errorElement
      ) {
        this.errorElement
          .textContent =
          `Spiel beendet — Gewinner: ${
            winner.displayName
          }`;
      }


      return;
    }


    /*
     * Gleichstand.
     */
    const tiedPlayerIds =
      match.endgame
        ?.tiedPlayerIds ??
      [];


    if (
      tiedPlayerIds.length >
      0
    ) {
      const tiedNames =
        tiedPlayerIds.map(
          (playerId) =>
            room.players.find(
              (player) =>
                player.id ===
                playerId,
            )
              ?.displayName ??
            'Unbekannt',
        );


      if (
        this.errorElement
      ) {
        this.errorElement
          .textContent =
          `Spiel beendet — Gleichstand: ${
            tiedNames.join(
              ', ',
            )
          }`;
      }


      return;
    }


    if (
      this.errorElement
    ) {
      this.errorElement
        .textContent =
        'Spiel beendet.';
    }
  }


  /*
   * =======================================================
   * NO MATCH
   * =======================================================
   */

  #renderNoMatch(
    state,
  ) {
    if (
      this.activePlayerElement
    ) {
      this.activePlayerElement
        .textContent =
        'Kein aktives Match';
    }


    if (
      this.endgameElement
    ) {
      this.endgameElement
        .textContent =
        '—';
    }


    if (
      this.errorElement
    ) {
      this.errorElement
        .textContent =
        state.gameError
          ?.message ??
        state.error ??
        '';
    }


    if (
      this.rollButton
    ) {
      this.rollButton.disabled =
        true;
    }


    if (
      this.bankButton
    ) {
      this.bankButton.disabled =
        true;
    }


    if (
      this.straightRerollButton
    ) {
      this.straightRerollButton.hidden =
        true;
    }


    if (
      this.diceElement
    ) {
      this.diceElement
        .replaceChildren();
    }


    if (
      this.interpretationsElement
    ) {
      this.interpretationsElement
        .replaceChildren();
    }
  }


  /*
   * =======================================================
   * DESTROY
   * =======================================================
   */

  destroy() {
    this.rollButton
      ?.removeEventListener(
        'click',
        this.handleRoll,
      );


    this.diceElement
      ?.removeEventListener(
        'click',
        this.handleDiceClick,
      );


    this.interpretationsElement
      ?.removeEventListener(
        'click',
        this.handleInterpretationClick,
      );


    this.straightRerollButton
      ?.removeEventListener(
        'click',
        this.handleStraightReroll,
      );


    this.bankButton
      ?.removeEventListener(
        'click',
        this.handleBank,
      );


    this.unsubscribeMultiplayer?.();


    this.unsubscribeMultiplayer =
      null;


    /*
     * =====================================================
     * ELEMENT REFERENCES
     * =====================================================
     */

    this.matchIdElement =
      null;

    this.modeElement =
      null;

    this.targetElement =
      null;

    this.turnElement =
      null;

    this.activePlayerElement =
      null;

    this.endgameElement =
      null;

    this.turnScoreElement =
      null;

    this.activeDiceCountElement =
      null;

    this.canBankElement =
      null;

    this.removedDiceElement =
      null;

    this.diceElement =
      null;

    this.rollButton =
      null;

    this.selectionStatusElement =
      null;

    this.interpretationsElement =
      null;

    this.straightRerollButton =
      null;

    this.bankButton =
      null;

    this.playersElement =
      null;

    this.errorElement =
      null;


    /*
     * =====================================================
     * HANDLER REFERENCES
     * =====================================================
     */

    this.handleRoll =
      null;

    this.handleDiceClick =
      null;

    this.handleInterpretationClick =
      null;

    this.handleStraightReroll =
      null;

    this.handleBank =
      null;
  }
}