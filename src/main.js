import './styles/variables.css';
import './styles/main.css';
import './styles/viewport.css';
import './styles/components/buttons.css';
import {
  AccountService,
} from './services/AccountService.js';
import {
  App,
} from './app/App.js';

import {
  AppViewport,
} from './ui/AppViewport.js';

import {
  AudioService,
} from './services/AudioService.js';
import {
  AuthService,
} from './services/authService.js';

import {
  AccountStore,
} from './state/AccountStore.js';

import {
  AccountController,
} from './controllers/AccountController.js';

/*
 * =========================================================
 * ACCOUNT SYSTEM
 * =========================================================
 */

const authService =
  new AuthService();

const accountService =
  new AccountService();

const accountStore =
  new AccountStore();

const accountController =
  new AccountController({
    authService,
    accountService,
    accountStore,
  });
/*
 * =========================================================
 * AUDIO SERVICE
 * =========================================================
 *
 * Genau EINE Instanz für die komplette App.
 */

const audioService =
  new AudioService();


/*
 * =========================================================
 * AUDIO UNLOCK
 * =========================================================
 *
 * Browser erlauben Audio normalerweise erst,
 * nachdem der Benutzer einmal interagiert hat.
 */

const unlockAudio =
  () => {
    audioService.unlock();


    document.removeEventListener(
      'pointerdown',
      unlockAudio,
      true,
    );
  };


document.addEventListener(
  'pointerdown',
  unlockAudio,
  true,
);


/*
 * =========================================================
 * GLOBALER BUTTON-KLICKSOUND
 * =========================================================
 *
 * Dieser Listener gilt automatisch für ALLE
 * jetzigen und zukünftigen HTML-Buttons.
 */

document.addEventListener(
  'click',
  (event) => {
    const target =
      event.target;


    if (
      !(
        target instanceof
        Element
      )
    ) {
      return;
    }


    const button =
      target.closest(
        'button',
      );


    if (
      !button ||
      button.disabled
    ) {
      return;
    }


    audioService.playSfx(
      'buttonClick',
    );
  },
  true,
);


/*
 * =========================================================
 * APP HOST
 * =========================================================
 */

const appHost =
  document.querySelector(
    '#app',
  );


if (
  !(
    appHost instanceof
    HTMLElement
  )
) {
  throw new Error(
    'Das App-Element #app wurde nicht gefunden.',
  );
}


/*
 * #app ist die schwarze äußere Browserfläche.
 * In #game-stage läuft die eigentliche App.
 */

const gameStage =
  document.createElement(
    'div',
  );


gameStage.id =
  'game-stage';


appHost.replaceChildren(
  gameStage,
);


/*
 * =========================================================
 * VIEWPORT
 * =========================================================
 */

const viewport =
  new AppViewport(
    gameStage,
  );


viewport.mount();


/*
 * =========================================================
 * APP
 * =========================================================
 *
 * AudioService wird als Abhängigkeit übergeben.
 */

const app =
  new App(
    gameStage,
    audioService,
    accountController,
    accountStore,
  );

app.start();