import {
  SCREENS,
} from '../app/screens.js';


const STATUS_LABELS =
  Object.freeze({
    idle:
      'Nicht verbunden',

    connecting:
      'Verbindung wird hergestellt...',

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
    this.navigate =
      navigate;

    this.multiplayerClient =
      multiplayerClient;


    this.statusElement =
      null;

    this.errorElement =
      null;

    this.roomCodeInput =
      null;

    this.createButton =
      null;

    this.joinButton =
      null;

    this.backButton =
      null;


    this.handleCreate =
      null;

    this.handleJoin =
      null;

    this.handleBack =
      null;


    this.unsubscribeMultiplayer =
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
        <h1>
          Online / Multiplayer
        </h1>


        <p>
          Server:
          <strong
            data-online-status
          >
            Nicht verbunden
          </strong>
        </p>


        <section>
          <h2>
            Spiel hosten
          </h2>

          <button
            type="button"
            data-action="create-room"
          >
            Spiel hosten
          </button>
        </section>


        <section>
          <h2>
            Spiel beitreten
          </h2>

          <input
            type="text"
            maxlength="6"
            autocomplete="off"
            placeholder="ROOM-CODE"
            data-room-code
          >

          <button
            type="button"
            data-action="join-room"
          >
            Beitreten
          </button>
        </section>


        <p
          data-online-error
          role="alert"
        ></p>


        <button
          type="button"
          data-action="back"
        >
          Zurück
        </button>
      </main>
    `;


    this.statusElement =
      rootElement.querySelector(
        '[data-online-status]',
      );


    this.errorElement =
      rootElement.querySelector(
        '[data-online-error]',
      );


    this.roomCodeInput =
      rootElement.querySelector(
        '[data-room-code]',
      );


    this.createButton =
      rootElement.querySelector(
        '[data-action="create-room"]',
      );


    this.joinButton =
      rootElement.querySelector(
        '[data-action="join-room"]',
      );


    this.backButton =
      rootElement.querySelector(
        '[data-action="back"]',
      );


    this.handleCreate =
      () => {
        this.multiplayerClient
          .createRoom();
      };


    this.handleJoin =
      () => {
        const roomCode =
          this.roomCodeInput
            ?.value
            .trim() ??
          '';


        this.multiplayerClient
          .joinRoom(
            roomCode,
          );
      };


    this.handleBack =
      () => {
        this.multiplayerClient
          .disconnect();


        this.navigate(
          SCREENS.MODE_SELECT,
        );
      };


    this.createButton
      ?.addEventListener(
        'click',
        this.handleCreate,
      );


    this.joinButton
      ?.addEventListener(
        'click',
        this.handleJoin,
      );


    this.backButton
      ?.addEventListener(
        'click',
        this.handleBack,
      );


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


    this.multiplayerClient
      .connect();
  }


  #renderState(
    state,
  ) {
    if (
      this.statusElement
    ) {
      this.statusElement
        .textContent =
        STATUS_LABELS[
          state.status
        ] ??
        state.status;
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


    const canUseRooms =
      state.status ===
      'connected';


    if (
      this.createButton
    ) {
      this.createButton.disabled =
        !canUseRooms;
    }


    if (
      this.joinButton
    ) {
      this.joinButton.disabled =
        !canUseRooms;
    }


    /*
     * Sobald der Server einen Room bestätigt,
     * wechseln wir automatisch in die Lobby.
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
    this.createButton
      ?.removeEventListener(
        'click',
        this.handleCreate,
      );


    this.joinButton
      ?.removeEventListener(
        'click',
        this.handleJoin,
      );


    this.backButton
      ?.removeEventListener(
        'click',
        this.handleBack,
      );


    this.unsubscribeMultiplayer?.();


    this.unsubscribeMultiplayer =
      null;


    /*
     * Verbindung NICHT trennen.
     *
     * Sie muss beim Wechsel
     * OnlineMenu -> Lobby bestehen bleiben.
     */


    this.statusElement =
      null;

    this.errorElement =
      null;

    this.roomCodeInput =
      null;

    this.createButton =
      null;

    this.joinButton =
      null;

    this.backButton =
      null;


    this.handleCreate =
      null;

    this.handleJoin =
      null;

    this.handleBack =
      null;
  }
}