import {
  SCREENS,
} from '../app/screens.js';


export class ModeSelectScreen {
  constructor({
    navigate,
  }) {
    this.navigate =
      navigate;


    this.virtualButton =
      null;

    this.scoreboardButton =
      null;

    this.backButton =
      null;


    this.handleVirtual =
      null;

    this.handleScoreboard =
      null;

    this.handleBack =
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
    rootElement.innerHTML = `
      <main
        class="
          screen
          mode-select-screen
        "
      >

        <!--
          ===================================================
          ACCESSIBLE TITLE
          ===================================================

          Die eigentliche visuelle Gestaltung befindet sich
          im Hintergrund / in den Button-Assets.

          Die Überschrift bleibt für Screenreader erhalten.
        -->

        <h1
          class="mode-select__accessible-title"
        >
          Spielmodus auswählen
        </h1>


        <!--
          ===================================================
          VIRTUAL MODE
          ===================================================
        -->

        <div
          class="
            mode-select__button-slot
            mode-select__button-slot--virtual
          "
        >
          <button
            type="button"
            class="
              mode-select__button
              mode-select__button--virtual
            "
            data-action="virtual"
            aria-label="Virtuellen Spielmodus starten"
          ></button>
        </div>


        <!--
          ===================================================
          SCOREBOARD MODE
          ===================================================
        -->

        <div
          class="
            mode-select__button-slot
            mode-select__button-slot--scoreboard
          "
        >
          <button
            type="button"
            class="
              mode-select__button
              mode-select__button--scoreboard
            "
            data-action="scoreboard"
            aria-label="Scoreboard-Spielmodus starten"
          ></button>
        </div>


        <!--
          ===================================================
          BACK
          ===================================================
        -->

        <div
          class="
            mode-select__button-slot
            mode-select__button-slot--back
          "
        >
          <button
            type="button"
            class="
              mode-select__button
              mode-select__button--back
            "
            data-action="back"
            aria-label="Zurück zum Hauptmenü"
          ></button>
        </div>

      </main>
    `;


    /*
     * =====================================================
     * DOM REFERENCES
     * =====================================================
     */

    this.virtualButton =
      rootElement.querySelector(
        '[data-action="virtual"]',
      );


    this.scoreboardButton =
      rootElement.querySelector(
        '[data-action="scoreboard"]',
      );


    this.backButton =
      rootElement.querySelector(
        '[data-action="back"]',
      );


    if (
      !(
        this.virtualButton instanceof
        HTMLButtonElement
      ) ||
      !(
        this.scoreboardButton instanceof
        HTMLButtonElement
      ) ||
      !(
        this.backButton instanceof
        HTMLButtonElement
      )
    ) {
      throw new Error(
        'Die Buttons der Modusauswahl konnten nicht initialisiert werden.',
      );
    }


    /*
     * =====================================================
     * EVENT HANDLERS
     * =====================================================
     */

    this.handleVirtual =
      () => {
        this.navigate(
          SCREENS.PLAYER_SETUP,
          {
            mode:
              'virtual',
          },
        );
      };


    this.handleScoreboard =
      () => {
        this.navigate(
          SCREENS.PLAYER_SETUP,
          {
            mode:
              'scoreboard',
          },
        );
      };


    this.handleBack =
      () => {
        this.navigate(
          SCREENS.MAIN_MENU,
        );
      };


    /*
     * =====================================================
     * LISTENERS
     * =====================================================
     */

    this.virtualButton
      .addEventListener(
        'click',
        this.handleVirtual,
      );


    this.scoreboardButton
      .addEventListener(
        'click',
        this.handleScoreboard,
      );


    this.backButton
      .addEventListener(
        'click',
        this.handleBack,
      );
  }


  /*
   * =======================================================
   * CLEANUP
   * =======================================================
   */

  destroy() {
    this.virtualButton
      ?.removeEventListener(
        'click',
        this.handleVirtual,
      );


    this.scoreboardButton
      ?.removeEventListener(
        'click',
        this.handleScoreboard,
      );


    this.backButton
      ?.removeEventListener(
        'click',
        this.handleBack,
      );


    this.virtualButton =
      null;

    this.scoreboardButton =
      null;

    this.backButton =
      null;


    this.handleVirtual =
      null;

    this.handleScoreboard =
      null;

    this.handleBack =
      null;
  }
}