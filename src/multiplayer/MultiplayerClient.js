import {
  io,
} from 'socket.io-client';
import {
  SERVER_EVENTS,
} from '../../shared/protocol/serverEvents.js';

import {
  CLIENT_EVENTS,
} from '../../shared/protocol/clientEvents.js';



function resolveServerUrl() {
  /*
   * Lokal ergibt das:
   *
   * Frontend:
   * http://localhost:5173
   *
   * Multiplayer:
   * http://localhost:3000
   *
   * Später funktioniert das Prinzip auch
   * über die lokale IP im WLAN.
   */
  return (
    `${window.location.protocol}//` +
    `${window.location.hostname}:3000`
  );
}


export class MultiplayerClient {
  constructor({
    serverUrl =
      resolveServerUrl(),
  } = {}) {
    this.serverUrl =
      serverUrl;


    this.socket =
      null;


    this.state = {
    status:
        'idle',

    socketId:
        null,

    connectionCount:
        null,
    currentRoom:
    null,

    roomError:
    null,
    error:
        null,
    };
  }


  getState() {
    return {
      ...this.state,
    };
  }


  connect() {
    /*
     * Socket nur einmal erzeugen.
     */
    if (!this.socket) {
      this.#createSocket();
    }


    /*
     * Bereits verbunden:
     * nichts erneut starten.
     */
    if (
      this.socket.connected
    ) {
      return;
    }


    this.state.status =
      'connecting';

    this.state.error =
      null;


    console.log(
      '[MultiplayerClient] Verbinde mit:',
      this.serverUrl,
    );


    this.socket.connect();
  }


  disconnect() {
    if (!this.socket) {
      return;
    }


    this.socket.disconnect();


    this.state = {
    status:
        'disconnected',

    socketId:
        null,

    connectionCount:
        null,
    
    currentRoom:
        null,

    roomError:
        null,

    error:
        null,
    };
  }

createRoom() {
  if (
    !this.socket ||
    !this.socket.connected
  ) {
    console.error(
      '[MultiplayerClient] Room kann nicht erstellt werden: Keine Serververbindung.',
    );


    return false;
  }


  this.state.roomError =
    null;


  console.log(
    '[MultiplayerClient] Room wird erstellt...',
  );


  this.socket.emit(
    CLIENT_EVENTS.ROOM_CREATE,
  );


  return true;
}

  joinRoom(
    roomId,
  ) {
    if (
      !this.socket ||
      !this.socket.connected
    ) {
      console.error(
        '[MultiplayerClient] Room kann nicht betreten werden: Keine Serververbindung.',
      );


      return false;
    }


    const normalizedRoomId =
      String(
        roomId ?? '',
      )
        .trim()
        .toUpperCase();


    if (!normalizedRoomId) {
      console.error(
        '[MultiplayerClient] Room-Code fehlt.',
      );


      return false;
    }


    this.state.roomError =
      null;


    console.log(
      '[MultiplayerClient] Room beitreten:',
      normalizedRoomId,
    );


    this.socket.emit(
      CLIENT_EVENTS.ROOM_JOIN,
      {
        roomId:
          normalizedRoomId,
      },
    );


    return true;
  }

  #createSocket() {
    const socket =
      io(
        this.serverUrl,
        {
          /*
           * Verbindung wird erst durch
           * connect() gestartet.
           */
          autoConnect:
            false,

          /*
           * Socket.IO darf bei kurzfristigen
           * Verbindungsabbrüchen automatisch
           * neu verbinden.
           */
          reconnection:
            true,
        },
      );
    socket.on(
    SERVER_EVENTS.ROOM_CREATED,
    (
        roomState,
    ) => {
        this.state.currentRoom =
        roomState;

        this.state.roomError =
        null;


        console.log(
        '[MultiplayerClient] Room erstellt:',
        roomState,
        );
    },
    );
    socket.on(
    SERVER_EVENTS.ROOM_ERROR,
    (
        error,
    ) => {
        this.state.roomError =
        error;


        console.error(
        '[MultiplayerClient] Room-Fehler:',
        error,
        );
    },
    );
    socket.on(
      'connect',
      () => {
        this.state.status =
          'connected';

        this.state.socketId =
          socket.id;

        this.state.error =
          null;


        console.log(
          '[MultiplayerClient] Verbunden:',
          socket.id,
        );
      },
    );
    socket.on(
      SERVER_EVENTS.ROOM_STATE,
      (
        roomState,
      ) => {
        this.state.currentRoom =
          roomState;

        this.state.roomError =
          null;


        console.log(
          '[MultiplayerClient] Room-State aktualisiert:',
          roomState,
        );
      },
    );


    socket.on(
      'disconnect',
      (
        reason,
      ) => {
        this.state.status =
          'disconnected';

        this.state.socketId =
          null;


        console.log(
          '[MultiplayerClient] Getrennt:',
          reason,
        );
      },
    );


    socket.on(
      'connect_error',
      (
        error,
      ) => {
        this.state.status =
          'error';

        this.state.error =
          error.message;


        console.error(
          '[MultiplayerClient] Verbindungsfehler:',
          error,
        );
      },
    );
    socket.on(
    SERVER_EVENTS.CONNECTION_COUNT,
    (
        payload,
    ) => {
        const count =
        Number(
            payload?.count,
        );


        if (
        !Number.isInteger(
            count,
        )
        ) {
        console.warn(
            '[MultiplayerClient] Ungültiger Verbindungsstand:',
            payload,
        );

        return;
        }


        this.state.connectionCount =
        count;


        console.log(
        '[MultiplayerClient] Aktive Clients:',
        count,
        );
    },
    );

    this.socket =
      socket;
  }
}