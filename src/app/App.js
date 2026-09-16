import {
  ScreenManager,
} from './ScreenManager.js';

import {
  ScoreboardTurnController,
} from '../controllers/ScoreboardTurnController.js';

import {
  ScoreboardGameScreen,
} from '../screens/ScoreboardGameScreen.js';

import {
  ProbabilityCalculator,
} from '../core/probability/ProbabilityCalculator.js';

import {
  SCREENS,
} from './screens.js';

import {
  VictoryScreen,
} from '../screens/VictoryScreen.js';

import {
  MainMenuScreen,
} from '../screens/MainMenuScreen.js';

import {
  ModeSelectScreen,
} from '../screens/ModeSelectScreen.js';

import {
  PlayerSetupScreen,
} from '../screens/PlayerSetupScreen.js';

import {
  VirtualGameScreen,
} from '../screens/VirtualGameScreen.js';

import {
  GameStore,
} from '../state/GameStore.js';

import {
  createInitialState,
} from '../state/createInitialState.js';

import {
  ScoringEngine,
} from '../core/scoring/ScoringEngine.js';

import {
  VirtualTurnController,
} from '../controllers/VirtualTurnController.js';

import {
  PlayerSetupController,
} from '../controllers/PlayerSetupController.js';

import {
  GameSessionController,
} from '../controllers/GameSessionController.js';


export class App {
  constructor(
    rootElement,
    audioService,
  ) {
    if (!rootElement) {
      throw new Error(
        'App konnte nicht gestartet werden: Root-Element fehlt.',
      );
    }


    if (!audioService) {
      throw new Error(
        'App konnte nicht gestartet werden: AudioService fehlt.',
      );
    }


    /*
     * =====================================================
     * SERVICES
     * =====================================================
     */

    this.audioService =
      audioService;


    /*
     * =====================================================
     * GAME SYSTEMS
     * =====================================================
     */

    this.gameStore =
      new GameStore(
        createInitialState(),
      );


    this.scoringEngine =
      new ScoringEngine();


    this.virtualTurnController =
      new VirtualTurnController(
        this.gameStore,
        this.scoringEngine,
      );


    this.probabilityCalculator =
      new ProbabilityCalculator(
        this.scoringEngine,
      );


    this.playerSetupController =
      new PlayerSetupController();


    this.gameSessionController =
      new GameSessionController(
        this.gameStore,
      );


    this.scoreboardTurnController =
      new ScoreboardTurnController(
        this.gameSessionController,
      );


    /*
     * =====================================================
     * SCREEN MANAGER
     * =====================================================
     */

    this.screenManager =
      new ScreenManager(
        rootElement,
        this.audioService,
      );


    this.navigate =
      this.screenManager
        .show
        .bind(
          this.screenManager,
        );


    this.#registerScreens();
  }


  /*
   * =======================================================
   * START
   * =======================================================
   */

  start() {
    this.navigate(
      SCREENS.MAIN_MENU,
    );
  }


  /*
   * =======================================================
   * SCREENS
   * =======================================================
   */

  #registerScreens() {
    /*
     * SCOREBOARD
     */

    this.screenManager.register(
      SCREENS.SCOREBOARD_GAME,

      () =>
        new ScoreboardGameScreen({
          navigate:
            this.navigate,

          gameSessionController:
            this.gameSessionController,

          scoreboardTurnController:
            this.scoreboardTurnController,

          probabilityCalculator:
            this.probabilityCalculator,

          audioService:
            this.audioService,
        }),
    );


    /*
     * MAIN MENU
     */

    this.screenManager.register(
      SCREENS.MAIN_MENU,

      () =>
        new MainMenuScreen({
          navigate:
            this.navigate,
        }),
    );


    /*
     * MODE SELECT
     */

    this.screenManager.register(
      SCREENS.MODE_SELECT,

      () =>
        new ModeSelectScreen({
          navigate:
            this.navigate,
        }),
    );


    /*
     * PLAYER SETUP
     */

    this.screenManager.register(
      SCREENS.PLAYER_SETUP,

      () =>
        new PlayerSetupScreen({
          navigate:
            this.navigate,

          playerSetupController:
            this.playerSetupController,

          gameSessionController:
            this.gameSessionController,
        }),
    );


    /*
     * VICTORY
     */

    this.screenManager.register(
      SCREENS.VICTORY,

      () =>
        new VictoryScreen({
          navigate:
            this.navigate,

          gameSessionController:
            this.gameSessionController,

          audioService:
            this.audioService,
        }),
    );


    /*
     * VIRTUAL GAME
     */

    this.screenManager.register(
      SCREENS.VIRTUAL_GAME,

      () =>
        new VirtualGameScreen({
          navigate:
            this.navigate,

          virtualTurnController:
            this.virtualTurnController,

          gameSessionController:
            this.gameSessionController,

          probabilityCalculator:
            this.probabilityCalculator,

          audioService:
            this.audioService,
        }),
    );
  }
}