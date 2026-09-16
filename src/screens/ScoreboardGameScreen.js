import {
  SCREENS,
} from '../app/screens.js';

import {
  ProbabilityPanel,
} from '../ui/ProbabilityPanel.js';

import {
  getCharacterById,
} from '../config/characters.js';

import {
  ActiveCharacterView,
} from '../ui/characters/ActiveCharacterView.js';

export class ScoreboardGameScreen {
  constructor({
    navigate,
    gameSessionController,
    scoreboardTurnController,
    probabilityCalculator,
    audioService
  }) {
    this.navigate =
      navigate;

    this.audioService =
      audioService;

    this.activeCharacterView =
      null;

    this.gameSessionController =
      gameSessionController;

    this.scoreboardTurnController =
      scoreboardTurnController;

    this.probabilityCalculator =
      probabilityCalculator;


    this.probabilityPanel =
      null;
    
    this.isCharacterReactionPlaying =
      false;


    this.currentPlayerElement =
      null;

    this.scoreInput =
      null;

    this.messageElement =
      null;

    this.playerCardsElement =
      null;


    this.bankButton =
      null;

    this.loseButton =
      null;

    this.firstRollBustButton =
      null;

    this.instantWinButton =
      null;

    this.backButton =
      null;


    this.handleBank =
      null;

    this.handleLose =
      null;

    this.handleFirstRollBust =
      null;

    this.handleInstantWin =
      null;

    this.handleBack =
      null;
  }


  mount(
    rootElement,
  ) {
    const currentPlayer =
      this.gameSessionController
        .getCurrentPlayer();


    if (!currentPlayer) {
      this.navigate(
        SCREENS.PLAYER_SETUP,
        {
          mode:
            'scoreboard',
        },
      );

      return;
    }


    rootElement.innerHTML = `
      <main
        class="screen scoreboard-screen"
      >

        <header
          class="game-header"
        >

          <button
            type="button"
            class="game-button game-button--secondary"
            data-action="back"
          >
          </button>

          <h1
            data-current-player
          ></h1>

          <div></div>

        </header>


        <section
          class="scoreboard-control-grid"
        >

          <article
            class="scoreboard-action-tile"
          >

            <h2>
              SCORE
            </h2>

            <label
              class="scoreboard-score-input"
            >


              <input
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                autocomplete="off"
                placeholder="850"
                data-score-input
              >

            </label>

            <button
              type="button"
              class="game-button game-button--primary"
              data-action="bank"
            >
              CLOCK!
            </button>

            <small>
              Score sichern und Zug beenden.
            </small>

          </article>


          <article
            class="scoreboard-action-tile"
          >

            <h2>
              VERWORFEN
            </h2>

            <div
              class="scoreboard-action-tile__spacer"
            ></div>

            <button
              type="button"
              class="game-button"
              data-action="lose"
            >
              LOOSE!
            </button>

            <small>
              Zug ohne gesicherte Punkte beenden.
            </small>

          </article>


          <article
            class="scoreboard-action-tile"
          >

            <h2>
              ERSTWURF
            </h2>

            <div
              class="scoreboard-action-tile__spacer"
            ></div>

            <button
              type="button"
              class="game-button game-button--danger"
              data-action="first-roll-bust"
            >
              ERSTWURF 0!
            </button>

            <small>
              Fehlwurf direkt beim ersten Wurf.
            </small>

          </article>


          <article
            class="scoreboard-action-tile"
          >

            <h2>
              SOFORTSIEG
            </h2>

            <div
              class="scoreboard-action-tile__spacer"
            ></div>

            <button
              type="button"
              class="game-button"
              data-action="instant-win"
            >
              6 × 1
            </button>

            <small>
              Sechs Einsen beenden die Partie sofort.
            </small>

          </article>

        </section>


        <p
          class="scoreboard-message"
          data-message
          aria-live="polite"
        ></p>

        <div
          class="active-character-stage active-character-stage--scoreboard"
          data-active-character-stage
          aria-hidden="true"
        ></div>

        <section
          class="player-list scoreboard-player-list"
        >

          <h2>
            Spieler
          </h2>

          <div
            class="player-list__cards"
            data-player-cards
          ></div>

        </section>

      </main>
    `;


    this.currentPlayerElement =
      rootElement.querySelector(
        '[data-current-player]',
      );

    this.scoreInput =
      rootElement.querySelector(
        '[data-score-input]',
      );

    this.messageElement =
      rootElement.querySelector(
        '[data-message]',
      );

    this.playerCardsElement =
      rootElement.querySelector(
        '[data-player-cards]',
      );


    this.bankButton =
      rootElement.querySelector(
        '[data-action="bank"]',
      );

    this.loseButton =
      rootElement.querySelector(
        '[data-action="lose"]',
      );

    this.firstRollBustButton =
      rootElement.querySelector(
        '[data-action="first-roll-bust"]',
      );

    this.instantWinButton =
      rootElement.querySelector(
        '[data-action="instant-win"]',
      );

    this.backButton =
      rootElement.querySelector(
        '[data-action="back"]',
      );


      const activeCharacterStage =
        rootElement.querySelector(
          '[data-active-character-stage]',
        );


      if (
        !(
          activeCharacterStage instanceof
          HTMLElement
        )
      ) {
        throw new Error(
          'Scoreboard Active-Character-Stage wurde nicht gefunden.',
        );
      }


      this.activeCharacterView =
        new ActiveCharacterView(
          activeCharacterStage,
          this.audioService,
        );

    this.handleBank =
      this.#handleBank.bind(
        this,
      );

    this.handleLose =
      this.#handleLose.bind(
        this,
      );

    this.handleFirstRollBust =
      this.#handleFirstRollBust.bind(
        this,
      );

    this.handleInstantWin =
      this.#handleInstantWin.bind(
        this,
      );

    this.handleBack =
      () => {
        this.navigate(
          SCREENS.MODE_SELECT,
        );
      };


    this.bankButton
      .addEventListener(
        'click',
        this.handleBank,
      );

    this.loseButton
      .addEventListener(
        'click',
        this.handleLose,
      );

    this.firstRollBustButton
      .addEventListener(
        'click',
        this.handleFirstRollBust,
      );

    this.instantWinButton
      .addEventListener(
        'click',
        this.handleInstantWin,
      );

    this.backButton
      .addEventListener(
        'click',
        this.handleBack,
      );


    this.#renderSessionState();


    this.probabilityPanel =
      new ProbabilityPanel({
        calculator:
          this.probabilityCalculator,
      });


    this.probabilityPanel.mount(
      rootElement,
    );


    this.scoreInput
      .focus();
  }

  /*
  * =======================================================
  * CHARACTER REACTIONS
  * =======================================================
  */

  #setInteractionLocked(
    isLocked,
  ) {
    if (
      this.scoreInput
    ) {
      this.scoreInput.disabled =
        isLocked;
    }


    const buttons =
      [
        this.bankButton,
        this.loseButton,
        this.firstRollBustButton,
        this.instantWinButton,
        this.backButton,
      ];


    for (
      const button
      of buttons
    ) {
      if (
        button
      ) {
        button.disabled =
          isLocked;
      }
    }
  }


  async #playCharacterAnimation(
    animationName,
  ) {
    if (
      !this.activeCharacterView
    ) {
      return false;
    }


    try {
      return await this.activeCharacterView
        .playAnimation(
          animationName,
        );

    } catch (error) {
      console.error(
        `Charakteranimation "${animationName}" konnte nicht abgespielt werden:`,
        error,
      );


      /*
      * Fehlende oder defekte Animationen dürfen
      * das Spiel niemals blockieren.
      */
      return false;
    }
  }


  #startCharacterReaction() {
    this.isCharacterReactionPlaying =
      true;


    this.#setInteractionLocked(
      true,
    );
  }


  #finishCharacterReaction() {
    this.isCharacterReactionPlaying =
      false;


    this.#setInteractionLocked(
      false,
    );
  }

 async #handleBank() {
  if (
    this.isCharacterReactionPlaying
  ) {
    return;
  }


  this.#startCharacterReaction();


  try {
    /*
     * Der Controller aktualisiert den GameState bereits.
     *
     * WICHTIG:
     * Wir rendern diesen neuen State aber noch NICHT.
     *
     * Dadurch bleibt der Charakter des Spielers,
     * der gerade CLOCK gedrückt hat, sichtbar.
     */
    const result =
      this.scoreboardTurnController
        .bankScore(
          this.scoreInput.value,
        );


    this.audioService
      .playSfx(
        'bankScore',
      );


    await this.#playCharacterAnimation(
      'success',
    );


    /*
     * Wenn dadurch die Partie beendet wurde:
     * erst NACH JUHUU zum VictoryScreen.
     */
    if (
      result.matchFinished
    ) {
      this.navigate(
        SCREENS.VICTORY,
      );

      return;
    }


    /*
     * Animation ist fertig.
     *
     * Erst jetzt darf der nächste Spieler sichtbar werden.
     */
    this.#finishCharacterReaction();


    this.#clearScoreInput();


    this.#renderSessionState();


    if (
      result.finalRoundStarted
    ) {
      this.#showMessage(
        `${result.bankedPlayer.name} sichert ` +
        `${result.bankedScore.toLocaleString('de-DE')} Punkte ` +
        `und startet die Nachziehrunde. ` +
        `${result.nextPlayer.name} ist an der Reihe.`,
      );

      return;
    }


    if (
      result.isFinalRound
    ) {
      this.#showMessage(
        `Nachziehrunde: ` +
        `${result.bankedPlayer.name} sichert ` +
        `${result.bankedScore.toLocaleString('de-DE')} Punkte. ` +
        `${result.nextPlayer.name} ist an der Reihe.`,
      );

      return;
    }


    this.#showMessage(
      `${result.bankedPlayer.name} sichert ` +
      `${result.bankedScore.toLocaleString('de-DE')} Punkte. ` +
      `${result.nextPlayer.name} ist an der Reihe.`,
    );

  } catch (error) {
    this.#finishCharacterReaction();


    this.#showError(
      error instanceof Error
        ? error.message
        : 'Der Score konnte nicht gespeichert werden.',
    );
  }
}


async #handleLose() {
  if (
    this.isCharacterReactionPlaying
  ) {
    return;
  }


  this.#startCharacterReaction();


  try {
    const result =
      this.scoreboardTurnController
        .loseTurn();


    await this.#finishLostTurn(
      result,
      false,
    );

  } catch (error) {
    this.#finishCharacterReaction();


    this.#showError(
      error instanceof Error
        ? error.message
        : 'Der Zug konnte nicht verworfen werden.',
    );
  }
}


async #handleFirstRollBust() {
  if (
    this.isCharacterReactionPlaying
  ) {
    return;
  }


  this.#startCharacterReaction();


  try {
    const result =
      this.scoreboardTurnController
        .loseTurnOnFirstRoll();


    await this.#finishLostTurn(
      result,
      true,
    );

  } catch (error) {
    this.#finishCharacterReaction();


    this.#showError(
      error instanceof Error
        ? error.message
        : 'Der Erstwurf-Fehlwurf konnte nicht verarbeitet werden.',
    );
  }
}


async #finishLostTurn(
  result,
  isFirstRollBust,
) {
  /*
   * =====================================================
   * FAIL / TRAUER
   * =====================================================
   *
   * Wenn der Charakter noch keine "fail"-Animation hat,
   * gibt ActiveCharacterView einfach false zurück.
   *
   * Das Spiel funktioniert also trotzdem.
   */
  await this.#playCharacterAnimation(
    'fail',
  );


  if (
    result.matchFinished
  ) {
    this.navigate(
      SCREENS.VICTORY,
    );

    return;
  }


  /*
   * Erst NACH der Verlustanimation
   * den nächsten Spieler anzeigen.
   */
  this.#finishCharacterReaction();


  this.#clearScoreInput();


  this.#renderSessionState();


  if (
    isFirstRollBust &&
    result.penaltyApplied > 0
  ) {
    this.#showMessage(
      `${result.lostPlayer.name} verliert ` +
      `${result.penaltyApplied.toLocaleString('de-DE')} zuletzt gesicherte Punkte. ` +
      `${result.nextPlayer.name} ist an der Reihe.`,
    );

    return;
  }


  if (
    isFirstRollBust
  ) {
    this.#showMessage(
      `${result.lostPlayer.name} hatte beim Erstwurf einen Fehlwurf. ` +
      `Es gab keine zuletzt gesicherten Punkte zum Abziehen. ` +
      `${result.nextPlayer.name} ist an der Reihe.`,
    );

    return;
  }


  this.#showMessage(
    `${result.lostPlayer.name} verwirft den Zug. ` +
    `${result.nextPlayer.name} ist an der Reihe.`,
  );
}


async #handleInstantWin() {
  if (
    this.isCharacterReactionPlaying
  ) {
    return;
  }


  this.#startCharacterReaction();


  try {
    this.scoreboardTurnController
      .finishInstantWin();


    /*
     * Später kann jeder Charakter eine eigene
     * victory-Animation besitzen.
     */
    const victoryPlayed =
      await this.#playCharacterAnimation(
        'victory',
      );


    /*
     * Solange noch keine victory-Animation existiert,
     * verwenden wir JUHUU als Fallback.
     */
    if (
      !victoryPlayed
    ) {
      await this.#playCharacterAnimation(
        'success',
      );
    }


    this.navigate(
      SCREENS.VICTORY,
    );

  } catch (error) {
    this.#finishCharacterReaction();


    this.#showError(
      error instanceof Error
        ? error.message
        : 'Der Sofortsieg konnte nicht verarbeitet werden.',
    );
  }
}

  #renderSessionState() {
    const state =
      this.gameSessionController
        .getState();


    const currentPlayer =
      state.players[
        state.currentPlayerIndex
      ];


    if (!currentPlayer) {
      return;
    }


    this.currentPlayerElement
      .textContent =
      `${currentPlayer.name} ist an der Reihe!`;


    this.#renderPlayers(
      state.players,
      state.currentPlayerIndex,
    );
  }


  #renderPlayers(
    players,
    currentPlayerIndex,
  ) {
    const fragment =
      document.createDocumentFragment();


    players.forEach(
      (
        player,
        index,
      ) => {
        /*
         * "player" existiert ausschließlich
         * INNERHALB dieses Callbacks.
         *
         * Dadurch kann kein
         * "player is not defined" entstehen.
         */
        const character =
          getCharacterById(
            player.characterId,
          );


        const card =
          document.createElement(
            'article',
          );


        card.className =
          'player-card';


        if (
          index ===
          currentPlayerIndex
        ) {
          card.classList.add(
            'player-card--active',
          );
        }


        const characterElement =
          document.createElement(
            'div',
          );


        characterElement.className =
          'player-card__character';


        /*
         * Echtes Portrait nur verwenden,
         * wenn bereits eines konfiguriert ist.
         */
        if (
          character?.portrait
        ) {
          const portrait =
            document.createElement(
              'img',
            );

          portrait.className =
            'player-card__portrait';

          portrait.src =
            character.portrait;

          portrait.alt =
            character.name;

          characterElement.append(
            portrait,
          );
        }


        const characterName =
          document.createElement(
            'strong',
          );


        characterName.className =
          'player-card__character-name';


        characterName.textContent =
          character
            ? character.name
            : 'Kein Charakter';


        const playerName =
          document.createElement(
            'strong',
          );


        playerName.className =
          'player-card__name';


        playerName.textContent =
          player.name;


        const total =
          document.createElement(
            'span',
          );


        total.textContent =
          `Gesamt: ${player.totalScore.toLocaleString('de-DE')}`;


        const lastScore =
          document.createElement(
            'span',
          );


        lastScore.textContent =
          `Letzter Zug: ${player.lastBankedScore.toLocaleString('de-DE')}`;


        characterElement.append(
          characterName,
        );


        card.append(
          characterElement,
          playerName,
          total,
          lastScore,
        );


        fragment.append(
          card,
        );
      },
    );


    this.playerCardsElement
      .replaceChildren(
        fragment,
      );

    const currentPlayer =
      players[
        currentPlayerIndex
      ];


    const currentCharacter =
      currentPlayer
        ? getCharacterById(
            currentPlayer.characterId,
          )
        : null;


    this.activeCharacterView
      ?.showCharacter(
        currentCharacter,
      );
  }


  #clearScoreInput() {
    this.scoreInput
      .value =
      '';

    this.scoreInput
      .focus();
  }


  #showMessage(
    message,
  ) {
    this.messageElement
      .classList.remove(
        'scoreboard-message--error',
      );

    this.messageElement
      .textContent =
      message;
  }


  #showError(
    message,
  ) {
    this.messageElement
      .classList.add(
        'scoreboard-message--error',
      );

    this.messageElement
      .textContent =
      message;
  }


  destroy() {
    this.bankButton
      ?.removeEventListener(
        'click',
        this.handleBank,
      );

    this.loseButton
      ?.removeEventListener(
        'click',
        this.handleLose,
      );

    this.firstRollBustButton
      ?.removeEventListener(
        'click',
        this.handleFirstRollBust,
      );

    this.instantWinButton
      ?.removeEventListener(
        'click',
        this.handleInstantWin,
      );

    this.backButton
      ?.removeEventListener(
        'click',
        this.handleBack,
      );


    this.probabilityPanel
      ?.destroy();


    this.probabilityPanel =
        null;

    this.activeCharacterView
      ?.destroy();


    this.activeCharacterView =
      null;
  }
}