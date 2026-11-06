import {
  randomUUID,
} from 'node:crypto';

import {
  getMultiplayerMode,
  isValidRangeValue,
} from '../../../shared/config/multiplayerModes.js';

import {
  OnlineMatch,
} from '../game/OnlineMatch.js';
const RECONNECT_GRACE_PERIOD_MS =
  60_000;

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


    this.match =
      null;

    this.coinBattle =
      null;


    const hostPlayerId =
      randomUUID();


    this.hostPlayerId =
      hostPlayerId;


    /*
     * socketId bleibt ausschließlich serverintern.
     */
    this.players = [
      {
        id:
          hostPlayerId,

        socketId:
          hostSocketId,

        reconnectToken:
          randomUUID(),

        displayName:
          'Gast',

        isAuthenticated:
          false,

        accountId:
          null,

        characterId:
          null,

        skinId:
          null,

        diceSkinId:
          null,

        role:
          'host',

        ready:
          false,

        connectionStatus:
          'connected',

        disconnectedAt:
          null,
        reconnectDeadlineAt:
          null,
        acceptedSettingsRevision:
          null,
      },
    ];
  }


  /*
   * =====================================================
   * PLAYER HELPERS
   * =====================================================
   */

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

  getPlayerById(
    playerId,
  ) {
    return (
      this.players.find(
        (player) =>
          player.id ===
          playerId,
      ) ??
      null
    );
  }
  
  getPlayerBySocketId(
    socketId,
  ) {
    return (
      this.players.find(
        (player) =>
          player.socketId ===
          socketId,
      ) ??
      null
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
    const mode =
      getMultiplayerMode(
        this.settings
          .gameModeId,
      );


    if (!mode) {
      throw new Error(
        'Room besitzt einen ungültigen Spielmodus.',
      );
    }


    if (
      this.players.length >=
      mode.playerCount.max
    ) {
      throw new Error(
        mode.playerCount.min ===
          mode.playerCount.max
          ? `${mode.name} unterstützt aktuell genau ${mode.playerCount.max} Spieler.`
          : `${mode.name} unterstützt maximal ${mode.playerCount.max} Spieler.`,
      );
    }

    const player = {
      id:
        randomUUID(),

      socketId,

      reconnectToken:
        randomUUID(),

      displayName,

      isAuthenticated:
        false,

      accountId:
        null,

      characterId:
        null,

      skinId:
        null,

      diceSkinId:
        null,

      role:
        'guest',

      connectionStatus:
        'connected',

      disconnectedAt:
        null,
      reconnectDeadlineAt:
        null,
      ready:
        false,

      acceptedSettingsRevision:
        null,
    };


    this.players.push(
      player,
    );


    /*
     * Durch einen neuen Spieler muss die aktuelle
     * Konfiguration erneut bestätigt werden.
     */
    this.#resetSettingsAcceptances();


    return player;
  }
markPlayerDisconnected(
  socketId,
) {
  const player =
    this.getPlayerBySocketId(
      socketId,
    );


  if (!player) {
    return null;
  }

    player.socketId =
      null;


    player.connectionStatus =
      'disconnected';


    player.disconnectedAt =
      Date.now();


    player.reconnectDeadlineAt =
      player.disconnectedAt +
      RECONNECT_GRACE_PERIOD_MS;


    return player;
}


reconnectPlayer({
  playerId,
  reconnectToken,
  socketId,
}) {
  if (
    this.status !==
    'playing'
  ) {
    throw new Error(
      'Reconnect ist nur für ein laufendes Match möglich.',
    );
  }


  if (
    !playerId ||
    !reconnectToken ||
    !socketId
  ) {
    throw new Error(
      'Ungültige Reconnect-Daten.',
    );
  }


  const player =
    this.getPlayerById(
      playerId,
    );


  if (!player) {
    throw new Error(
      'Spieler wurde im Room nicht gefunden.',
    );
  }


  /*
   * Die playerId allein reicht absichtlich nicht.
   *
   * Nur der Client mit dem geheimen Token
   * darf diesen Spielerplatz wieder übernehmen.
   */
  if (
    player.reconnectToken !==
    reconnectToken
  ) {
    throw new Error(
      'Reconnect-Berechtigung ist ungültig.',
    );
  }


  /*
   * Ein noch aktiv verbundener Spieler darf
   * nicht einfach von einem zweiten Socket
   * übernommen werden.
   */
  if (
    player.connectionStatus ===
      'connected' &&
    player.socketId &&
    player.socketId !==
      socketId
  ) {
    throw new Error(
      'Dieser Spieler ist bereits verbunden.',
    );
  }
if (
  player.connectionStatus ===
    'disconnected' &&
  Number.isFinite(
    player.reconnectDeadlineAt,
  ) &&
  Date.now() >
    player.reconnectDeadlineAt
) {
  throw new Error(
    'Die Reconnect-Frist ist abgelaufen.',
  );
}

  player.socketId =
    socketId;


  player.connectionStatus =
    'connected';

  player.reconnectDeadlineAt =
    null;
  player.disconnectedAt =
    null;


  return player;
}
finishDisconnectedPlayerByForfeit(
  playerId,
) {
  if (
    this.status !==
      'playing' ||
    !this.match
  ) {
    return null;
  }


  const player =
    this.getPlayerById(
      playerId,
    );


  if (!player) {
    return null;
  }


  /*
   * Spieler kam inzwischen zurück.
   * Dann darf der alte Timeout nichts mehr tun.
   */
  if (
    player.connectionStatus !==
    'disconnected'
  ) {
    return null;
  }


  if (
    !Number.isFinite(
      player.reconnectDeadlineAt,
    )
  ) {
    return null;
  }


  /*
   * Schutz gegen einen zu früh ausgelösten Timer.
   */
  if (
    Date.now() <
    player.reconnectDeadlineAt
  ) {
    return null;
  }


  const result =
    this.match
      .finishByForfeit(
        player.id,
      );


  if (!result) {
    return null;
  }


  this.status =
    'finished';


  return result;
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
     * wird ein verbleibender Spieler neuer Host.
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


    this.#resetSettingsAcceptances();


    return removedPlayer;
  }

forfeitPlayerBySocketId(
  socketId,
) {
  if (
    this.status !==
      'playing' ||
    !this.match
  ) {
    throw new Error(
      'Es läuft kein Match.',
    );
  }


  const player =
    this.getPlayerBySocketId(
      socketId,
    );


  if (!player) {
    throw new Error(
      'Spieler wurde im Match nicht gefunden.',
    );
  }


  const result =
    this.match
      .finishByForfeit(
        player.id,
      );


  if (!result) {
    throw new Error(
      'Das Match konnte nicht aufgegeben werden.',
    );
  }


  this.status =
    'finished';


  return result;
}
  /*
   * =====================================================
   * LOBBY SETTINGS
   * =====================================================
   */

  updateSettings({
    socketId,
    patch,
  }) {
    if (
      this.status !==
      'lobby'
    ) {
      throw new Error(
        'Die Spieleinstellungen können jetzt nicht mehr geändert werden.',
      );
    }


    const player =
      this.getPlayerBySocketId(
        socketId,
      );


    if (!player) {
      throw new Error(
        'Spieler wurde im Room nicht gefunden.',
      );
    }


    if (
      player.id !==
      this.hostPlayerId
    ) {
      throw new Error(
        'Nur der Host darf die Spieleinstellungen ändern.',
      );
    }


    if (
      !patch ||
      typeof patch !==
      'object'
    ) {
      throw new Error(
        'Ungültige Spieleinstellungen.',
      );
    }


    const nextSettings = {
      ...this.settings,
    };


    let changed =
      false;


    /*
     * =====================================================
     * SPIELMODUS
     * =====================================================
     */

    if (
      Object.hasOwn(
        patch,
        'gameModeId',
      )
    ) {
      const nextMode =
        getMultiplayerMode(
          patch.gameModeId,
        );


      if (!nextMode) {
        throw new Error(
          'Unbekannter Multiplayer-Spielmodus.',
        );
      }


      if (
        nextMode.id !==
        nextSettings.gameModeId
      ) {
        nextSettings.gameModeId =
          nextMode.id;


        /*
         * Beim Moduswechsel werden die
         * Standardwerte des neuen Modus verwendet.
         */
        nextSettings.targetScore =
          nextMode
            .targetScore
            .default;


        nextSettings.wagerCoins =
          nextMode.usesWager
            ? nextMode
                .wager
                .default
            : 0;


        changed =
          true;
      }
    }


    const mode =
      getMultiplayerMode(
        nextSettings.gameModeId,
      );


    if (!mode) {
      throw new Error(
        'Room besitzt einen ungültigen Spielmodus.',
      );
    }

    if (
      this.players.length >
      mode.playerCount.max
    ) {
      throw new Error(
        mode.playerCount.min ===
          mode.playerCount.max
          ? `${mode.name} unterstützt aktuell genau ${mode.playerCount.max} Spieler.`
          : `${mode.name} unterstützt maximal ${mode.playerCount.max} Spieler.`,
      );
    }

    /*
     * =====================================================
     * ZIELPUNKTZAHL
     * =====================================================
     */

    if (
      Object.hasOwn(
        patch,
        'targetScore',
      )
    ) {
      const targetScore =
        Number(
          patch.targetScore,
        );


      if (
        !isValidRangeValue(
          targetScore,
          mode.targetScore,
        )
      ) {
        throw new Error(
          'Ungültige Zielpunktzahl.',
        );
      }


      if (
        targetScore !==
        nextSettings.targetScore
      ) {
        nextSettings.targetScore =
          targetScore;


        changed =
          true;
      }
    }


    /*
     * =====================================================
     * COIN-EINSATZ
     * =====================================================
     */

    if (
      Object.hasOwn(
        patch,
        'wagerCoins',
      )
    ) {
      if (
        !mode.usesWager
      ) {
        throw new Error(
          'Dieser Spielmodus verwendet keinen Coin-Einsatz.',
        );
      }


      const wagerCoins =
        Number(
          patch.wagerCoins,
        );


      if (
        !isValidRangeValue(
          wagerCoins,
          mode.wager,
        )
      ) {
        throw new Error(
          'Ungültiger Coin-Einsatz.',
        );
      }


      if (
        wagerCoins !==
        nextSettings.wagerCoins
      ) {
        nextSettings.wagerCoins =
          wagerCoins;


        changed =
          true;
      }
    }


    /*
     * Keine tatsächliche Änderung.
     */
    if (!changed) {
      return false;
    }


    /*
     * Jede Änderung erzeugt eine neue Revision.
     */
    nextSettings.revision =
      this.settings.revision +
      1;


    this.settings =
      nextSettings;


    /*
     * Alte Zustimmungen gelten nicht mehr.
     */
    this.#resetSettingsAcceptances();


    return true;
  }

  updatePlayerSetup({
    socketId,
    patch,
  }) {
    if (
      this.status !==
      'lobby'
    ) {
      throw new Error(
        'Die Spielerauswahl kann jetzt nicht mehr geändert werden.',
      );
    }


    const player =
      this.getPlayerBySocketId(
        socketId,
      );


    if (!player) {
      throw new Error(
        'Spieler wurde im Room nicht gefunden.',
      );
    }


    if (
      !patch ||
      typeof patch !==
        'object'
    ) {
      throw new Error(
        'Ungültige Spielerauswahl.',
      );
    }


    const normalizeOptionalId =
      (
        value,
        label,
      ) => {
        if (
          value === null ||
          value === undefined ||
          value === ''
        ) {
          return null;
        }


        if (
          typeof value !==
          'string'
        ) {
          throw new Error(
            `${label} ist ungültig.`,
          );
        }


        const normalized =
          value.trim();


        if (
          !normalized ||
          normalized.length >
            128
        ) {
          throw new Error(
            `${label} ist ungültig.`,
          );
        }


        return normalized;
      };


    const isAuthenticated =
      patch.isAuthenticated ===
      true;


    let displayName =
      isAuthenticated &&
      typeof patch.displayName ===
        'string'
        ? patch.displayName.trim()
        : 'Gast';


    if (!displayName) {
      displayName =
        isAuthenticated
          ? 'Spieler'
          : 'Gast';
    }


    displayName =
      displayName.slice(
        0,
        32,
      );


    const accountId =
      isAuthenticated
        ? normalizeOptionalId(
            patch.accountId,
            'Account-ID',
          )
        : null;


    const characterId =
      normalizeOptionalId(
        patch.characterId,
        'Charakter-ID',
      );


    let skinId =
      isAuthenticated
        ? normalizeOptionalId(
            patch.skinId,
            'Charakter-Skin-ID',
          )
        : null;


    let diceSkinId =
      isAuthenticated
        ? normalizeOptionalId(
            patch.diceSkinId,
            'Würfelskin-ID',
          )
        : null;


    /*
    * Ohne ausgewählten Charakter kann auch
    * kein Character-Skin aktiv sein.
    */
    if (!characterId) {
      skinId =
        null;
    }


    const changed =
      player.displayName !==
        displayName ||
      player.isAuthenticated !==
        isAuthenticated ||
      player.accountId !==
        accountId ||
      player.characterId !==
        characterId ||
      player.skinId !==
        skinId ||
      player.diceSkinId !==
        diceSkinId;


    if (!changed) {
      return false;
    }


    player.displayName =
      displayName;

    player.isAuthenticated =
      isAuthenticated;

    player.accountId =
      accountId;

    player.characterId =
      characterId;

    player.skinId =
      skinId;

    player.diceSkinId =
      diceSkinId;


    /*
    * Charakter / Skin gehören zur akzeptierten
    * Lobby-Konfiguration.
    *
    * Jede Änderung erzeugt daher dieselbe neue
    * Revision wie Modus / Ziel / Einsatz.
    */
    this.settings = {
      ...this.settings,

      revision:
        this.settings.revision +
        1,
    };


    this.#resetSettingsAcceptances();


    return true;
  }

  acceptSettings(
    socketId,
  ) {
    if (
      this.status !==
      'lobby'
    ) {
      throw new Error(
        'Die Lobby-Einstellungen können jetzt nicht mehr akzeptiert werden.',
      );
    }


    const player =
      this.getPlayerBySocketId(
        socketId,
      );


    if (!player) {
      throw new Error(
        'Spieler wurde im Room nicht gefunden.',
      );
    }
    if (
      !player.characterId
    ) {
      throw new Error(
        'Bitte wähle zuerst einen Charakter.',
      );
    }

    player.acceptedSettingsRevision =
      this.settings.revision;


    return true;
  }


  areSettingsAccepted() {
    const mode =
      getMultiplayerMode(
        this.settings
          .gameModeId,
      );


    if (!mode) {
      return false;
    }


    const playerCount =
      this.players.length;


    if (
      playerCount <
        mode.playerCount.min ||
      playerCount >
        mode.playerCount.max
    ) {
      return false;
    }


    return this.players.every(
      (player) =>
        Boolean(
          player.characterId,
        ) &&
        player
          .acceptedSettingsRevision ===
        this.settings.revision,
    );
  }

  #resetSettingsAcceptances() {
    for (
      const player
      of this.players
    ) {
      player.acceptedSettingsRevision =
        null;
    }
  }


  /*
   * =====================================================
   * GAME START
   * =====================================================
   */

validateGameStart(
  socketId,
) {
  if (
    this.status !==
    'lobby'
  ) {
    throw new Error(
      'Das Spiel wurde bereits gestartet.',
    );
  }


  const player =
    this.getPlayerBySocketId(
      socketId,
    );


  if (!player) {
    throw new Error(
      'Spieler wurde im Room nicht gefunden.',
    );
  }


  if (
    player.id !==
    this.hostPlayerId
  ) {
    throw new Error(
      'Nur der Host darf das Spiel starten.',
    );
  }


const mode =
  getMultiplayerMode(
    this.settings
      .gameModeId,
  );


  if (!mode) {
    throw new Error(
      'Ungültiger Multiplayer-Spielmodus.',
    );
  }


  const playerCount =
    this.players.length;


  if (
    playerCount <
      mode.playerCount.min ||
    playerCount >
      mode.playerCount.max
  ) {
    const playerRequirement =
      mode.playerCount.min ===
        mode.playerCount.max
        ? `genau ${mode.playerCount.min}`
        : `${mode.playerCount.min} bis ${mode.playerCount.max}`;


    throw new Error(
      `Für ${mode.name} werden ${playerRequirement} Spieler benötigt.`,
    );
  }


  if (
    !this.areSettingsAccepted()
  ) {
    throw new Error(
      'Alle Spieler müssen die Einstellungen akzeptieren.',
    );
  }


  /*
   * =====================================================
   * COIN BATTLE
   * =====================================================
   */

  if (
    mode.usesWager
  ) {
    const allAuthenticated =
      this.players.every(
        (roomPlayer) =>
          roomPlayer
            .isAuthenticated ===
            true &&
          Boolean(
            roomPlayer.accountId,
          ),
      );


    if (!allAuthenticated) {
      throw new Error(
        'Coin Battle erfordert zwei eingeloggte Accounts.',
      );
    }


    const [
      firstPlayer,
      secondPlayer,
    ] =
      this.players;


    if (
      firstPlayer.accountId ===
      secondPlayer.accountId
    ) {
      throw new Error(
        'Ein Account kann nicht gegen sich selbst Coin Battle spielen.',
      );
    }


    if (
      !Number.isSafeInteger(
        this.settings
          .wagerCoins,
      ) ||
      this.settings
        .wagerCoins <=
        0
    ) {
      throw new Error(
        'Ungültiger Coin-Einsatz.',
      );
    }
  }


  return {
    player,
    mode,
  };
}


  startGame(
    socketId,
  ) {
    this.validateGameStart(
      socketId,
    );


    this.match =
      new OnlineMatch({
        players:
          this.players,

        settings:
          this.settings,
      });


    this.status =
      'playing';


    return this.match;
  }


  rollbackGameStart(
    matchId,
  ) {
    if (
      this.status !==
        'playing' ||
      !this.match ||
      this.match.id !==
        matchId
    ) {
      return false;
    }

    this.match =
      null;


    this.status =
      'lobby';


    this.coinBattle =
      null;


    return true;
  }

  setCoinBattleState({
    battleId,
    wagerCoins,
    potCoins,
  }) {
    if (
      !battleId ||
      !Number.isSafeInteger(
        wagerCoins,
      ) ||
      !Number.isSafeInteger(
        potCoins,
      )
    ) {
      throw new Error(
        'Ungültiger CoinBattle-State.',
      );
    }


    this.coinBattle = {
      battleId,

      wagerCoins,

      potCoins,

      status:
        'playing',
    };
  }
markCoinBattleSettled({
  winnerPlayerId,
  settlementReason,
}) {
  if (
    !this.coinBattle
  ) {
    return false;
  }


  /*
   * Bereits lokal abgeschlossen.
   */
  if (
    this.coinBattle
      .status ===
    'settled'
  ) {
    return false;
  }


  if (
    this.coinBattle
      .status !==
    'playing'
  ) {
    throw new Error(
      'CoinBattle befindet sich nicht im auszahlbaren Zustand.',
    );
  }


  const winner =
    this.getPlayerById(
      winnerPlayerId,
    );


  if (!winner) {
    throw new Error(
      'CoinBattle-Sieger wurde im Room nicht gefunden.',
    );
  }


  this.coinBattle = {
    ...this.coinBattle,

    status:
      'settled',

    winnerPlayerId,

    settlementReason,
  };


  return true;
}


  #assertAllMatchPlayersConnected() {
    const disconnectedPlayer =
      this.players.find(
        (player) =>
          player.connectionStatus !==
          'connected',
      );


    if (!disconnectedPlayer) {
      return;
    }


    throw new Error(
      'Das Match ist pausiert, weil ein Spieler die Verbindung verloren hat.',
    );
  }
  /*
   * =====================================================
   * GAME PLAYER
   * =====================================================
   */

  #getMatchPlayer(
    socketId,
  ) {
    if (
      this.status !==
        'playing' ||
      !this.match
    ) {
      throw new Error(
        'Es läuft kein Match.',
      );
    }


    this.#assertAllMatchPlayersConnected();


    const player =
      this.getPlayerBySocketId(
        socketId,
      );


    if (!player) {
      throw new Error(
        'Spieler wurde im Match nicht gefunden.',
      );
    }


    return player;
  }


  /*
   * =====================================================
   * ROLL
   * =====================================================
   */

rollDice(
  socketId,
) {
  const player =
    this.#getMatchPlayer(
      socketId,
    );


  const result =
    this.match.roll(
      player.id,
    );


  /*
   * Ein Bust kann der letzte Zug
   * einer Nachziehrunde sein.
   */
  this.#syncMatchStatus();


  return result;
}

  /*
   * =====================================================
   * DICE SELECTION
   * =====================================================
   *
   * Der Client sendet nur die Indizes der
   * ausgewählten Würfel.
   *
   * Ob diese Auswahl regelkonform ist,
   * entscheidet ausschließlich OnlineMatch.
   */

  setDiceSelection(
    socketId,
    selectedDiceIndices,
  ) {
    const player =
      this.#getMatchPlayer(
        socketId,
      );


    return this.match
      .setSelectedDiceIndices(
        player.id,
        selectedDiceIndices,
      );
  }


  /*
   * =====================================================
   * SCORING
   * =====================================================
   *
   * Der Browser sendet nur die ID einer bereits
   * serverseitig berechneten Interpretation.
   *
   * Punkte oder herausgelegte Würfel werden
   * niemals vom Browser übernommen.
   */

  applyScoring(
    socketId,
    interpretationId,
  ) {
    const player =
      this.#getMatchPlayer(
        socketId,
      );


    const result =
      this.match
        .applySelectedScoring(
          player.id,
          interpretationId,
        );


    /*
     * Sechs Einsen können OnlineMatch direkt
     * in den Zustand "finished" versetzen.
     *
     * Der übergeordnete Room muss denselben
     * Zustand widerspiegeln.
     */
    this.#syncMatchStatus();


    return result;
  }


  /*
   * =====================================================
   * STRASSEN-NACHWURF
   * =====================================================
   */

  useStraightReroll(
    socketId,
  ) {
    const player =
      this.#getMatchPlayer(
        socketId,
      );


    return this.match
      .useStraightReroll(
        player.id,
      );
  }
#syncMatchStatus() {
  if (
    this.match
      ?.status ===
    'finished'
  ) {
    this.status =
      'finished';
  }
}

/*
 * =====================================================
 * BANK / SICHERN
 * =====================================================
 */

bankTurn(
  socketId,
) {
  const player =
    this.#getMatchPlayer(
      socketId,
    );


  const result =
    this.match.bank(
      player.id,
    );


  this.#syncMatchStatus();


  return result;
}


  /*
   * =====================================================
   * PUBLIC STATE
   * =====================================================
   *
   * socketId wird absichtlich niemals
   * an Browser übertragen.
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

      /*
       * Ein laufendes bzw. beendetes Match
       * kann nicht erneut gestartet werden.
       */
      canStart:
        this.status ===
          'lobby' &&
        this.areSettingsAccepted(),

      settings: {
        ...this.settings,
      },


      coinBattle:
        this.coinBattle
          ? {
              battleId:
                this.coinBattle
                  .battleId,

              wagerCoins:
                this.coinBattle
                  .wagerCoins,

              potCoins:
                this.coinBattle
                  .potCoins,

              status:
                this.coinBattle
                  .status,

              winnerPlayerId:
                this.coinBattle
                  .winnerPlayerId ??
                null,

              settlementReason:
                this.coinBattle
                  .settlementReason ??
                null,
            }
          : null,


      players:
        this.players.map(
        ({
          socketId,
          reconnectToken,
          accountId,
          ...publicPlayer
        }) => ({
            ...publicPlayer,
          }),
        ),

      match:
        this.match
          ?.toPublicState() ??
        null,
    };
  }
}