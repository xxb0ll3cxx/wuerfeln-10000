import {
  SCREENS,
} from '../app/screens.js';


const STATUS_LABELS =
  Object.freeze({
    idle:
      'Nicht verbunden',

    connecting:
      'Verbinde...',

    connected:
      'Verbunden',

    reconnecting:
      'Verbindung wird wiederhergestellt...',

    disconnected:
      'Getrennt',

    error:
      'Verbindungsfehler',
  });


export class OnlineMenuScreen {
  constructor({
    navigate,
    multiplayerClient,
  }) {
    if (
      typeof navigate !==
      'function'
    ) {
      throw new TypeError(
        'OnlineMenuScreen benötigt navigate.',
      );
    }


    if (!multiplayerClient) {
      throw new TypeError(
        'OnlineMenuScreen benötigt MultiplayerClient.',
      );
    }


    this.navigate =
      navigate;

    this.multiplayerClient =
      multiplayerClient;


    this.roomCodeInput =
      null;

    this.joinButton =
      null;

    this.createButton =
      null;

    this.backButton =
      null;

    this.errorElement =
      null;

    this.statusElement =
      null;


    this.unsubscribeMultiplayer =
      null;


    this.handleJoin =
      null;

    this.handleCreate =
      null;

    this.handleBack =
      null;

    this.handleRoomCodeInput =
      null;

    this.handleRoomCodeKeyDown =
      null;


    this.isNavigatingToLobby =
      false;
  }


  mount(
    rootElement,
  ) {
    rootElement.innerHTML = `
      <main
        class="
          screen
          online-menu-screen
        "
      >
        <div
          class="online-menu-screen__title"
          role="img"
          aria-label="Online Modus"
        ></div>


        <section
          class="online-menu-screen__content"
        >
          <label
            class="online-menu-screen__code-field"
          >
            <span
              class="online-menu-screen__sr-only"
            >
              Room-Code
            </span>

            <input
              type="text"
              class="online-menu-screen__code-input"
              data-online-room-code
              maxlength="6"
              autocomplete="off"
              autocapitalize="characters"
              spellcheck="false"
              placeholder="ROOM-CODE"
              aria-label="Room-Code"
            >
          </label>


          <button
            type="button"
            class="
              online-menu-screen__asset-button
              online-menu-screen__join-button
            "
            data-action="join-room"
            aria-label="Spiel beitreten"
          ></button>


          <button
            type="button"
            class="
              online-menu-screen__asset-button
              online-menu-screen__create-button
            "
            data-action="create-room"
            aria-label="Spiel erstellen"
          ></button>


          <p
            class="online-menu-screen__error"
            data-online-error
            role="alert"
          ></p>


          <span
            class="online-menu-screen__sr-only"
            data-online-status
          >
            Nicht verbunden
          </span>
        </section>


        <button
          type="button"
          class="
            online-menu-screen__asset-button
            online-menu-screen__back-button
          "
          data-action="back"
          aria-label="Zurück"
        ></button>
      </main>
    `;


    this.roomCodeInput =
      rootElement.querySelector(
        '[data-online-room-code]',
      );


    this.joinButton =
      rootElement.querySelector(
        '[data-action="join-room"]',
      );


    this.createButton =
      rootElement.querySelector(
        '[data-action="create-room"]',
      );


    this.backButton =
      rootElement.querySelector(
        '[data-action="back"]',
      );


    this.errorElement =
      rootElement.querySelector(
        '[data-online-error]',
      );


    this.statusElement =
      rootElement.querySelector(
        '[data-online-status]',
      );


    /*
     * =====================================================
     * EVENTS
     * =====================================================
     */

    this.handleRoomCodeInput =
      () => {
        if (
          !this.roomCodeInput
        ) {
          return;
        }


        /*
         * Room-Codes werden serverseitig ebenfalls
         * normalisiert. Die UI spiegelt das bereits
         * während der Eingabe.
         */
        this.roomCodeInput.value =
          this.roomCodeInput
            .value
            .toUpperCase()
            .replace(
              /[^A-Z0-9]/g,
              '',
            )
            .slice(
              0,
              6,
            );
      };


    this.handleRoomCodeKeyDown =
      (
        event,
      ) => {
        if (
          event.key !==
          'Enter'
        ) {
          return;
        }


        event.preventDefault();


        this.#joinRoom();
      };


    this.handleJoin =
      () => {
        this.#joinRoom();
      };


    this.handleCreate =
      () => {
        this.multiplayerClient
          .createRoom();
      };


    this.handleBack =
      () => {
        this.navigate(
          SCREENS.MODE_SELECT,
        );
      };


    this.roomCodeInput
      ?.addEventListener(
        'input',
        this.handleRoomCodeInput,
      );


    this.roomCodeInput
      ?.addEventListener(
        'keydown',
        this.handleRoomCodeKeyDown,
      );


    this.joinButton
      ?.addEventListener(
        'click',
        this.handleJoin,
      );


    this.createButton
      ?.addEventListener(
        'click',
        this.handleCreate,
      );


    this.backButton
      ?.addEventListener(
        'click',
        this.handleBack,
      );


    /*
     * Der MultiplayerClient liefert dem Subscriber
     * sofort seinen aktuellen State.
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


    /*
     * connect() ist idempotent.
     * Bestehende Verbindungen werden nicht dupliziert.
     */
    this.multiplayerClient
      .connect();
  }


  #joinRoom() {
    const roomCode =
      this.roomCodeInput
        ?.value ??
      '';


    this.multiplayerClient
      .joinRoom(
        roomCode,
      );
  }


  #renderState(
    state,
  ) {
    if (!state) {
      return;
    }


    const connected =
      state.status ===
      'connected';


    if (
      this.statusElement
    ) {
      this.statusElement
        .textContent =
        STATUS_LABELS[
          state.status
        ] ??
        state.status ??
        '';
    }


    if (
      this.joinButton
    ) {
      this.joinButton.disabled =
        !connected;
    }


    if (
      this.createButton
    ) {
      this.createButton.disabled =
        !connected;
    }


    if (
      this.roomCodeInput
    ) {
      this.roomCodeInput.disabled =
        !connected;
    }


    if (
      this.errorElement
    ) {
      this.errorElement
        .textContent =
        state.roomError
          ?.message ??
        state.error ??
        '';
    }


    /*
     * Sowohl createRoom() als auch joinRoom()
     * führen serverseitig zu einem currentRoom.
     *
     * Erst dann wechseln wir in die Lobby.
     */
    if (
      state.currentRoom &&
      !this.isNavigatingToLobby
    ) {
      this.isNavigatingToLobby =
        true;


      this.navigate(
        SCREENS.LOBBY,
      );
    }
  }


  destroy() {
    this.unsubscribeMultiplayer
      ?.();


    this.roomCodeInput
      ?.removeEventListener(
        'input',
        this.handleRoomCodeInput,
      );


    this.roomCodeInput
      ?.removeEventListener(
        'keydown',
        this.handleRoomCodeKeyDown,
      );


    this.joinButton
      ?.removeEventListener(
        'click',
        this.handleJoin,
      );


    this.createButton
      ?.removeEventListener(
        'click',
        this.handleCreate,
      );


    this.backButton
      ?.removeEventListener(
        'click',
        this.handleBack,
      );


    this.unsubscribeMultiplayer =
      null;


    this.roomCodeInput =
      null;

    this.joinButton =
      null;

    this.createButton =
      null;

    this.backButton =
      null;

    this.errorElement =
      null;

    this.statusElement =
      null;


    this.handleJoin =
      null;

    this.handleCreate =
      null;

    this.handleBack =
      null;

    this.handleRoomCodeInput =
      null;

    this.handleRoomCodeKeyDown =
      null;


    this.isNavigatingToLobby =
      false;
  }
}