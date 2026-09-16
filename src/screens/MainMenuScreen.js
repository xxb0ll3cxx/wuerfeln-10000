import {
  SCREENS,
} from '../app/screens.js';


export class MainMenuScreen {
  constructor({
    navigate,
  }) {
    this.navigate =
      navigate;


    this.startButton =
      null;


    this.handleStart =
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
          main-menu-screen
        "
      >

        <!--
          ================================================
          LOGO
          ================================================

          Das sichtbare Logo kommt vollständig aus
          einem PNG-Asset.

          Der H1 bleibt für Semantik / Accessibility
          unsichtbar vorhanden.
        -->

        <h1
          class="main-menu__accessible-title"
        >
          Würfeln 10.000
        </h1>


        <div
          class="main-menu__logo"
          aria-hidden="true"
        ></div>


        <!--
          ================================================
          START BUTTON
          ================================================

          Der Wrapper positioniert den Button.

          Der Button selbst bleibt ein echtes
          interaktives HTML-Element.
        -->

        <div
          class="main-menu__start-slot"
        >
          <button
            type="button"
            class="main-menu__start-button"
            data-action="start"
            aria-label="Spiel starten"
          ></button>
        </div>

      </main>
    `;


    this.startButton =
      rootElement.querySelector(
        '[data-action="start"]',
      );


    if (
      !(
        this.startButton instanceof
        HTMLButtonElement
      )
    ) {
      throw new Error(
        'START-Button wurde im Hauptmenü nicht gefunden.',
      );
    }


    /*
     * =====================================================
     * NAVIGATION
     * =====================================================
     *
     * Die bestehende Funktion bleibt unverändert:
     *
     * Hauptmenü
     *     ↓
     * Modusauswahl
     */

    this.handleStart =
      () => {
        this.navigate(
          SCREENS.MODE_SELECT,
        );
      };


    this.startButton
      .addEventListener(
        'click',
        this.handleStart,
      );
  }


  /*
   * =======================================================
   * CLEANUP
   * =======================================================
   */

  destroy() {
    this.startButton
      ?.removeEventListener(
        'click',
        this.handleStart,
      );


    this.startButton =
      null;


    this.handleStart =
      null;
  }
}