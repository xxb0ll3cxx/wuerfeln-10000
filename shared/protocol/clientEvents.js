export const CLIENT_EVENTS =
  Object.freeze({
    /*
     * =====================================================
     * ROOM
     * =====================================================
     */

    ROOM_CREATE:
      'room:create',

    ROOM_JOIN:
      'room:join',

    ROOM_PLAYER_UPDATE:
      'room:player:update',

    ROOM_SETTINGS_UPDATE:
      'room:settings:update',

    ROOM_SETTINGS_ACCEPT:
      'room:settings:accept',

    ROOM_RECONNECT:
      'room:reconnect',
    GAME_FORFEIT:
      'game:forfeit',
    /*
     * =====================================================
     * GAME
     * =====================================================
     */

    GAME_START:
      'game:start',

    GAME_ROLL:
      'game:roll',


    /*
     * Spieler ändert seine aktuelle Würfelauswahl.
     *
     * Payload:
     *
     * {
     *   selectedDiceIndices: [0, 2, 3]
     * }
     */
    GAME_SELECTION_SET:
      'game:selection:set',


    /*
     * Spieler bestätigt eine der vom Server
     * berechneten Wertungsinterpretationen.
     *
     * Payload:
     *
     * {
     *   interpretationId: '...'
     * }
     */
    GAME_SCORING_APPLY:
      'game:scoring:apply',


    /*
     * Sonderregel:
     * Straße mit bereits herausgelegter 1 / 5.
     */
    GAME_STRAIGHT_REROLL:
      'game:straight-reroll',

    GAME_BANK:
      'game:bank',
  });