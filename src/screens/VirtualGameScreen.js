import {
  SCREENS,
} from '../app/screens.js';

import {
  ActiveCharacterView,
} from '../ui/characters/ActiveCharacterView.js';

import {
  TURN_PHASES,
} from '../core/turn/TurnRules.js';

import {
  createPhaserGame,
} from '../phaser/createPhaserGame.js';

import {
  ProbabilityPanel,
} from '../ui/ProbabilityPanel.js';

    import {
      getCharacterById,
    } from '../config/characters.js';

import {
  resolveCharacterAppearance,
} from '../config/resolveCharacterAppearance.js';

import {
  calculateCoinReward,
} from '../core/coins/calculateCoinReward.js';

import {
  CoinRulesPanel,
} from '../ui/CoinRulesPanel.js';


export class VirtualGameScreen {
  constructor({
    navigate,
    virtualTurnController,
    gameSessionController,
    probabilityCalculator,
    audioService,
    coinService,
    accountStore,
  }) {
    this.navigate =
      navigate;

    this.coinService =
      coinService;

    this.accountStore =
      accountStore;
    
    this.audioService =
      audioService;

    this.virtualTurnController =
      virtualTurnController;

    this.gameSessionController =
      gameSessionController;

    this.probabilityCalculator =
      probabilityCalculator;

    /*
     * =====================================================
     * VISUAL COMPONENTS
     * =====================================================
     */

    this.activeCharacterView =
      null;

    this.probabilityPanel =
      null;

    this.coinRulesPanel =
      null;

    this.game =
      null;

    this.gameScene =
      null;


    /*
     * =====================================================
     * UI STATE
     * =====================================================
     */

    this.isRolling =
      false;

    this.isBankReactionPlaying =
      false;


    /*
     * Wichtig:
     *
     * Phaser erstellt GameScene.create()
     * nicht synchron mit new Phaser.Game().
     *
     * Deshalb darf der erste SPIN erst möglich sein,
     * wenn DiceViews + DiceRollAnimator existieren.
     */
    this.isPhaserReady =
      false;

    this.phaserReadyPromise =
      null;


    this.currentSelectionValidation =
      null;

    this.selectedInterpretationId =
      null;


    /*
     * =====================================================
     * DOM REFERENCES
     * =====================================================
     */

    this.currentPlayerElement =
      null;

    this.coinElement =
      null;

    this.unsubscribeAccount =
      null;

    this.turnScoreElement =
      null;

    this.activeDiceElement =
      null;

    this.removedDiceElement =
      null;

    this.statusElement =
      null;

    this.interpretationsElement =
      null;

    this.playerCardsElement =
      null;

    this.rollButton =
      null;

    this.bankButton =
      null;

    this.straightRerollButton =
      null;

    this.backButton =
      null;


    /*
     * =====================================================
     * EVENT HANDLERS
     * =====================================================
     */

    this.handleRoll =
      null;

    this.handleBank =
      null;

    this.handleStraightReroll =
      null;

    this.handleBack =
      null;

    this.handleInterpretationClick =
      null;
  }


  /*
   * =======================================================
   * MOUNT
   * =======================================================
   */

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
            'virtual',
        },
      );

      return;
    }


    rootElement.innerHTML = `
      <main
        class="screen game-screen"
      >

        <header
          class="game-header"
        >

          <button
            type="button"
            class="game-button game-button--secondary"
            data-action="back"
          >
            Menü
          </button>

          <h1
            data-current-player
          ></h1>

          <div
            class="game-header__coins"
            aria-label="Aktueller Coinstand"
          >
            <span
              class="game-header__coin-icon"
              aria-hidden="true"
            ></span>

            <strong data-virtual-coins>
              0
            </strong>
          </div>

        </header>


        <section
          class="turn-overview"
        >

          <div>
            <span>
              Aktueller Score
            </span>

            <strong
              data-turn-score
            >
              0
            </strong>
          </div>


          <div>
            <span>
              Aktive Würfel
            </span>

            <strong
              data-active-dice
            >
              6
            </strong>
          </div>


          <div>
            <span>
              Rausgenommen
            </span>

            <strong
              data-removed-dice
            >
              –
            </strong>
          </div>

        </section>


        <section
          class="dice-panel"
        >
          <div
            id="phaser-game"
          ></div>
        </section>


        <div
          class="active-character-stage"
          data-active-character-stage
          aria-hidden="true"
        ></div>


        <section
          class="scoring-debug"
        >

          <h2>
            Wertung
          </h2>


          <p
            data-selection-status
          >
            Würfle zuerst.
          </p>


          <div
            class="selection-interpretations"
            data-selection-interpretations
          ></div>


          <button
            type="button"
            class="game-button straight-reroll-button"
            data-action="straight-reroll"
            hidden
          >
            STRAẞEN-NACHWURF · 0 PUNKTE
          </button>

        </section>


        <section
          class="game-actions"
        >

          <button
            type="button"
            class="game-button game-button--primary"
            data-action="bank"
            disabled
          >
            CLOCK!
          </button>


          <button
            type="button"
            class="game-button"
            data-action="roll"
          >
            SPIN!
          </button>

        </section>


        <section
          class="player-list"
        >

          <h2>
          .
          </h2>


          <div
            class="player-list__cards"
            data-player-cards
          ></div>

        </section>

      </main>
    `;


    /*
     * =====================================================
     * DOM REFERENCES
     * =====================================================
     */

    this.currentPlayerElement =
      rootElement.querySelector(
        '[data-current-player]',
      );

      this.coinElement =
        rootElement.querySelector(
          '[data-virtual-coins]',
        );

      const syncCoinBalance =
        (state) => {
          if (
            !this.coinElement
          ) {
            return;
          }

          const coins =
            state.isAuthenticated
              ? Number(state.coins ?? 0)
              : 0;

          this.coinElement.textContent =
            coins.toLocaleString(
              'de-DE',
            );
          this.gameScene?.setDiceSkinId(
            state.isAuthenticated
              ? state.equippedCosmetics?.dice
              : null,
          );
        };

      /*
      * Coinstand beim Öffnen des Screens setzen.
      */
      syncCoinBalance(
        this.accountStore.getState(),
      );

      /*
      * Coinstand aktualisieren, sobald sich
      * der AccountStore verändert.
      */
      this.unsubscribeAccount =
        this.accountStore.subscribe(
          syncCoinBalance,
        );

    this.turnScoreElement =
      rootElement.querySelector(
        '[data-turn-score]',
      );

    this.activeDiceElement =
      rootElement.querySelector(
        '[data-active-dice]',
      );

    this.removedDiceElement =
      rootElement.querySelector(
        '[data-removed-dice]',
      );

    this.statusElement =
      rootElement.querySelector(
        '[data-selection-status]',
      );

    this.interpretationsElement =
      rootElement.querySelector(
        '[data-selection-interpretations]',
      );

    this.playerCardsElement =
      rootElement.querySelector(
        '[data-player-cards]',
      );

    this.rollButton =
      rootElement.querySelector(
        '[data-action="roll"]',
      );

    this.bankButton =
      rootElement.querySelector(
        '[data-action="bank"]',
      );

    this.straightRerollButton =
      rootElement.querySelector(
        '[data-action="straight-reroll"]',
      );

    this.backButton =
      rootElement.querySelector(
        '[data-action="back"]',
      );


    /*
     * =====================================================
     * ACTIVE CHARACTER
     * =====================================================
     */

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
        'Active-Character-Stage wurde nicht gefunden.',
      );
    }


    this.activeCharacterView =
      new ActiveCharacterView(
        activeCharacterStage,
        this.audioService,
      );


    /*
     * =====================================================
     * PHASER
     * =====================================================
     */

    const phaserHost =
      rootElement.querySelector(
        '#phaser-game',
      );


    if (
      !(
        phaserHost instanceof
        HTMLElement
      )
    ) {
      throw new Error(
        'Der Phaser-Container #phaser-game wurde nicht gefunden.',
      );
    }


    const phaser =
      createPhaserGame(
        phaserHost,
      );


    this.game =
      phaser.game;

    this.gameScene =
      phaser.gameScene;

    const accountState = this.accountStore.getState();

    this.gameScene.setDiceSkinId(
      accountState.isAuthenticated
        ? accountState.equippedCosmetics?.dice
        : null,
    );
    /*
     * GameScene existiert zwar schon als Instanz,
     * create() ist zu diesem Zeitpunkt aber eventuell
     * noch nicht durchgelaufen.
     */
    this.phaserReadyPromise =
      this.#waitForGameSceneReady();


    this.gameScene
      .setDiceSelectionHandler(
        (diceIndex) => {
          this.#handleDiceSelection(
            diceIndex,
          );
        },
      );


    /*
     * =====================================================
     * EVENT HANDLERS
     * =====================================================
     */

    this.handleRoll =
      this.#handlePrimaryAction.bind(
        this,
      );

    this.handleBank =
      this.#handleBank.bind(
        this,
      );

    this.handleStraightReroll =
      this.#handleStraightReroll.bind(
        this,
      );


    this.handleBack =
      () => {
        this.navigate(
          SCREENS.MODE_SELECT,
        );
      };


    this.handleInterpretationClick =
      (event) => {
        const button =
          event.target.closest(
            '[data-interpretation-id]',
          );


        if (!button) {
          return;
        }


        const interpretationId =
          button.dataset
            .interpretationId;


        if (!interpretationId) {
          return;
        }


        this.selectedInterpretationId =
          interpretationId;


        for (
          const interpretationButton
          of this.interpretationsElement
            .querySelectorAll(
              '[data-interpretation-id]',
            )
        ) {
          const isSelected =
            interpretationButton ===
            button;


          interpretationButton
            .classList
            .toggle(
              'scoring-interpretation--selected',
              isSelected,
            );


          interpretationButton
            .setAttribute(
              'aria-pressed',
              String(
                isSelected,
              ),
            );
        }


        this.statusElement
          .textContent =
          'Wertung ausgewählt. Mit WÄHLEN! übernehmen.';


        this.#syncActionButtons();
      };


    /*
     * =====================================================
     * LISTENERS
     * =====================================================
     */

    this.rollButton
      .addEventListener(
        'click',
        this.handleRoll,
      );

    this.bankButton
      .addEventListener(
        'click',
        this.handleBank,
      );

    this.straightRerollButton
      .addEventListener(
        'click',
        this.handleStraightReroll,
      );

    this.backButton
      .addEventListener(
        'click',
        this.handleBack,
      );

    this.interpretationsElement
      .addEventListener(
        'click',
        this.handleInterpretationClick,
      );


    /*
     * =====================================================
     * INITIAL STATE
     * =====================================================
     */

    this.currentSelectionValidation =
      null;

    this.selectedInterpretationId =
      null;


    /*
     * Spieler und Charakter dürfen sofort gerendert werden.
     */
    this.#renderSessionState();


    const state =
      this.gameSessionController
        .getState();


    /*
     * WICHTIG:
     *
     * Nicht mehr sofort prepareForNextRoll() aufrufen.
     *
     * Erst auf GameScene.create() warten.
     */
    void this.#initializePhaserForTurn(
      state.turn
        .activeDiceCount,
    );


    this.#hideStraightReroll();

    this.#syncActionButtons();


    /*
     * =====================================================
     * PROBABILITY PANEL
     * =====================================================
     */

    this.probabilityPanel =
      new ProbabilityPanel({
        calculator:
          this.probabilityCalculator,
        getSuggestedDiceCount:
          () =>
            this.gameSessionController
              .getState()
              .turn
              .activeDiceCount,
      });


    this.probabilityPanel.mount(
      rootElement,
    );

    this.coinRulesPanel =
      new CoinRulesPanel();

    this.coinRulesPanel.mount(
      rootElement,
    );
  }


  /*
   * =======================================================
   * PRIMARY ACTION
   * =======================================================
   */

  #handlePrimaryAction() {
    /*
     * Während einer Character-Reaktion keine
     * weiteren Aktionen annehmen.
     */
    if (
      this.isBankReactionPlaying
    ) {
      return;
    }


    const state =
      this.gameSessionController
        .getState();


    if (
      state.turn.phase ===
      TURN_PHASES.READY_TO_ROLL
    ) {
      void this.#handleRoll();

      return;
    }


    if (
      !this.selectedInterpretationId
    ) {
      return;
    }


    this.#confirmInterpretation(
      this.selectedInterpretationId,
    );
  }


  /*
   * =======================================================
   * PHASER READY
   * =======================================================
   */

  #waitForGameSceneReady() {
    const scene =
      this.gameScene;


    if (!scene) {
      return Promise.reject(
        new Error(
          'GameScene wurde noch nicht erstellt.',
        ),
      );
    }


    const isReady =
      () =>
        this.gameScene ===
          scene &&
        Array.isArray(
          scene.diceViews,
        ) &&
        scene.diceViews.length >
          0 &&
        Boolean(
          scene.diceRollAnimator,
        );


    if (
      isReady()
    ) {
      return Promise.resolve();
    }


    return new Promise(
      (
        resolve,
        reject,
      ) => {
        const startedAt =
          performance.now();


        const checkReady =
          () => {
            /*
             * Screen wurde zwischenzeitlich zerstört.
             */
            if (
              this.gameScene !==
              scene
            ) {
              reject(
                new Error(
                  'GameScene wurde während der Initialisierung ersetzt.',
                ),
              );

              return;
            }


            if (
              isReady()
            ) {
              resolve();

              return;
            }


            /*
             * Sicherheits-Timeout.
             */
            if (
              performance.now() -
                startedAt >
              5_000
            ) {
              reject(
                new Error(
                  'GameScene wurde nicht rechtzeitig bereit.',
                ),
              );

              return;
            }


            window.requestAnimationFrame(
              checkReady,
            );
          };


        checkReady();
      },
    );
  }


  async #initializePhaserForTurn(
    activeDiceCount,
  ) {
    try {
      await this.phaserReadyPromise;


      if (
        !this.gameScene
      ) {
        return;
      }


      this.gameScene
        .prepareForNextRoll(
          activeDiceCount,
        );


      this.isPhaserReady =
        true;


      this.#syncActionButtons();

    } catch (error) {
      console.error(
        'Phaser konnte nicht initialisiert werden:',
        error,
      );
    }
  }


  /*
   * =======================================================
   * WÜRFELN
   * =======================================================
   */

  async #handleRoll() {
    if (
      this.isRolling ||
      this.isBankReactionPlaying ||
      !this.isPhaserReady
    ) {
      return;
    }


    this.isRolling =
      true;


    this.currentSelectionValidation =
      null;

    this.selectedInterpretationId =
      null;


    try {
      this.#hideStraightReroll();


      this.interpretationsElement
        .replaceChildren();


      this.gameScene
        .setSelectedDiceIndices(
          [],
        );


      this.gameScene
        .setDiceSelectionEnabled(
          false,
        );


      this.#renderMessage(
        'Würfel rollen...',
      );


      this.#syncActionButtons();


      /*
       * Echtes Ergebnis zuerst berechnen.
       */
      const result =
        this.virtualTurnController
          .rollDice();

      
      this.audioService
        .playSfx(
          'diceRoll',
        );
        try {
          await this.gameScene
            .showRoll(
              result.diceResults,
            );

        } finally {
          this.audioService
            .stopSfx(
              'diceRoll',
            );
        }

      this.#renderSessionState();


      if (
        result.isBust
      ) {
        this.#finishBust(
          result,
        );

        return;
      }


      const hasNormalScoring =
        result.scoringOptions
          .length > 0;


      const hasStraightReroll =
        result
          .straightRerollOption
          ?.isAvailable ===
        true;


      this.#renderStraightReroll(
        result
          .straightRerollOption,
      );


      this.gameScene
        .setDiceSelectionEnabled(
          hasNormalScoring,
        );


      if (
        hasNormalScoring &&
        hasStraightReroll
      ) {
        this.#renderMessage(
          'Wähle punktende Würfel oder nutze den Straßen-Nachwurf.',
        );

        return;
      }


      if (
        hasStraightReroll
      ) {
        this.#renderMessage(
          'Keine direkte Wertung. Der Straßen-Nachwurf verhindert den Fehlwurf.',
        );

        return;
      }


      if (
        hasNormalScoring
      ) {
        this.#renderMessage(
          'Wähle die Würfel, die du werten möchtest.',
        );

        return;
      }


      throw new Error(
        'Ungültiger Zustand nach dem Würfeln.',
      );

    } finally {
      this.isRolling =
        false;


      this.#syncActionButtons();
    }
  }


  /*
   * =======================================================
   * WÜRFELAUSWAHL
   * =======================================================
   */

  #handleDiceSelection(
    diceIndex,
  ) {
    const result =
      this.virtualTurnController
        .toggleDiceSelection(
          diceIndex,
        );


    const validation =
      result.selectionValidation;


    this.currentSelectionValidation =
      validation;


    this.gameScene
      .setSelectedDiceIndices(
        result.selectedDiceIndices,
      );


    /*
     * Auswahl wurde verändert.
     * Alte Interpretation darf nicht übernommen werden.
     */
    this.selectedInterpretationId =
      null;


    this.#renderSelectionValidation(
      validation,
    );


    this.#syncActionButtons();
  }


  /*
   * =======================================================
   * SELECTION VALIDATION
   * =======================================================
   */

  #renderSelectionValidation(
    validation,
  ) {
    this.interpretationsElement
      .replaceChildren();


    if (
      validation
        .selectedDiceIndices
        .length ===
      0
    ) {
      this.statusElement
        .textContent =
        'Wähle die Würfel, die du werten möchtest.';

      return;
    }


    if (
      !validation.isValid
    ) {
      this.statusElement
        .textContent =
        'Diese Würfelauswahl ist keine gültige Wertung.';

      return;
    }


    this.statusElement
      .textContent =
      validation
        .interpretations
        .length ===
      1
        ? 'Gültige Wertung:'
        : 'Mehrere gültige Wertungen:';


    for (
      const interpretation
      of validation
        .interpretations
    ) {
      const button =
        document.createElement(
          'button',
        );


      button.type =
        'button';

      button.className =
        'scoring-interpretation';


      if (
        interpretation.id
      ) {
        button.dataset
          .interpretationId =
          interpretation.id;


        button.setAttribute(
          'aria-pressed',
          'false',
        );
      }


      if (
        interpretation.isHotDice
      ) {
        button.classList.add(
          'scoring-interpretation--hot',
        );
      }


      const title =
        document.createElement(
          'strong',
        );


      title.textContent =
        interpretation.label;


      const details =
        document.createElement(
          'span',
        );


      const removedCount =
        interpretation
          .removedDiceIndices
          .length;


      details.textContent =
        `${interpretation.score.toLocaleString('de-DE')} Punkte · ` +
        `${removedCount} Würfel raus`;


      if (
        interpretation.isHotDice
      ) {
        const hotDice =
          document.createElement(
            'span',
          );


        hotDice.textContent =
          'HEISSE WÜRFEL';


        button.append(
          title,
          details,
          hotDice,
        );

      } else {
        button.append(
          title,
          details,
        );
      }


      this.interpretationsElement
        .append(
          button,
        );
    }
  }


  /*
   * =======================================================
   * WERTUNG BESTÄTIGEN
   * =======================================================
   */

  #confirmInterpretation(
    interpretationId,
  ) {
    this.#hideStraightReroll();


    const result =
      this.virtualTurnController
        .applySelectedScoring(
          interpretationId,
        );


    this.currentSelectionValidation =
      null;

    this.selectedInterpretationId =
      null;


    this.gameScene
      .setDiceSelectionEnabled(
        false,
      );


    this.gameScene
      .setSelectedDiceIndices(
        [],
      );


    this.#renderSessionState();


    /*
     * SOFORTSIEG
     */
    if (
      result.isInstantWin
    ) {
      this.gameSessionController
        .finishInstantWin({
          instantWinScore:
            result.appliedScore,
        });
      const earnedCoins =
        calculateCoinReward(
          result.appliedScore,
        );

      console.info(
        '[Coin-Test] Sofortsieg',
        {
          instantWinScore:
            result.appliedScore,

          earnedCoins,
        },
      );
      if (
        earnedCoins > 0
      ) {
        this.coinService.enqueueReward({
          matchId:
            this.gameSessionController
              .getState()
              .matchId,

          eventType:
            'instant_win',

          bankedScore:
            result.appliedScore,
        });
      }

      this.navigate(
        SCREENS.VICTORY,
      );


      return;
    }


    this.gameScene
      .prepareForNextRoll(
        result.turnState
          .activeDiceCount,
      );


    if (
      result.isHotDice
    ) {
      this.#renderMessage(
        `${result.appliedScore.toLocaleString('de-DE')} Punkte. ` +
        'HEISSE WÜRFEL! Du musst mit allen sechs Würfeln weiterwürfeln.',
      );

    } else {
      this.#renderMessage(
        `${result.appliedScore.toLocaleString('de-DE')} Punkte zum Zug hinzugefügt. ` +
        'Weiterwürfeln oder sichern.',
      );
    }


    this.#syncActionButtons();
  }


  /*
   * =======================================================
   * STRAẞEN-NACHWURF
   * =======================================================
   */

  #handleStraightReroll() {
    if (
      this.isBankReactionPlaying
    ) {
      return;
    }


    this.#hideStraightReroll();


    this.currentSelectionValidation =
      null;

    this.selectedInterpretationId =
      null;


    const result =
      this.virtualTurnController
        .useStraightReroll();


    this.gameScene
      .setDiceSelectionEnabled(
        false,
      );


    this.gameScene
      .setSelectedDiceIndices(
        [],
      );


    this.gameScene
      .prepareForNextRoll(
        result.turnState
          .activeDiceCount,
      );


    this.#renderSessionState();


    this.#renderMessage(
      'Straßen-Nachwurf gewählt: ' +
      '0 zusätzliche Punkte, keine Würfel entfernt. ' +
      'Du musst erneut würfeln.',
    );


    this.#syncActionButtons();
  }


  /*
   * =======================================================
   * SICHERN
   * =======================================================
   */

  async #handleBank() {

    if (
      this.isBankReactionPlaying
    ) {
      return;
    }


    if (
      !this.isPhaserReady
    ) {
      return;
    }


    if (
      !this.gameSessionController
        .canBankCurrentTurn()
    ) {
      return;
    }


    this.isBankReactionPlaying =
      true;


    this.#hideStraightReroll();


    this.currentSelectionValidation =
      null;

    this.selectedInterpretationId =
      null;


    /*
     * Während der Animation:
     * Würfel und Buttons sperren.
     */
    this.gameScene
      .setDiceSelectionEnabled(
        false,
      );


    this.#syncActionButtons();


    const result =
      this.gameSessionController
        .bankCurrentTurn();

    const earnedCoins =
      calculateCoinReward(
        result.bankedScore,
      );

    console.info(
      '[Coin-Test] Reguläre Sicherung',
      {
        bankedScore:
          result.bankedScore,

        earnedCoins,
      },
    );
    if (
      earnedCoins > 0
    ) {
      this.coinService.enqueueReward({
        matchId:
          this.gameSessionController
            .getState()
            .matchId,

        eventType:
          'bank',

        bankedScore:
          result.bankedScore,
      });
    }


    await this.audioService
      .playSfx(
        'bankScore',
      );


    await this.activeCharacterView
      ?.playAnimation(
        'success',
      );


    /*
     * =====================================================
     * ERST JETZT SPIELERWECHSEL DARSTELLEN
     * =====================================================
     */

    if (
      result.matchFinished
    ) {
      this.isBankReactionPlaying =
        false;


      this.navigate(
        SCREENS.VICTORY,
      );


      return;
    }


    this.gameScene
      .setSelectedDiceIndices(
        [],
      );


    this.gameScene
      .prepareForNextRoll(
        result.turnState
          .activeDiceCount,
      );


    /*
     * Jetzt erst neuer Spieler + neuer Charakter.
     */
    this.#renderSessionState();


    this.isBankReactionPlaying =
      false;


    if (
      result.finalRoundStarted
    ) {
      this.#renderMessage(
        `${result.bankedPlayer.name} erreicht ` +
        `${result.bankedPlayer.totalScore.toLocaleString('de-DE')} Punkte. ` +
        `Die Nachziehrunde beginnt! ` +
        `${result.nextPlayer.name} ist an der Reihe.`,
      );


      this.#syncActionButtons();


      return;
    }


    if (
      result.isFinalRound
    ) {
      this.#renderMessage(
        `Nachziehrunde: ` +
        `${result.bankedPlayer.name} sichert ` +
        `${result.bankedScore.toLocaleString('de-DE')} Punkte. ` +
        `${result.nextPlayer.name} ist als Nächstes dran.`,
      );


      this.#syncActionButtons();


      return;
    }


    this.#renderMessage(
      `${result.bankedPlayer.name} sichert ` +
      `${result.bankedScore.toLocaleString('de-DE')} Punkte. ` +
      `${result.nextPlayer.name} ist an der Reihe.`,
    );


    this.#syncActionButtons();
  }


  /*
   * =======================================================
   * FEHLWURF
   * =======================================================
   */

  #finishBust(
    rollResult,
  ) {
    this.#hideStraightReroll();


    this.currentSelectionValidation =
      null;

    this.selectedInterpretationId =
      null;


    this.gameScene
      .setDiceSelectionEnabled(
        false,
      );


    this.gameScene
      .setSelectedDiceIndices(
        [],
      );


    const result =
      this.gameSessionController
        .finishBustedTurn({
          isFirstRollBust:
            rollResult
              .isFirstRollBust,
        });


    if (
      result.matchFinished
    ) {
      this.navigate(
        SCREENS.VICTORY,
      );


      return;
    }


    this.gameScene
      .prepareForNextRoll(
        result.turnState
          .activeDiceCount,
      );


    this.#renderSessionState();


    if (
      rollResult
        .isFirstRollBust &&
      result.penaltyApplied >
        0
    ) {
      this.#renderMessage(
        `${result.bustedPlayer.name} hatte direkt im ersten Wurf einen Fehlwurf. ` +
        `${result.penaltyApplied.toLocaleString('de-DE')} zuletzt gesicherte Punkte wurden abgezogen. ` +
        `${result.nextPlayer.name} ist jetzt an der Reihe.`,
      );


      this.#syncActionButtons();


      return;
    }


    if (
      rollResult
        .isFirstRollBust
    ) {
      this.#renderMessage(
        `${result.bustedPlayer.name} hatte direkt im ersten Wurf einen Fehlwurf. ` +
        `Es gab keinen gesicherten Wert zum Abziehen. ` +
        `${result.nextPlayer.name} ist jetzt an der Reihe.`,
      );


      this.#syncActionButtons();


      return;
    }


    this.#renderMessage(
      `${result.bustedPlayer.name} hat einen Fehlwurf. ` +
      `Die ungesicherten Zugpunkte sind verloren. ` +
      `${result.nextPlayer.name} ist jetzt an der Reihe.`,
    );


    this.#syncActionButtons();
  }


  /*
   * =======================================================
   * STRAẞEN-NACHWURF UI
   * =======================================================
   */

  #renderStraightReroll(
    option,
  ) {
    if (
      !option?.isAvailable
    ) {
      this.#hideStraightReroll();

      return;
    }


    const labels =
      [
        ...new Set(
          option.matches.map(
            (match) =>
              match.label,
          ),
        ),
      ];


    this.straightRerollButton
      .hidden =
      false;


    this.straightRerollButton
      .title =
      labels.join(
        ' / ',
      );
  }


  #hideStraightReroll() {
    if (
      !this.straightRerollButton
    ) {
      return;
    }


    this.straightRerollButton
      .hidden =
      true;


    this.straightRerollButton
      .title =
      '';
  }


  /*
   * =======================================================
   * SESSION RENDERING
   * =======================================================
   */

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


    this.#renderTurnState(
      state.turn,
    );


    this.#renderPlayers(
      state.players,
      state.currentPlayerIndex,
    );


    const currentCharacter =
      resolveCharacterAppearance(
        currentPlayer.characterId,
        currentPlayer.skinId,
      );


    this.activeCharacterView
      ?.showCharacter(
        currentCharacter,
      );
  }


  /*
   * =======================================================
   * TURN STATE
   * =======================================================
   */

  #renderTurnState(
    turn,
  ) {
    this.turnScoreElement
      .textContent =
      turn.turnScore
        .toLocaleString(
          'de-DE',
        );


    this.activeDiceElement
      .textContent =
      String(
        turn.activeDiceCount,
      );


    this.removedDiceElement
      .textContent =
      turn.removedDiceValues
        .length >
      0
        ? turn
            .removedDiceValues
            .join(', ')
        : '–';
  }


  /*
   * =======================================================
   * PLAYER CARDS
   * =======================================================
   */

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
      const character =
        resolveCharacterAppearance(
          player.characterId,
          player.skinId,
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


        const characterLabel =
          document.createElement(
            'span',
          );


        characterLabel.className =
          'player-card__character-label';


        characterLabel.textContent =
          '';


        const characterName =
          document.createElement(
            'strong',
          );


        characterName.className =
          'player-card__character-name';


        characterName.textContent =
          character
            ? character.name
            : 'Nicht gewählt';


        characterElement.append(
          characterLabel,
          characterName,
        );


        const name =
          document.createElement(
            'strong',
          );


        name.className =
          'player-card__name';


        name.textContent =
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


        card.append(
          characterElement,
          name,
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
  }


  /*
   * =======================================================
   * BUTTON STATE
   * =======================================================
   */

  #syncActionButtons() {
    const state =
      this.gameSessionController
        .getState();


    const turn =
      state.turn;


    /*
     * =====================================================
     * SPIN / WÄHLEN
     * =====================================================
     */

    if (
      this.rollButton
    ) {
      const isReadyToRoll =
        turn.phase ===
        TURN_PHASES.READY_TO_ROLL;


      if (
        isReadyToRoll
      ) {
        this.rollButton
          .textContent =
          'SPIN!';


        this.rollButton.disabled =
          !this.isPhaserReady ||
          this.isRolling ||
          this.isBankReactionPlaying;

      } else {
        this.rollButton
          .textContent =
          'WÄHLEN!';


        this.rollButton.disabled =
          !this.isPhaserReady ||
          this.isRolling ||
          this.isBankReactionPlaying ||
          !this.selectedInterpretationId;
      }
    }


    /*
     * =====================================================
     * CLOCK
     * =====================================================
     */

    if (
      this.bankButton
    ) {
      this.bankButton.disabled =
        !this.isPhaserReady ||
        this.isRolling ||
        this.isBankReactionPlaying ||
        !this.gameSessionController
          .canBankCurrentTurn();
    }
  }


  /*
   * =======================================================
   * STATUS MESSAGE
   * =======================================================
   */

  #renderMessage(
    message,
  ) {
    this.statusElement
      .textContent =
      message;


    this.interpretationsElement
      .replaceChildren();
  }


  /*
   * =======================================================
   * CLEANUP
   * =======================================================
   */

  destroy() {
    this.unsubscribeAccount?.();

    this.unsubscribeAccount =
      null;

    this.coinElement =
      null;

    this.rollButton
      ?.removeEventListener(
        'click',
        this.handleRoll,
      );


    this.bankButton
      ?.removeEventListener(
        'click',
        this.handleBank,
      );


    this.straightRerollButton
      ?.removeEventListener(
        'click',
        this.handleStraightReroll,
      );


    this.backButton
      ?.removeEventListener(
        'click',
        this.handleBack,
      );


    this.interpretationsElement
      ?.removeEventListener(
        'click',
        this.handleInterpretationClick,
      );


    this.probabilityPanel
      ?.destroy();


    this.probabilityPanel =
      null;

    this.coinRulesPanel?.destroy();

    this.coinRulesPanel = null;

    this.activeCharacterView
      ?.destroy();


    this.activeCharacterView =
      null;


    this.currentSelectionValidation =
      null;


    this.selectedInterpretationId =
      null;


    this.isPhaserReady =
      false;


    this.phaserReadyPromise =
      null;


    this.game
      ?.destroy(
        true,
      );


    this.game =
      null;


    this.gameScene =
      null;
  }
}