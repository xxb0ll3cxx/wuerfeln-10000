import {
  randomInt,
} from 'node:crypto';

import {
  GameRoom,
} from './GameRoom.js';


const ROOM_CODE_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';


const ROOM_CODE_LENGTH =
  6;


function createRandomRoomCode() {
  let code =
    '';


  for (
    let index = 0;
    index < ROOM_CODE_LENGTH;
    index += 1
  ) {
    const randomIndex =
      randomInt(
        0,
        ROOM_CODE_ALPHABET.length,
      );


    code +=
      ROOM_CODE_ALPHABET[
        randomIndex
      ];
  }


  return code;
}


export class RoomManager {
  constructor() {
    /*
     * roomId → GameRoom
     */
    this.rooms =
      new Map();


    /*
     * socketId → roomId
     *
     * Dadurch können wir schnell feststellen,
     * in welchem Room ein Socket steckt.
     */
    this.socketToRoomId =
      new Map();
  }


  createRoom(
    hostSocketId,
  ) {
    if (
      this.socketToRoomId.has(
        hostSocketId,
      )
    ) {
      throw new Error(
        'Dieser Client befindet sich bereits in einem Room.',
      );
    }


    const roomId =
      this.#createUniqueRoomId();


    const room =
      new GameRoom({
        id:
          roomId,

        hostSocketId,
      });


    this.rooms.set(
      roomId,
      room,
    );


    this.socketToRoomId.set(
      hostSocketId,
      roomId,
    );


    return room;
  }

  joinRoom(
    roomId,
    socketId,
  ) {
    if (
      this.socketToRoomId.has(
        socketId,
      )
    ) {
      throw new Error(
        'Dieser Client befindet sich bereits in einem Room.',
      );
    }


    const normalizedRoomId =
      String(
        roomId ?? '',
      )
        .trim()
        .toUpperCase();


    if (!normalizedRoomId) {
      throw new Error(
        'Room-Code fehlt.',
      );
    }


    const room =
      this.rooms.get(
        normalizedRoomId,
      );


    if (!room) {
      throw new Error(
        'Room wurde nicht gefunden.',
      );
    }


    if (
      room.status !==
      'lobby'
    ) {
      throw new Error(
        'Diesem Room kann nicht mehr beigetreten werden.',
      );
    }


    /*
     * Für den ersten Multiplayer-Modus
     * unterstützen wir genau zwei Spieler.
     */
    if (
      room.playerCount >= 8
    ) {
      throw new Error(
        'Der Room ist bereits voll.',
      );
    }


    room.addPlayer({
      socketId,

      displayName:
        'Gast',
    });


    this.socketToRoomId.set(
      socketId,
      normalizedRoomId,
    );


    return room;
  }


  getRoom(
    roomId,
  ) {
    return (
      this.rooms.get(
        roomId,
      ) ??
      null
    );
  }

  getRoomBySocketId(
    socketId,
  ) {
    const roomId =
      this.socketToRoomId.get(
        socketId,
      );


    if (!roomId) {
      return null;
    }


    return this.getRoom(
      roomId,
    );
  }
getRoomById(
  roomId,
) {
  const normalizedRoomId =
    String(
      roomId ?? '',
    )
      .trim()
      .toUpperCase();


  if (!normalizedRoomId) {
    return null;
  }


  return (
    this.rooms.get(
      normalizedRoomId,
    ) ??
    null
  );
}
reconnectSocket({
  roomId,
  playerId,
  reconnectToken,
  socketId,
}) {
  if (
    !roomId ||
    !playerId ||
    !reconnectToken ||
    !socketId
  ) {
    throw new Error(
      'Ungültige Reconnect-Daten.',
    );
  }


  /*
   * Ein neuer Socket darf noch keinem
   * anderen Room zugeordnet sein.
   */
  if (
    this.socketToRoomId.has(
      socketId,
    )
  ) {
    throw new Error(
      'Dieser Socket befindet sich bereits in einem Room.',
    );
  }


  const normalizedRoomId =
    String(
      roomId,
    )
      .trim()
      .toUpperCase();


  const room =
    this.rooms.get(
      normalizedRoomId,
    );


  if (!room) {
    throw new Error(
      'Room wurde nicht gefunden.',
    );
  }

  const player =
    room.reconnectPlayer({
      playerId,
      reconnectToken,
      socketId,
    });

  this.socketToRoomId.set(
    socketId,
    normalizedRoomId,
  );


  return {
    room,
    player,
  };
}

disconnectSocketFromMatch(
  socketId,
) {
  const roomId =
    this.socketToRoomId.get(
      socketId,
    );


  if (!roomId) {
    return null;
  }


  const room =
    this.rooms.get(
      roomId,
    );


  /*
   * Die Netzwerkzuordnung dieses alten
   * Sockets ist ab jetzt ungültig.
   *
   * Der PLAYER bleibt aber bestehen.
   */
  this.socketToRoomId.delete(
    socketId,
  );


  if (!room) {
    return null;
  }


  const player =
    room.markPlayerDisconnected(
      socketId,
    );


  return {
    room,
    player,
  };
}
    removeSocket(
        socketId,
        ) {
        const roomId =
        this.socketToRoomId.get(
            socketId,
        );


        if (!roomId) {
        return null;
        }


        const room =
        this.rooms.get(
            roomId,
        );


        this.socketToRoomId.delete(
        socketId,
        );


        if (!room) {
        return null;
        }


        room.removePlayerBySocketId(
        socketId,
        );


        if (
        room.playerCount === 0
        ) {
        this.rooms.delete(
            roomId,
        );


        console.log(
            '[RoomManager] Room gelöscht:',
            roomId,
        );


        return {
            room,
            deleted:
            true,
        };
        }


        return {
        room,
        deleted:
            false,
        };
    }
deleteRoom(
  roomId,
) {
  const normalizedRoomId =
    String(
      roomId ?? '',
    )
      .trim()
      .toUpperCase();


  if (!normalizedRoomId) {
    return null;
  }


  const room =
    this.rooms.get(
      normalizedRoomId,
    );


  if (!room) {
    return null;
  }


  /*
   * Alle Socket-Zuordnungen des Rooms entfernen.
   */
  for (
    const [
      socketId,
      mappedRoomId,
    ]
    of this.socketToRoomId
  ) {
    if (
      mappedRoomId ===
      normalizedRoomId
    ) {
      this.socketToRoomId.delete(
        socketId,
      );
    }
  }


  this.rooms.delete(
    normalizedRoomId,
  );


  console.log(
    '[RoomManager] Room endgültig gelöscht:',
    normalizedRoomId,
  );


  return room;
}
  getRoomCount() {
    return this.rooms.size;
  }


  #createUniqueRoomId() {
    /*
     * Kollisionen sind sehr unwahrscheinlich,
     * werden trotzdem korrekt abgefangen.
     */
    for (
      let attempt = 0;
      attempt < 20;
      attempt += 1
    ) {
      const roomId =
        createRandomRoomCode();


      if (
        !this.rooms.has(
          roomId,
        )
      ) {
        return roomId;
      }
    }


    throw new Error(
      'Es konnte keine freie Room-ID erzeugt werden.',
    );
  }
}