import {
  getCharacterById,
} from './characters.js';

import {
  getCharacterSkinById,
} from './characterSkins.js';


/*
 * =========================================================
 * CHARACTER APPEARANCE RESOLVER
 * =========================================================
 */

export function resolveCharacterAppearance(
  characterId,
  skinId = null,
) {
  /*
   * Basischarakter ermitteln.
   */

  const character =
    getCharacterById(
      characterId,
    );


  if (!character) {
    return null;
  }


  /*
   * Kein Skin ausgewählt:
   * bestehenden Standardcharakter verwenden.
   */

  if (!skinId) {
    return character;
  }


  /*
   * Skin ermitteln.
   */

  const skin =
    getCharacterSkinById(
      skinId,
    );


  /*
   * Ungültiger Skin oder Skin gehört
   * zu einem anderen Charakter:
   * Standarddarstellung verwenden.
   */

  if (
    !skin ||
    skin.characterId !==
      character.id
  ) {
    return character;
  }


  /*
   * Basischarakter mit Skin-Daten kombinieren.
   *
   * Nicht überschriebene Animationen und Assets
   * bleiben vom Standardcharakter erhalten.
   */

  return {
    ...character,

    skinId:
      skin.id,

    portrait:
      skin.portrait ??
      character.portrait,

    sprite: {
      ...(
        character.sprite ??
        {}
      ),

      ...(
        skin.sprite ??
        {}
      ),
    },

    animations: {
      ...(
        character.animations ??
        {}
      ),

      ...(
        skin.animations ??
        {}
      ),
    },
  };
}