import {
  randomUUID,
} from 'node:crypto';


export class GameRoom {
  constructor({
    id,
    hostSocketId,
  }) {
    if (!id) {
      throw new Error(
        'GameRoom benötigt eine Room-ID.',
      );
    }


    if (!hostSocketId) {
      throw new Error(
        'GameRoom benötigt einen Host.',
      );
    }


    this.id =
      id;


    this.status =
      'lobby';


    this.createdAt =
      Date.now();


    /*
     * =====================================================
     * GAME SETTINGS
     * =====================================================
     *
     * Diese Struktur ist schon auf die späteren
     * Multiplayer-Modi vorbereitet.
     *
     * Bearbeiten können wir sie aktuell noch nicht.
     */
    this.settings = {
      gameModeId:
        'normal',

      targetScore:
        10000,

      wagerCoins:
        0,

      revision:
        1,
    };


    const hostPlayerId =
      randomUUID();


    this.hostPlayerId =
      hostPlayerId;


    /*
     * socketId bleibt serverintern.
     *
     * Später ersetzen/ergänzen wir die temporäre
     * Spieleridentität durch die Supabase-user_id.
     */
    this.players = [
      {
        id:
          hostPlayerId,

        socketId:
          hostSocketId,

        displayName:
          'Host',

        role:
          'host',

        ready:
          false,

        acceptedSettingsRevision:
          null,
      },
    ];
  }


  get playerCount() {
    return this.players.length;
  }


  hasSocket(
    socketId,
  ) {
    return this.players.some(
      (player) =>
        player.socketId ===
        socketId,
    );
  }

addPlayer({
    socketId,
    displayName =
      'Gast',
  }) {
    if (!socketId) {
      throw new Error(
        'Spieler benötigt eine Socket-ID.',
      );
    }


    if (
      this.hasSocket(
        socketId,
      )
    ) {
      throw new Error(
        'Dieser Spieler befindet sich bereits im Room.',
      );
    }


    const player = {
      id:
        randomUUID(),

      socketId,

      displayName,

      role:
        'guest',

      ready:
        false,

      acceptedSettingsRevision:
        null,
    };


    this.players.push(
      player,
    );


    return player;
  }


  removePlayerBySocketId(
    socketId,
  ) {
    const playerIndex =
      this.players
        .findIndex(
          (player) =>
            player.socketId ===
            socketId,
        );


    if (
      playerIndex === -1
    ) {
      return null;
    }


    const [
      removedPlayer,
    ] =
      this.players.splice(
        playerIndex,
        1,
      );


    /*
     * Verlässt der Host den Room,
     * wird ein verbleibender Spieler
     * automatisch neuer Host.
     */
    if (
      removedPlayer.id ===
        this.hostPlayerId &&
      this.players.length > 0
    ) {
      const newHost =
        this.players[0];


      this.hostPlayerId =
        newHost.id;


      newHost.role =
        'host';
    }


    return removedPlayer;
  }


  /*
   * =======================================================
   * PUBLIC STATE
   * =======================================================
   *
   * socketId wird absichtlich NICHT an Browser übertragen.
   */
  toPublicState() {
    return {
      id:
        this.id,

      status:
        this.status,

      hostPlayerId:
        this.hostPlayerId,

      createdAt:
        this.createdAt,

      settings: {
        ...this.settings,
      },

      players:
        this.players.map(
          ({
            socketId,
            ...publicPlayer
          }) => ({
            ...publicPlayer,
          }),
        ),
    };
  }
}