import {
  io,
} from 'socket.io-client';

import {
  CLIENT_EVENTS,
} from '../../shared/protocol/clientEvents.js';

import {
  SERVER_EVENTS,
} from '../../shared/protocol/serverEvents.js';
const RECONNECT_STORAGE_KEY =
  'wuerfeln10000.multiplayerReconnect';

function resolveServerUrl() {
  const configuredUrl =
    import.meta.env
      .VITE_MULTIPLAYER_URL
      ?.trim();


  if (configuredUrl) {
    return configuredUrl;
  }


  return (
    `${window.location.protocol}//` +
    `${window.location.hostname}:3000`
  );
}


export class MultiplayerClient {
  constructor({
    serverUrl =
      resolveServerUrl(),
    
    getAccessToken =
      null,
  } = {}) {
    this.serverUrl =
      serverUrl;

    this.getAccessToken =
      typeof getAccessToken ===
        'function'
        ? getAccessToken
        : async () =>
            null;


    this.walletListeners =
      new Set();

    this.socket =
      null;


    /*
     * Screens können den Multiplayer-State abonnieren.
     */
    this.listeners =
      new Set();


    this.state = {
      status:
        'idle',

      localPlayerId:
        null,

      socketId:
        null,

      connectionCount:
        null,

      currentRoom:
        null,

      roomError:
        null,

      gameError:
        null,

      error:
        null,
    };
  }
forfeitGame() {
  if (
    !this.#canSendGameAction()
  ) {
    return false;
  }


  this.#clearGameError();


  this.socket.emit(
    CLIENT_EVENTS.GAME_FORFEIT,
  );


  return true;
}

  /*
   * =====================================================
   * STATE
   * =====================================================
   */

  getState() {
    return {
      ...this.state,
    };
  }


  subscribe(
    listener,
  ) {
    if (
      typeof listener !==
      'function'
    ) {
      throw new TypeError(
        'MultiplayerClient.subscribe benötigt eine Funktion.',
      );
    }


    this.listeners.add(
      listener,
    );


    /*
     * Subscriber erhält sofort den
     * aktuellen Zustand.
     */
    listener(
      this.getState(),
    );


    return () => {
      this.listeners.delete(
        listener,
      );
    };
  }
subscribeWalletUpdates(
  listener,
) {
  if (
    typeof listener !==
    'function'
  ) {
    throw new TypeError(
      'Wallet-Listener muss eine Funktion sein.',
    );
  }


  this.walletListeners.add(
    listener,
  );


  return () => {
    this.walletListeners.delete(
      listener,
    );
  };
}

  /*
   * =====================================================
   * CONNECTION
   * =====================================================
   */

  connect() {
    if (!this.socket) {
      this.#createSocket();
    }


    if (
      this.socket.connected
    ) {
      return;
    }


    this.#setState({
      status:
        'connecting',

      error:
        null,
    });


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


    const wasConnected =
      this.socket.connected;


    this.socket.disconnect();


    /*
     * Bei aktiver Verbindung erledigt der
     * disconnect-Listener das State-Update.
     */
    if (!wasConnected) {
      this.#setState({
        status:
          'disconnected',

        socketId:
          null,

        localPlayerId:
          null,

        connectionCount:
          null,

        currentRoom:
          null,

        roomError:
          null,

        gameError:
          null,

        error:
          null,
      });
    }
  }


  /*
   * =====================================================
   * ROOM
   * =====================================================
   */

  createRoom() {
    if (
      !this.socket ||
      !this.socket.connected
    ) {
      this.#setState({
        roomError: {
          code:
            'not-connected',

          message:
            'Keine Verbindung zum Multiplayer-Server.',
        },
      });


      return false;
    }


    this.#setState({
      roomError:
        null,
    });


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
      this.#setState({
        roomError: {
          code:
            'not-connected',

          message:
            'Keine Verbindung zum Multiplayer-Server.',
        },
      });


      return false;
    }


    const normalizedRoomId =
      String(
        roomId ?? '',
      )
        .trim()
        .toUpperCase();


    if (!normalizedRoomId) {
      this.#setState({
        roomError: {
          code:
            'invalid-room-code',

          message:
            'Bitte gib einen Room-Code ein.',
        },
      });


      return false;
    }


    this.#setState({
      roomError:
        null,
    });


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
  updateRoomPlayerSetup(
  player,
) {
  if (
    !this.#canSendRoomAction()
  ) {
    return false;
  }


  if (
    !player ||
    typeof player !==
      'object'
  ) {
    return false;
  }

  this.socket.emit(
    CLIENT_EVENTS.ROOM_PLAYER_UPDATE,
    {
      player,
    },
  );


  return true;
}

  updateRoomSettings(
    settings,
  ) {
    if (
      !this.#canSendRoomAction()
    ) {
      return false;
    }


    this.#setState({
      roomError:
        null,
    });


    this.socket.emit(
      CLIENT_EVENTS.ROOM_SETTINGS_UPDATE,
      {
        settings,
      },
    );


    return true;
  }


  acceptRoomSettings() {
    if (
      !this.#canSendRoomAction()
    ) {
      return false;
    }


    this.#setState({
      roomError:
        null,
    });


    this.socket.emit(
      CLIENT_EVENTS.ROOM_SETTINGS_ACCEPT,
    );


    return true;
  }


  /*
   * =====================================================
   * GAME START
   * =====================================================
   */

  startGame() {

  if (
    !this.#canSendRoomAction()
  ) {
    return false;
  }


  this.#clearGameError();


  this.socket.emit(
    CLIENT_EVENTS.GAME_START,
  );


  return true;
}


  /*
   * =====================================================
   * ROLL
   * =====================================================
   */

  rollDice() {
    if (
      !this.#canSendGameAction()
    ) {
      return false;
    }


    this.#clearGameError();


    /*
     * Keine Würfelwerte mitsenden.
     *
     * Der Client fordert ausschließlich
     * einen Wurf an.
     */
    this.socket.emit(
      CLIENT_EVENTS.GAME_ROLL,
    );


    return true;
  }


  /*
   * =====================================================
   * DICE SELECTION
   * =====================================================
   */

  setDiceSelection(
    selectedDiceIndices,
  ) {
    if (
      !this.#canSendGameAction()
    ) {
      return false;
    }


    if (
      !Array.isArray(
        selectedDiceIndices,
      )
    ) {
      return false;
    }


    this.#clearGameError();


    /*
     * Der Client sendet nur die ausgewählten
     * Indizes des aktuellen Wurfs.
     *
     * Ob diese Auswahl regelkonform ist,
     * entscheidet ausschließlich der Server.
     */
    this.socket.emit(
      CLIENT_EVENTS.GAME_SELECTION_SET,
      {
        selectedDiceIndices: [
          ...selectedDiceIndices,
        ],
      },
    );


    return true;
  }


  toggleDiceSelection(
    diceIndex,
  ) {
    if (
      !Number.isInteger(
        diceIndex,
      ) ||
      diceIndex < 0
    ) {
      return false;
    }


    const currentSelection =
      this.state
        .currentRoom
        ?.match
        ?.turn
        ?.selectedDiceIndices ??
      [];


    const isSelected =
      currentSelection.includes(
        diceIndex,
      );


    const nextSelection =
      isSelected
        ? currentSelection.filter(
            (index) =>
              index !==
              diceIndex,
          )
        : [
            ...currentSelection,
            diceIndex,
          ];


    nextSelection.sort(
      (
        left,
        right,
      ) =>
        left - right,
    );


    return this.setDiceSelection(
      nextSelection,
    );
  }


  /*
   * =====================================================
   * SCORING
   * =====================================================
   */

  applyScoringInterpretation(
    interpretationId,
  ) {
    if (
      !this.#canSendGameAction()
    ) {
      return false;
    }


    if (
      typeof interpretationId !==
        'string' ||
      !interpretationId
    ) {
      return false;
    }


    this.#clearGameError();


    /*
     * Keine Punkte mitsenden.
     *
     * Nur die ID einer Interpretation,
     * die der Server selbst berechnet hat.
     */
    this.socket.emit(
      CLIENT_EVENTS.GAME_SCORING_APPLY,
      {
        interpretationId,
      },
    );


    return true;
  }


  /*
   * =====================================================
   * STRASSEN-NACHWURF
   * =====================================================
   */

  useStraightReroll() {
    if (
      !this.#canSendGameAction()
    ) {
      return false;
    }


    this.#clearGameError();


    this.socket.emit(
      CLIENT_EVENTS.GAME_STRAIGHT_REROLL,
    );


    return true;
  }


 /*
 * =====================================================
 * BANK / SICHERN
 * =====================================================
 */

bankTurn() {
  if (
    !this.#canSendGameAction()
  ) {
    return false;
  }


  this.#clearGameError();


  /*
   * Keine Punktzahl mitsenden.
   *
   * Der Server kennt den autoritativen
   * turnScore bereits selbst.
   */
  this.socket.emit(
    CLIENT_EVENTS.GAME_BANK,
  );


  return true;
}


  /*
   * =====================================================
   * SOCKET
   * =====================================================
   */

  #createSocket() {
    const socket =
      io(
        this.serverUrl,
        {
          autoConnect:
            false,

          reconnection:
            true,

          auth:
            (
              callback,
            ) => {
              Promise.resolve(
                this.getAccessToken(),
              )
                .then(
                  (
                    accessToken,
                  ) => {
                    callback({
                      accessToken:
                        accessToken ??
                        null,
                    });
                  },
                )
                .catch(
                  (
                    error,
                  ) => {
                    console.error(
                      '[MultiplayerClient] Access-Token konnte nicht geladen werden:',
                      error,
                    );

                    callback({
                      accessToken:
                        null,
                    });
                  },
                );
            },
        },
      );


    /*
     * ===================================================
     * CONNECTION
     * ===================================================
     */

    socket.on(
      'connect',
      () => {
        this.#setState({
          status:
            'connected',

          socketId:
            socket.id,

          error:
            null,
        });


        console.log(
          '[MultiplayerClient] Verbunden:',
          socket.id,
        );
        const reconnectSession =
          this.#loadReconnectSession();


        if (
          reconnectSession
        ) {
          console.log(
            '[MultiplayerClient] Versuche Room-Reconnect:',
            reconnectSession.roomId,
          );


          socket.emit(
            CLIENT_EVENTS.ROOM_RECONNECT,
            reconnectSession,
          );
        }
      },
    );
  socket.on(
    SERVER_EVENTS.WALLET_UPDATE,
    (
      payload,
    ) => {
      for (
        const listener
        of this.walletListeners
      ) {
        listener(
          payload,
        );
      }
    },
  );

socket.on(
  'disconnect',
  (
    reason,
  ) => {
    const isManualDisconnect =
      reason ===
      'io client disconnect';


    if (
      isManualDisconnect
    ) {
      this.#setState({
        status:
          'disconnected',

        socketId:
          null,

        localPlayerId:
          null,

        connectionCount:
          null,

        currentRoom:
          null,

        roomError:
          null,

        gameError:
          null,
      });
    }
    else {
      this.#setState({
        status:
          'reconnecting',

        socketId:
          null,

        connectionCount:
          null,

        roomError:
          null,

        gameError:
          null,
      });
    }


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
        this.#setState({
          status:
            'error',

          error:
            error.message,
        });


        console.error(
          '[MultiplayerClient] Verbindungsfehler:',
          error,
        );
      },
    );


    socket.io.on(
      'reconnect_attempt',
      () => {
        this.#setState({
          status:
            'reconnecting',

          error:
            null,
        });
      },
    );


    /*
     * ===================================================
     * CONNECTION COUNT
     * ===================================================
     */

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
          return;
        }


        this.#setState({
          connectionCount:
            count,
        });
      },
    );


    /*
     * ===================================================
     * ROOM MEMBERSHIP
     * ===================================================
     */

    socket.on(
  SERVER_EVENTS.ROOM_MEMBERSHIP,
  (
    membership,
  ) => {
    const roomId =
      membership?.roomId;


    const playerId =
      membership?.playerId;


    const reconnectToken =
      membership
        ?.reconnectToken;


    if (
      typeof roomId !==
        'string' ||
      !roomId ||
      typeof playerId !==
        'string' ||
      !playerId ||
      typeof reconnectToken !==
        'string' ||
      !reconnectToken
    ) {
      return;
    }


    this.#saveReconnectSession({
      roomId,
      playerId,
      reconnectToken,
    });


    this.#setState({
      localPlayerId:
        playerId,
    });
  },
);


    /*
     * ===================================================
     * ROOM
     * ===================================================
     */

    socket.on(
      SERVER_EVENTS.ROOM_CREATED,
      (
        roomState,
      ) => {
        this.#setState({
          currentRoom:
            roomState,

          roomError:
            null,
        });


        console.log(
          '[MultiplayerClient] Room erstellt:',
          roomState.id,
        );
      },
    );


socket.on(
  SERVER_EVENTS.ROOM_STATE,
  (
    roomState,
  ) => {
    /*
     * Ein endgültig beendetes Match darf nach
     * Reload nicht erneut connected werden.
     */
    if (
      roomState?.status ===
      'finished'
    ) {
      this.#clearReconnectSession();
    }


    this.#setState({
      currentRoom:
        roomState,

      roomError:
        null,

      gameError:
        null,
    });


    console.log(
      '[MultiplayerClient] Room-State aktualisiert:',
      roomState,
    );
  },
);

    /*
     * ===================================================
     * ERRORS
     * ===================================================
     */

    socket.on(
      SERVER_EVENTS.GAME_ERROR,
      (
        error,
      ) => {
        this.#setState({
          gameError:
            error,
        });


        console.error(
          '[MultiplayerClient] Game-Fehler:',
          error,
        );
      },
    );


    socket.on(
      SERVER_EVENTS.ROOM_ERROR,
      (
        error,
      ) => {
        this.#setState({
          roomError:
            error,
        });


        console.error(
          '[MultiplayerClient] Room-Fehler:',
          error,
        );
      },
    );


    this.socket =
      socket;
  }


  /*
   * =====================================================
   * HELPERS
   * =====================================================
   */

  #canSendRoomAction() {
    return Boolean(
      this.socket &&
      this.socket.connected &&
      this.state.currentRoom
    );
  }


  #canSendGameAction() {
    return Boolean(
      this.socket &&
      this.socket.connected &&
      this.state.currentRoom &&
      this.state.currentRoom.match
    );
  }


  #clearGameError() {
    this.#setState({
      gameError:
        null,
    });
  }


  #setState(
    patch,
  ) {
    this.state = {
      ...this.state,
      ...patch,
    };


    this.#emit();
  }
#saveReconnectSession({
  roomId,
  playerId,
  reconnectToken,
}) {
  if (
    !roomId ||
    !playerId ||
    !reconnectToken
  ) {
    return;
  }


  sessionStorage.setItem(
    RECONNECT_STORAGE_KEY,
    JSON.stringify({
      roomId,
      playerId,
      reconnectToken,
    }),
  );
}


#loadReconnectSession() {
  const rawValue =
    sessionStorage.getItem(
      RECONNECT_STORAGE_KEY,
    );


  if (!rawValue) {
    return null;
  }


  try {
    const value =
      JSON.parse(
        rawValue,
      );


    if (
      typeof value?.roomId !==
        'string' ||
      typeof value?.playerId !==
        'string' ||
      typeof value?.reconnectToken !==
        'string'
    ) {
      return null;
    }


    return value;
  }
  catch {
    sessionStorage.removeItem(
      RECONNECT_STORAGE_KEY,
    );


    return null;
  }
}


#clearReconnectSession() {
  sessionStorage.removeItem(
    RECONNECT_STORAGE_KEY,
  );
}

  #emit() {
    const state =
      this.getState();


    for (
      const listener
      of this.listeners
    ) {
      listener(
        state,
      );
    }
  }
}