import {
  SCREENS,
} from './screens.js';


/*
 * =========================================================
 * SCREEN MUSIC
 * =========================================================
 *
 * Hier wird zentral festgelegt,
 * welche Musik zu welchem Screen gehört.
 */

const SCREEN_MUSIC =
  Object.freeze({
    [SCREENS.MAIN_MENU]:
      'menuMusic',

    [SCREENS.MODE_SELECT]:
      'menuMusic',

    [SCREENS.PLAYER_SETUP]:
      'menuMusic',

    [SCREENS.VIRTUAL_GAME]:
      'gameMusic',

    [SCREENS.SCOREBOARD_GAME]:
      'gameMusic',

    /*
     * Victory bekommt keine Background-Musik.
     * Dort kommt später der Victory-SFX.
     */
    [SCREENS.VICTORY]:
      null,
  });


export class ScreenManager {
  constructor(
    rootElement,
    audioService,
  ) {
    this.rootElement =
      rootElement;


    this.audioService =
      audioService;


    this.screenFactories =
      new Map();


    this.currentScreen =
      null;
  }


  register(
    screenName,
    factory,
  ) {
    this.screenFactories
      .set(
        screenName,
        factory,
      );
  }


  show(
    screenName,
    params = {},
  ) {
    const factory =
      this.screenFactories
        .get(
          screenName,
        );


    if (!factory) {
      throw new Error(
        `Unbekannter Screen: ${screenName}`,
      );
    }


    /*
     * =====================================================
     * ALTEN SCREEN BEENDEN
     * =====================================================
     */

    this.currentScreen
      ?.destroy?.();


    this.rootElement
      .replaceChildren();


    /*
     * =====================================================
     * MUSIK FÜR NEUEN SCREEN
     * =====================================================
     */

    this.#syncMusic(
      screenName,
    );


    /*
     * =====================================================
     * NEUEN SCREEN ERSTELLEN
     * =====================================================
     */

    const nextScreen =
      factory();


    this.currentScreen =
      nextScreen;


    nextScreen.mount(
      this.rootElement,
      params,
    );
  }


  /*
   * =======================================================
   * MUSIC
   * =======================================================
   */

  #syncMusic(
    screenName,
  ) {
    if (
      !this.audioService
    ) {
      return;
    }


    const musicKey =
      SCREEN_MUSIC[
        screenName
      ];


    if (
      musicKey
    ) {
      void this.audioService
        .playMusic(
          musicKey,
        );


      return;
    }


    /*
     * Screen ohne Background-Musik,
     * aktuell Victory.
     */
    this.audioService
      .stopMusic();
  }
}