import {
  createServer,
} from 'node:http';

import {
  Server,
} from 'socket.io';

import {
  SERVER_EVENTS,
} from '../../shared/protocol/serverEvents.js';

const PORT =
  Number(
    process.env.PORT ??
    3000,
  );
import {
  CLIENT_EVENTS,
} from '../../shared/protocol/clientEvents.js';

import {
  RoomManager,
} from './rooms/RoomManager.js';
import {
  randomUUID,
} from 'node:crypto';

import {
  supabaseAdmin,
} from './lib/supabaseAdmin.js';

import {
  OnlineCoinRewardService,
} from './services/OnlineCoinRewardService.js';

/*
 * =========================================================
 * HTTP SERVER
 * =========================================================
 */

const httpServer =
  createServer(
    (
      request,
      response,
    ) => {
      /*
       * Einfacher Health Check.
       */
      if (
        request.url === '/health' &&
        request.method === 'GET'
      ) {
        response.writeHead(
          200,
          {
            'Content-Type':
              'application/json; charset=utf-8',
          },
        );


        response.end(
          JSON.stringify({
            ok: true,
            service:
              'wuerfeln-10000-server',
          }),
        );


        return;
      }


      /*
       * Wichtig:
       *
       * Requests an /socket.io/ werden von Socket.IO
       * selbst verarbeitet.
       *
       * Deshalb behandeln wir diese hier nicht als 404.
       */
      if (
        request.url?.startsWith(
          '/socket.io/',
        )
      ) {
        return;
      }


      response.writeHead(
        404,
        {
          'Content-Type':
            'application/json; charset=utf-8',
        },
      );


      response.end(
        JSON.stringify({
          error:
            'Not Found',
        }),
      );
    },
  );


/*
 * =========================================================
 * SOCKET.IO SERVER
 * =========================================================
 */

const io =
  new Server(
    httpServer,
    {
      cors: {
        origin: [
          'http://localhost:5173',
          'http://127.0.0.1:5173',
        ],

        methods: [
          'GET',
          'POST',
        ],
      },
    },
  );

const roomManager =
  new RoomManager();


const onlineCoinRewardService =
  new OnlineCoinRewardService(
    supabaseAdmin,
  );


const reconnectTimers =
  new Map();

  
const ROOM_CLEANUP_DELAY_MS =
  10_000;


const roomCleanupTimers =
  new Map();


function getReconnectTimerKey(
  roomId,
  playerId,
) {
  return `${roomId}:${playerId}`;
}
/*
 * =========================================================
 * CONNECTIONS
 * =========================================================
 */
function broadcastConnectionCount() {
  const connectionCount =
    io.of('/')
      .sockets
      .size;


  io.emit(
    SERVER_EVENTS.CONNECTION_COUNT,
    {
      count:
        connectionCount,
    },
  );


  console.log(
    '[Multiplayer] Verbindungsstand gesendet:',
    connectionCount,
  );
}
function scheduleFinishedRoomCleanup(
  room,
) {
  if (
    !room ||
    room.status !==
      'finished'
  ) {
    return;
  }


  /*
   * Derselbe Room darf nur einen
   * Cleanup-Timer besitzen.
   */
  if (
    roomCleanupTimers.has(
      room.id,
    )
  ) {
    return;
  }


  console.log(
    '[RoomManager] Cleanup geplant:',
    room.id,
  );


  const cleanupTimer =
    setTimeout(
      () => {
        roomCleanupTimers.delete(
          room.id,
        );


        /*
         * Falls der Room inzwischen bereits
         * anderweitig gelöscht wurde, ist nichts
         * mehr zu tun.
         */
        const currentRoom =
          roomManager
            .getRoomById(
              room.id,
            );


        if (
          !currentRoom ||
          currentRoom.status !==
            'finished'
        ) {
          return;
        }


        /*
         * Eventuelle alte Reconnect-Timer dieses
         * Rooms ebenfalls entfernen.
         */
        for (
          const [
            timerKey,
            reconnectTimer,
          ]
          of reconnectTimers
        ) {
          if (
            timerKey.startsWith(
              `${room.id}:`,
            )
          ) {
            clearTimeout(
              reconnectTimer,
            );


            reconnectTimers.delete(
              timerKey,
            );
          }
        }


        /*
         * Sockets verlassen nur den Socket.IO-Room.
         * Ihre eigentliche Serververbindung bleibt
         * bestehen.
         */
        io.in(
          room.id,
        )
          .socketsLeave(
            room.id,
          );


        roomManager.deleteRoom(
          room.id,
        );


        console.log(
          '[RoomManager] Cleanup abgeschlossen:',
          room.id,
        );
      },
      ROOM_CLEANUP_DELAY_MS,
    );


    roomCleanupTimers.set(
        room.id,
        cleanupTimer,
  );
}
io.use(
  async (
    socket,
    next,
  ) => {
    const accessToken =
      socket.handshake
        .auth
        ?.accessToken;


    /*
     * Kein Token = Gast.
     * Normale Online-Partien bleiben erlaubt.
     */
    if (!accessToken) {
      socket.data.authUserId =
        null;


      next();

      return;
    }


    try {
      const {
        data,
        error,
      } =
        await supabaseAdmin
          .auth
          .getUser(
            accessToken,
          );


      if (
        error ||
        !data.user
      ) {
        next(
          new Error(
            'Ungültige Account-Sitzung.',
          ),
        );


        return;
      }


      socket.data.authUserId =
        data.user.id;


      next();

    } catch (
      error
    ) {
      console.error(
        '[Auth] Socket-Authentifizierung fehlgeschlagen:',
        error,
      );


      next(
        new Error(
          'Account konnte nicht verifiziert werden.',
        ),
      );
    }
  },
);
async function awardOnlineReward({
  socket,
  room,
  eventType,
  bankedScore,
}) {
  const userId =
    socket.data
      .authUserId;


  /*
   * Gäste erhalten keine persistenten Coins.
   */
  if (!userId) {
    return;
  }


  /*
   * Entsprechend der bestehenden Coin-Regel.
   */
  if (
    bankedScore <=
    1000
  ) {
    return;
  }


  const matchId =
    room.match
      ?.id;


  if (!matchId) {
    console.error(
      '[Coins] Match-ID fehlt.',
    );


    return;
  }


  const eventId =
    randomUUID();


  try {
    const result =
      await onlineCoinRewardService
        .awardReward({
          userId,
          eventId,
          matchId,
          eventType,
          bankedScore,
        });


    socket.emit(
      SERVER_EVENTS.WALLET_UPDATE,
      {
        userId,

        reason:
          'game-reward',

        eventId,

        matchId,

        eventType,

        bankedScore,

        awardedCoins:
          result
            .awarded_coins,

        balance:
          result.balance,

        alreadyProcessed:
          result
            .already_processed,
      },
    );


    console.log(
      '[Coins] Online-Reward:',
      {
        userId,
        matchId,
        eventType,
        bankedScore,

        awardedCoins:
          result
            .awarded_coins,

        balance:
          result.balance,
      },
    );

  } catch (
    error
  ) {
    /*
     * Das Match selbst darf wegen eines
     * Wallet-/Netzwerkfehlers nicht abstürzen.
     */
    console.error(
      '[Coins] Online-Reward fehlgeschlagen:',
      {
        userId,
        matchId,
        eventType,
        bankedScore,

        error:
          error.message,
      },
    );
  }
}

io.on(
  'connection',
  (
    socket,
  ) => {
    console.log(
      '[Multiplayer] Client verbunden:',
      socket.id,
    );


    broadcastConnectionCount();

    socket.on(
      CLIENT_EVENTS.ROOM_CREATE,
      () => {
        const existingRoom =
          roomManager
            .getRoomBySocketId(
              socket.id,
            );


        if (existingRoom) {
          socket.emit(
            SERVER_EVENTS.ROOM_ERROR,
            {
              code:
                'already-in-room',

              message:
                'Du befindest dich bereits in einem Room.',
            },
          );


          return;
        }


        try {
          const room =
            roomManager
              .createRoom(
                socket.id,
              );


          /*
           * Zusätzlich zum eigenen GameRoom
           * verwenden wir auch Socket.IO-Rooms.
           *
           * Später können wir dadurch:
           *
           * io.to(room.id).emit(...)
           *
           * verwenden.
           */
          socket.join(
            room.id,
          );

          const publicRoomState =
            room.toPublicState();

          const hostPlayer =
            room.getPlayerBySocketId(
              socket.id,
            );


          if (!hostPlayer) {
            throw new Error(
              'Host-Spieler wurde nicht gefunden.',
            );
          }


          socket.emit(
            SERVER_EVENTS.ROOM_MEMBERSHIP,
            {
              roomId:
                room.id,

              playerId:
                hostPlayer.id,

              reconnectToken:
                hostPlayer.reconnectToken,
            },
          );

          socket.emit(
            SERVER_EVENTS.ROOM_CREATED,
            publicRoomState,
          );


          console.log(
            '[RoomManager] Room erstellt:',
            room.id,
          );


          console.log(
            '[RoomManager] Rooms gesamt:',
            roomManager
              .getRoomCount(),
          );
        }
        catch (
          error
        ) {
          console.error(
            '[RoomManager] Room konnte nicht erstellt werden:',
            error,
          );


          socket.emit(
            SERVER_EVENTS.ROOM_ERROR,
            {
              code:
                'room-create-failed',

              message:
                'Der Room konnte nicht erstellt werden.',
            },
          );
        }
      }, 
    );
    socket.on(
      CLIENT_EVENTS.GAME_FORFEIT,
      () => {
        const room =
          roomManager
            .getRoomBySocketId(
              socket.id,
            );


        if (!room) {
          socket.emit(
            SERVER_EVENTS.GAME_ERROR,
            {
              code:
                'not-in-room',

              message:
                'Du befindest dich in keinem Room.',
            },
          );


          return;
        }


        try {
          const result =
            room
              .forfeitPlayerBySocketId(
                socket.id,
              );


          console.log(
            '[Game] Spieler gibt Match auf:',
            {
              roomId:
                room.id,

              loserPlayerId:
                result.loserPlayerId,

              winnerPlayerId:
                result.winnerPlayerId,
            },
          );


          io.to(
            room.id,
          )
            .emit(
              SERVER_EVENTS.ROOM_STATE,
              room.toPublicState(),
            );
            scheduleFinishedRoomCleanup(
              room,
            );

          /*
          * Später:
          *
          * Falls CoinBattle:
          * reservierten Einsatz endgültig
          * dem Gewinner zuweisen.
          */
        }
        catch (
          error
        ) {
          socket.emit(
            SERVER_EVENTS.GAME_ERROR,
            {
              code:
                'forfeit-failed',

              message:
                error.message,
            },
          );
        }
      },
    );
    socket.on(
      CLIENT_EVENTS.ROOM_RECONNECT,
      (
        payload,
      ) => {
        try {
          const roomId =
            String(
              payload?.roomId ??
              '',
            )
              .trim()
              .toUpperCase();


          const playerId =
            String(
              payload?.playerId ??
              '',
            )
              .trim();


          const reconnectToken =
            String(
              payload?.reconnectToken ??
              '',
            )
              .trim();


          if (
            !roomId ||
            !playerId ||
            !reconnectToken
          ) {
            throw new Error(
              'Ungültige Reconnect-Daten.',
            );
          }


          const {
            room,
            player,
          } =
            roomManager
              .reconnectSocket({
                roomId,
                playerId,
                reconnectToken,
                socketId:
                  socket.id,
              });
              const timerKey =
                getReconnectTimerKey(
                  room.id,
                  player.id,
                );


              const reconnectTimer =
                reconnectTimers.get(
                  timerKey,
                );


              if (
                reconnectTimer
              ) {
                clearTimeout(
                  reconnectTimer,
                );


                reconnectTimers.delete(
                  timerKey,
                );


                console.log(
                  '[Multiplayer] Reconnect-Frist abgebrochen:',
                  player.id,
                );
              }
          socket.join(
            room.id,
          );


          socket.emit(
            SERVER_EVENTS.ROOM_MEMBERSHIP,
            {
              roomId:
                room.id,

              playerId:
                player.id,

              reconnectToken:
                player.reconnectToken,
            },
          );


          /*
          * Danach erhalten beide Clients den
          * wiederhergestellten autoritativen State.
          */
          io.to(
            room.id,
          )
            .emit(
              SERVER_EVENTS.ROOM_STATE,
              room.toPublicState(),
            );
            scheduleFinishedRoomCleanup(
              room,
            );

          console.log(
            '[Multiplayer] Spieler wieder verbunden:',
            player.id,
          );
        }
        catch (
          error
        ) {
          console.error(
            '[Multiplayer] Reconnect fehlgeschlagen:',
            error,
          );


          socket.emit(
            SERVER_EVENTS.ROOM_ERROR,
            {
              code:
                'room-reconnect-failed',

              message:
                error.message,
            },
          );
        }
      },
    );
    socket.on(
      CLIENT_EVENTS.GAME_ROLL,
      () => {
        const room =
          roomManager
            .getRoomBySocketId(
              socket.id,
            );


        if (!room) {
          socket.emit(
            SERVER_EVENTS.GAME_ERROR,
            {
              code:
                'not-in-room',

              message:
                'Du befindest dich in keinem Room.',
            },
          );


          return;
        }


        try {
          const rollResult =
            room.rollDice(
              socket.id,
            );


          console.log(
            '[Game] Würfelergebnis:',
            room.id,
            rollResult.values,
          );


          console.log(
            '[Game] Fehlwurf:',
            rollResult.isBust,
          );


          /*
          * Autoritativen State an beide
          * Spieler verteilen.
          */
          io.to(
            room.id,
          )
            .emit(
              SERVER_EVENTS.ROOM_STATE,
              room.toPublicState(),
            );
            scheduleFinishedRoomCleanup(
              room,
            );
        }
        catch (
          error
        ) {
          console.error(
            '[Game] Würfeln fehlgeschlagen:',
            error,
          );


          socket.emit(
            SERVER_EVENTS.GAME_ERROR,
            {
              code:
                'roll-failed',

              message:
                error.message,
            },
          );
        }
      },
    );
/*
 * =========================================================
 * GAME – WÜRFELAUSWAHL
 * =========================================================
 */

socket.on(
  CLIENT_EVENTS.GAME_SELECTION_SET,
  (
    payload,
  ) => {
    const room =
      roomManager
        .getRoomBySocketId(
          socket.id,
        );


    if (!room) {
      socket.emit(
        SERVER_EVENTS.GAME_ERROR,
        {
          code:
            'not-in-room',

          message:
            'Du befindest dich in keinem Room.',
        },
      );


      return;
    }


    try {
      /*
       * Wichtig:
       *
       * Der Client sendet nur seine Auswahl.
       *
       * Ob diese Auswahl gültig ist,
       * prüft OnlineMatch mit dem bestehenden
       * validateScoringSelection().
       */
      room.setDiceSelection(
        socket.id,
        payload
          ?.selectedDiceIndices,
      );


      io.to(
        room.id,
      )
        .emit(
          SERVER_EVENTS.ROOM_STATE,
          room.toPublicState(),
        );
    }
    catch (
      error
    ) {
      console.error(
        '[Game] Würfelauswahl fehlgeschlagen:',
        error,
      );


      socket.emit(
        SERVER_EVENTS.GAME_ERROR,
        {
          code:
            'selection-failed',

          message:
            error.message,
        },
      );
    }
  },
);

/*
 * =========================================================
 * GAME – WERTUNG ANWENDEN
 * =========================================================
 */

socket.on(
  CLIENT_EVENTS.GAME_SCORING_APPLY,
  (
    payload,
  ) => {
    const room =
      roomManager
        .getRoomBySocketId(
          socket.id,
        );


    if (!room) {
      socket.emit(
        SERVER_EVENTS.GAME_ERROR,
        {
          code:
            'not-in-room',

          message:
            'Du befindest dich in keinem Room.',
        },
      );


      return;
    }


    try {

      
      const result =
        room.applyScoring(
          socket.id,
          payload
            ?.interpretationId,
        );
        if (
          result.isInstantWin
        ) {
          void awardOnlineReward({
            socket,
            room,

            eventType:
              'instant_win',

            bankedScore:
              result.appliedScore,
          });
        }

      console.log(
        '[Game] Wertung angewendet:',
        {
          roomId:
            room.id,

          score:
            result.appliedScore,

          hotDice:
            result.isHotDice,

          instantWin:
            result.isInstantWin,
        },
      );


      io.to(
        room.id,
      )
        .emit(
          SERVER_EVENTS.ROOM_STATE,
          room.toPublicState(),
        );
    }
    catch (
      error
    ) {
      console.error(
        '[Game] Wertung fehlgeschlagen:',
        error,
      );


      socket.emit(
        SERVER_EVENTS.GAME_ERROR,
        {
          code:
            'scoring-failed',

          message:
            error.message,
        },
      );
    }
  },
);


/*
 * =========================================================
 * GAME – STRASSEN-NACHWURF
 * =========================================================
 */

socket.on(
  CLIENT_EVENTS.GAME_STRAIGHT_REROLL,
  () => {
    const room =
      roomManager
        .getRoomBySocketId(
          socket.id,
        );


    if (!room) {
      socket.emit(
        SERVER_EVENTS.GAME_ERROR,
        {
          code:
            'not-in-room',

          message:
            'Du befindest dich in keinem Room.',
        },
      );


      return;
    }


    try {
      /*
       * Der Server prüft selbst nochmals,
       * ob die Sonderregel wirklich erlaubt ist.
       */
      const option =
        room.useStraightReroll(
          socket.id,
        );


      console.log(
        '[Game] Straßen-Nachwurf:',
        {
          roomId:
            room.id,

          matches:
            option.matches,
        },
      );


      io.to(
        room.id,
      )
        .emit(
          SERVER_EVENTS.ROOM_STATE,
          room.toPublicState(),
        );
    }
    catch (
      error
    ) {
      console.error(
        '[Game] Straßen-Nachwurf fehlgeschlagen:',
        error,
      );


      socket.emit(
        SERVER_EVENTS.GAME_ERROR,
        {
          code:
            'straight-reroll-failed',

          message:
            error.message,
        },
      );
    }
  },
);
    socket.on(
      CLIENT_EVENTS.ROOM_JOIN,
      (
        payload,
      ) => {
        const roomId =
          payload?.roomId;


          if (
            typeof roomId !==
              'string' ||
            !roomId.trim()
          ) {
            socket.emit(
              SERVER_EVENTS.ROOM_ERROR,
              {
                code:
                  'invalid-room-code',

                message:
                  'Bitte gib einen gültigen Room-Code ein.',
              },
            );


            return;
          }


        try {
          const room =
            roomManager
              .joinRoom(
                roomId,
                socket.id,
              );


          /*
           * Socket.IO-Room ebenfalls betreten.
           */
          socket.join(
            room.id,
          );

          const joinedPlayer =
            room.getPlayerBySocketId(
              socket.id,
            );


          if (!joinedPlayer) {
            throw new Error(
              'Beigetretener Spieler konnte nicht ermittelt werden.',
            );
          }


          socket.emit(
            SERVER_EVENTS.ROOM_MEMBERSHIP,
            {
              roomId:
                room.id,

              playerId:
                joinedPlayer.id,

              reconnectToken:
                joinedPlayer.reconnectToken,
            },
          );

          const publicRoomState =
            room.toPublicState();


          /*
           * Ganz entscheidend:
           *
           * Nicht nur der neue Spieler,
           * sondern ALLE Spieler im Room
           * erhalten denselben neuen State.
           */
          io.to(
            room.id,
          )
            .emit(
              SERVER_EVENTS.ROOM_STATE,
              publicRoomState,
            );
            scheduleFinishedRoomCleanup(
              room,
            );

          console.log(
            '[RoomManager] Spieler beigetreten:',
            room.id,
          );


          console.log(
            '[RoomManager] Spieler im Room:',
            room.playerCount,
          );
        }
        catch (
          error
        ) {
          console.error(
            '[RoomManager] Join fehlgeschlagen:',
            error,
          );


          socket.emit(
            SERVER_EVENTS.ROOM_ERROR,
            {
              code:
                'room-join-failed',

              message:
                error.message,
            },
          );
        }
      },
    );
    socket.on(
      CLIENT_EVENTS.ROOM_SETTINGS_UPDATE,
      (
        payload,
      ) => {
        const room =
          roomManager
            .getRoomBySocketId(
              socket.id,
            );


        if (!room) {
          socket.emit(
            SERVER_EVENTS.ROOM_ERROR,
            {
              code:
                'not-in-room',

              message:
                'Du befindest dich in keinem Room.',
            },
          );


          return;
        }


        try {
          const changed =
            room.updateSettings({
              socketId:
                socket.id,

              patch:
                payload?.settings,
            });


          if (!changed) {
            return;
          }


          /*
           * Alle Spieler erhalten exakt
           * denselben neuen Room-State.
           */
          io.to(
            room.id,
          )
            .emit(
              SERVER_EVENTS.ROOM_STATE,
              room.toPublicState(),
            );
               scheduleFinishedRoomCleanup(
              room,
            );
        }
        catch (
          error
        ) {
          socket.emit(
            SERVER_EVENTS.ROOM_ERROR,
            {
              code:
                'settings-update-failed',

              message:
                error.message,
            },
          );
        }
      },
    );
    socket.on(
      CLIENT_EVENTS.ROOM_PLAYER_UPDATE,
      (
        payload,
      ) => {
        const room =
          roomManager
            .getRoomBySocketId(
              socket.id,
            );


        if (!room) {
          socket.emit(
            SERVER_EVENTS.ROOM_ERROR,
            {
              code:
                'not-in-room',

              message:
                'Du befindest dich in keinem Room.',
            },
          );


          return;
        }


        try {
          const changed =
            room.updatePlayerSetup({
              socketId:
                socket.id,

              patch: {
                ...(
                  payload?.player ??
                  {}
                ),
                isAuthenticated:
                  Boolean(
                    socket.data
                      .authUserId,
                  ),

                accountId:
                  socket.data
                    .authUserId ??
                  null,
              },
            });


          if (!changed) {
            return;
          }


          io.to(
            room.id,
          )
            .emit(
              SERVER_EVENTS.ROOM_STATE,
              room.toPublicState(),
            );
        }
        catch (
          error
        ) {
          socket.emit(
            SERVER_EVENTS.ROOM_ERROR,
            {
              code:
                'player-update-failed',

              message:
                error.message,
            },
          );
        }
      },
    );
    socket.on(
      CLIENT_EVENTS.ROOM_SETTINGS_ACCEPT,
      () => {
        const room =
          roomManager
            .getRoomBySocketId(
              socket.id,
            );


        if (!room) {
          socket.emit(
            SERVER_EVENTS.ROOM_ERROR,
            {
              code:
                'not-in-room',

              message:
                'Du befindest dich in keinem Room.',
            },
          );


          return;
        }


        try {
          room.acceptSettings(
            socket.id,
          );


          io.to(
            room.id,
          )
            .emit(
              SERVER_EVENTS.ROOM_STATE,
              room.toPublicState(),
            );
               scheduleFinishedRoomCleanup(
              room,
            );
        }
        catch (
          error
        ) {
          socket.emit(
            SERVER_EVENTS.ROOM_ERROR,
            {
              code:
                'settings-accept-failed',

              message:
                error.message,
            },
          );
        }
      },
    );
    socket.on(
      CLIENT_EVENTS.GAME_START,
      () => {
        const room =
          roomManager
            .getRoomBySocketId(
              socket.id,
            );


        if (!room) {
          socket.emit(
            SERVER_EVENTS.GAME_ERROR,
            {
              code:
                'not-in-room',

              message:
                'Du befindest dich in keinem Room.',
            },
          );


          return;
        }


        try {
          const match =
            room.startGame(
              socket.id,
            );


          console.log(
            '[Game] Match gestartet:',
            match.id,
          );


          console.log(
            '[Game] Room:',
            room.id,
          );


          io.to(
            room.id,
          )
            .emit(
              SERVER_EVENTS.ROOM_STATE,
              room.toPublicState(),
            );
              scheduleFinishedRoomCleanup(
              room,
            );
        }
        catch (
          error
        ) {
          console.error(
            '[Game] Start fehlgeschlagen:',
            error,
          );


          socket.emit(
            SERVER_EVENTS.GAME_ERROR,
            {
              code:
                'game-start-failed',

              message:
                error.message,
            },
          );
        }
      },
    );
    /*
 * =========================================================
 * GAME – SICHERN
 * =========================================================
 */

socket.on(
  CLIENT_EVENTS.GAME_BANK,
  () => {
    const room =
      roomManager
        .getRoomBySocketId(
          socket.id,
        );


    if (!room) {
      socket.emit(
        SERVER_EVENTS.GAME_ERROR,
        {
          code:
            'not-in-room',

          message:
            'Du befindest dich in keinem Room.',
        },
      );


      return;
    }


    try {
      const result =
        room.bankTurn(
          socket.id,
        );
      void awardOnlineReward({
        socket,
        room,

        eventType:
          'bank',

        bankedScore:
          result.bankedScore,
      });

      console.log(
        '[Game] Punkte gesichert:',
        {
          roomId:
            room.id,

          bankedScore:
            result.bankedScore,

          totalScore:
            result.totalScore,

          reachedTargetScore:
            result.reachedTargetScore,
        },
      );


      /*
       * Beide Clients erhalten direkt:
       *
       * - neuen Gesamtstand
       * - lastBankedScore
       * - neuen aktiven Spieler
       * - neuen leeren Turn
       */
      io.to(
        room.id,
      )
        .emit(
          SERVER_EVENTS.ROOM_STATE,
          room.toPublicState(),
        );
        scheduleFinishedRoomCleanup(
          room,
        );
    }
    catch (
      error
    ) {
      console.error(
        '[Game] Sichern fehlgeschlagen:',
        error,
      );


      socket.emit(
        SERVER_EVENTS.GAME_ERROR,
        {
          code:
            'bank-failed',

          message:
            error.message,
        },
      );
    }
  },
);
socket.on(
  'disconnect',
  (
    reason,
  ) => {
    console.log(
      '[Multiplayer] Client getrennt:',
      socket.id,
    );


    console.log(
      '[Multiplayer] Grund:',
      reason,
    );


    /*
     * Zuerst ermitteln wir den Room,
     * solange die alte Socket-ID noch
     * dem Spieler zugeordnet ist.
     */
    const room =
      roomManager
        .getRoomBySocketId(
          socket.id,
        );


    if (room) {
      /*
       * ===================================================
       * LAUFENDES MATCH
       * ===================================================
       *
       * Spieler NICHT entfernen.
       *
       * Seine stabile player.id muss erhalten bleiben,
       * damit wir ihn im nächsten Schritt wieder mit
       * einem neuen Socket verbinden können.
       */
      if (
        room.status ===
        'playing'
      ) {
        const disconnectResult =
          roomManager
            .disconnectSocketFromMatch(
              socket.id,
            );


        const disconnectedPlayer =
          disconnectResult
            ?.player ??
          null;


        if (
          disconnectedPlayer
        ) {
          console.log(
            '[Multiplayer] Spieler im Match als getrennt markiert:',
            disconnectedPlayer.id,
          );
          const timerKey =
            getReconnectTimerKey(
              room.id,
              disconnectedPlayer.id,
            );


          const delay =
            Math.max(
              0,
              disconnectedPlayer
                .reconnectDeadlineAt -
              Date.now(),
            );


          console.log(
            '[Multiplayer] Reconnect-Frist gestartet:',
            {
              roomId:
                room.id,

              playerId:
                disconnectedPlayer.id,

              seconds:
                Math.ceil(
                  delay / 1000,
                ),
            },
          );


          const reconnectTimer =
            setTimeout(
              () => {
                reconnectTimers.delete(
                  timerKey,
                );


                const result =
                  room
                    .finishDisconnectedPlayerByForfeit(
                      disconnectedPlayer.id,
                    );


                if (!result) {
                  return;
                }


                console.log(
                  '[Multiplayer] Reconnect-Frist abgelaufen:',
                  {
                    roomId:
                      room.id,

                    loserPlayerId:
                      result.loserPlayerId,

                    winnerPlayerId:
                      result.winnerPlayerId,
                  },
                );


                io.to(
                  room.id,
                )
                  .emit(
                    SERVER_EVENTS.ROOM_STATE,
                    room.toPublicState(),
                  );
                  scheduleFinishedRoomCleanup(
                    room,
                  );

                /*
                * Später kommt GENAU HIER:
                *
                * CoinBattle-Abrechnung /
                * reservierten Einsatz an Gewinner geben.
                */
              },
              delay,
            );


          reconnectTimers.set(
            timerKey,
            reconnectTimer,
          );

          /*
           * Der verbliebene Client erfährt sofort,
           * dass der andere Spieler offline ist.
           */
          io.to(
            room.id,
          )
            .emit(
              SERVER_EVENTS.ROOM_STATE,
              room.toPublicState(),
            );
              scheduleFinishedRoomCleanup(
              room,
            );
        }
      }
      else {
        /*
         * =================================================
         * LOBBY / NICHT LAUFENDES MATCH
         * =================================================
         *
         * Hier darf weiterhin normal aufgeräumt werden.
         */
        const removalResult =
          roomManager
            .removeSocket(
              socket.id,
            );


        if (
          removalResult &&
          !removalResult.deleted
        ) {
          const {
            room:
              updatedRoom,
          } =
            removalResult;


          io.to(
            updatedRoom.id,
          )
            .emit(
              SERVER_EVENTS.ROOM_STATE,
              updatedRoom
                .toPublicState(),
            );
            scheduleFinishedRoomCleanup(
              room,
            );
        }
      }
    }


    /*
     * Einen Tick warten, damit Socket.IO
     * den getrennten Socket vollständig
     * aus seiner internen Liste entfernt hat.
     */
    setTimeout(
      () => {
        broadcastConnectionCount();
      },
      0,
    );
  },
);
  },
);


/*
 * =========================================================
 * START
 * =========================================================
 */

httpServer.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `[Multiplayer] Server läuft auf http://localhost:${PORT}`,
    );
  },
);