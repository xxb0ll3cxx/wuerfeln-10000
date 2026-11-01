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
import {
  CoinBattleService,
} from './services/CoinBattleService.js';
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


const coinBattleService =
  new CoinBattleService(
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
  if (
    room.settings
      ?.gameModeId ===
    'coinBattle'
  ) {
    return;
  }
  const userId =
    socket.data
      .authUserId;


  if (!userId) {
    return;
  }


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
function emitCoinBattleWalletUpdate({
  player,
  balance,
  battleId,
  wagerCoins,
  potCoins,
}) {
  if (
    !player
      ?.socketId ||
    !player
      ?.accountId ||
    !Number.isSafeInteger(
      balance,
    )
  ) {
    return;
  }


  io.to(
    player.socketId,
  )
    .emit(
      SERVER_EVENTS.WALLET_UPDATE,
      {
        userId:
          player.accountId,

        reason:
          'coin-battle-reserved',

        balance,

        battleId,

        wagerCoins,

        potCoins,
      },
    );
}
async function settleCoinBattle({
  room,
  winnerPlayerId,
  reason,
}) {
  /*
   * Normales Online-Spiel.
   */
  if (
    !room
      ?.coinBattle
  ) {
    return null;
  }


  /*
   * Bereits abgeschlossen.
   *
   * Verhindert auch unnötige zweite RPCs
   * innerhalb desselben Serverprozesses.
   */
  if (
    room.coinBattle
      .status ===
    'settled'
  ) {
    return null;
  }


  if (
    room.coinBattle
      .status !==
    'playing'
  ) {
    console.error(
      '[CoinBattle] Settlement in ungültigem Zustand:',
      {
        roomId:
          room.id,

        battleId:
          room.coinBattle
            .battleId,

        status:
          room.coinBattle
            .status,
      },
    );


    return null;
  }


  const winnerPlayer =
    room.getPlayerById(
      winnerPlayerId,
    );


  if (
    !winnerPlayer ||
    !winnerPlayer.accountId
  ) {
    console.error(
      '[CoinBattle] Sieger-Account fehlt:',
      {
        roomId:
          room.id,

        winnerPlayerId,
      },
    );


    return null;
  }


  try {
    const settlement =
      await coinBattleService
        .settleBattle({
          battleId:
            room.coinBattle
              .battleId,

          winnerUserId:
            winnerPlayer
              .accountId,

          reason,
        });


    room.markCoinBattleSettled({
      winnerPlayerId,

      settlementReason:
        reason,
    });


    const balance =
      Number(
        settlement.balance,
      );


    const potCoins =
      Number(
        settlement
          .pot_coins,
      );


    /*
     * Nur der Gewinner benötigt ein Wallet-Update.
     *
     * Der Verlierer wurde bereits beim Matchstart
     * um seinen Einsatz reduziert.
     */
    if (
      winnerPlayer.socketId &&
      Number.isSafeInteger(
        balance,
      )
    ) {
      io.to(
        winnerPlayer.socketId,
      )
        .emit(
          SERVER_EVENTS.WALLET_UPDATE,
          {
            userId:
              winnerPlayer
                .accountId,

            reason:
              'coin-battle-settled',

            battleId:
              room.coinBattle
                .battleId,

            settlementReason:
              reason,

            awardedCoins:
              potCoins,

            potCoins,

            balance,
          },
        );
    }


    console.log(
      '[CoinBattle] Pot ausgezahlt:',
      {
        roomId:
          room.id,

        battleId:
          room.coinBattle
            .battleId,

        winnerPlayerId,

        winnerUserId:
          winnerPlayer
            .accountId,

        potCoins,

        balance,

        reason,

        alreadySettled:
          settlement
            .already_settled,
      },
    );


    return settlement;

  } catch (
    error
  ) {
    console.error(
      '[CoinBattle] KRITISCH: Pot konnte nicht ausgezahlt werden:',
      {
        roomId:
          room.id,

        battleId:
          room.coinBattle
            .battleId,

        winnerPlayerId,

        reason,

        error:
          error.message,
      },
    );


    return null;
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
       async () => {
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
          await settleCoinBattle({
            room,

            winnerPlayerId:
              result.winnerPlayerId,

            reason:
              'forfeit',
          });

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
        async () => {
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
   
            if (
              room.status ===
                'finished' &&
              room.match
                ?.winnerPlayerId
            ) {
              await settleCoinBattle({
                room,

                winnerPlayerId:
                  room.match
                    .winnerPlayerId,

                reason:
                  'score',
              });
            }

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
  async (
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
        if (
          result.isInstantWin &&
          room.match
            ?.winnerPlayerId
        ) {
          await settleCoinBattle({
            room,

            winnerPlayerId:
              room.match
                .winnerPlayerId,

            reason:
              'instant-win',
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
      async () => {
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


        let reservedBattle =
          null;


        let startedMatch =
          null;


        try {
          /*
          * Noch bevor Coins verändert werden:
          *
          * - Host?
          * - 2 Spieler?
          * - alle akzeptiert?
          * - gültiger Modus?
          * - bei CoinBattle beide Accounts?
          */
          const {
            mode,
          } =
            room.validateGameStart(
              socket.id,
            );


          /*
          * ===================================================
          * COIN BATTLE – EINSATZ RESERVIEREN
          * ===================================================
          */

          if (
            mode.usesWager
          ) {
            const [
              player1,
              player2,
            ] =
              room.players;


            const battleId =
              randomUUID();


            const wagerCoins =
              room.settings
                .wagerCoins;


            console.log(
              '[CoinBattle] Reserviere Einsatz:',
              {
                roomId:
                  room.id,

                battleId,

                wagerCoins,
              },
            );


            const reservation =
              await coinBattleService
                .reserveBattle({
                  battleId,

                  roomId:
                    room.id,

                  player1UserId:
                    player1
                      .accountId,

                  player2UserId:
                    player2
                      .accountId,

                  wagerCoins,
                });


            reservedBattle = {
              battleId,

              player1,

              player2,

              wagerCoins,

              potCoins:
                Number(
                  reservation
                    .pot_coins,
                ),

              player1Balance:
                Number(
                  reservation
                    .player_1_balance,
                ),

              player2Balance:
                Number(
                  reservation
                    .player_2_balance,
                ),
            };


            console.log(
              '[CoinBattle] Einsatz reserviert:',
              {
                battleId,

                potCoins:
                  reservedBattle
                    .potCoins,
              },
            );
          }


          /*
          * ===================================================
          * MATCH ERZEUGEN
          * ===================================================
          */

          startedMatch =
            room.startGame(
              socket.id,
            );


          /*
          * ===================================================
          * COIN BATTLE MIT MATCH VERKNÜPFEN
          * ===================================================
          */

          if (
            reservedBattle
          ) {
            try {
              await coinBattleService
                .markBattleStarted({
                  battleId:
                    reservedBattle
                      .battleId,

                  matchId:
                    startedMatch.id,
                });
            }
            catch (
              startError
            ) {
              /*
              * Match wurde im RAM schon erzeugt,
              * aber noch nie an die Clients gesendet.
              *
              * Deshalb dürfen wir hier sicher auf
              * Lobby zurückrollen.
              */
              room.rollbackGameStart(
                startedMatch.id,
              );


              try {
                await coinBattleService
                  .refundReservedBattle({
                    battleId:
                      reservedBattle
                        .battleId,
                  });
              }
              catch (
                refundError
              ) {
                console.error(
                  '[CoinBattle] KRITISCH: Einsatz konnte nach fehlgeschlagenem Start nicht zurückerstattet werden:',
                  {
                    battleId:
                      reservedBattle
                        .battleId,

                    error:
                      refundError.message,
                  },
                );
              }


              throw startError;
            }


            room.setCoinBattleState({
              battleId:
                reservedBattle
                  .battleId,

              wagerCoins:
                reservedBattle
                  .wagerCoins,

              potCoins:
                reservedBattle
                  .potCoins,
            });


            /*
            * Erst jetzt Walletstände an die Clients schicken.
            *
            * Falls vorher etwas schiefgeht, sehen die Clients
            * keinen kurzzeitigen falschen Kontostand.
            */
            emitCoinBattleWalletUpdate({
              player:
                reservedBattle
                  .player1,

              balance:
                reservedBattle
                  .player1Balance,

              battleId:
                reservedBattle
                  .battleId,

              wagerCoins:
                reservedBattle
                  .wagerCoins,

              potCoins:
                reservedBattle
                  .potCoins,
            });


            emitCoinBattleWalletUpdate({
              player:
                reservedBattle
                  .player2,

              balance:
                reservedBattle
                  .player2Balance,

              battleId:
                reservedBattle
                  .battleId,

              wagerCoins:
                reservedBattle
                  .wagerCoins,

              potCoins:
                reservedBattle
                  .potCoins,
            });
          }


          console.log(
            '[Game] Match gestartet:',
            startedMatch.id,
          );


          console.log(
            '[Game] Room:',
            room.id,
          );


          if (
            reservedBattle
          ) {
            console.log(
              '[CoinBattle] Match gestartet:',
              {
                battleId:
                  reservedBattle
                    .battleId,

                matchId:
                  startedMatch.id,

                wagerCoins:
                  reservedBattle
                    .wagerCoins,

                potCoins:
                  reservedBattle
                    .potCoins,
              },
            );
          }


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
          /*
          * Falls die Reservierung erfolgreich war,
          * aber room.startGame() wegen einer Änderung
          * während des DB-Requests fehlschlug,
          * ebenfalls zurückerstatten.
          */
          if (
            reservedBattle &&
            !startedMatch
          ) {
            try {
              await coinBattleService
                .refundReservedBattle({
                  battleId:
                    reservedBattle
                      .battleId,
                });
            }
            catch (
              refundError
            ) {
              console.error(
                '[CoinBattle] KRITISCH: Reservierter Einsatz konnte nicht zurückerstattet werden:',
                {
                  battleId:
                    reservedBattle
                      .battleId,

                  error:
                    refundError.message,
                },
              );
            }
          }


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
  async () => {
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

      if (
        result.matchFinished &&
        result.winnerPlayerId
      ) {
        await settleCoinBattle({
          room,

          winnerPlayerId:
            result.winnerPlayerId,

          reason:
            'score',
        });
      }
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
               async () => {
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
                await settleCoinBattle({
                  room,

                  winnerPlayerId:
                    result.winnerPlayerId,

                  reason:
                    'disconnect-forfeit',
                });

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