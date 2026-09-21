import {
  createPlayer,
} from '../models/Player.js';

import {
  hasCharacter,
} from '../config/characters.js';

import {
  getCharacterSkinById,
} from '../config/characterSkins.js';

export class PlayerSetupController {
  createPlayers(
    playerInputs,
  ) {
    if (
      !Array.isArray(
        playerInputs,
      ) ||
      playerInputs.length === 0
    ) {
      throw new Error(
        'Mindestens ein Spieler wird benötigt.',
      );
    }


    return playerInputs.map(
      (
        input,
        index,
      ) => {
        if (
          !input ||
          typeof input !==
            'object'
        ) {
          throw new Error(
            `Spieler ${index + 1} enthält keine gültigen Daten.`,
          );
        }


        if (
          !hasCharacter(
            input.characterId,
          )
        ) {
          throw new Error(
            `Spieler ${index + 1} benötigt einen gültigen Charakter.`,
          );
        }


        const skinId =
          input.skinId ??
          null;


        if (skinId !== null) {
          const skin =
            getCharacterSkinById(
              skinId,
            );


          if (
            !skin ||
            skin.characterId !==
              input.characterId
          ) {
            throw new Error(
              `Spieler ${index + 1} hat einen ungültigen Skin ausgewählt.`,
            );
          }
        }


        return createPlayer({
          id:
            `player-${index + 1}`,

          name:
            input.name,

          characterId:
            input.characterId,

          skinId,
        });
      },
    );
  }
}