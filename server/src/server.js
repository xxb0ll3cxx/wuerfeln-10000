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
        /*
         * Derselbe Socket darf aktuell
         * nicht mehrere Rooms besitzen.
         */
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
        socket.emit(
            SERVER_EVENTS.ROOM_STATE,
            publicRoomState,
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
      'disconnect',
      (
        reason,
      ) => {
        console.log(
          '[Multiplayer] Client getrennt:',
          socket.id,
        );
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
            room,
        } =
            removalResult;


        io.to(
            room.id,
        )
            .emit(
            SERVER_EVENTS.ROOM_STATE,
            room.toPublicState(),
            );
        }

        console.log(
          '[Multiplayer] Grund:',
          reason,
        );


        /*
         * Einen Tick warten, damit Socket.IO
         * den getrennten Socket vollständig
         * aus der Liste entfernt hat.
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