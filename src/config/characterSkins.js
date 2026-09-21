/*
 * =========================================================
 * CHARACTER SKINS
 * =========================================================
 */


const niemandRichPortrait =
  new URL(
    '../assets/characters/niemand/skins/rich/Niemand_Rich_portrait.png',
    import.meta.url,
  ).href;

const niemandRichIdle01 =
  new URL(
    '../assets/characters/niemand/skins/rich/idle/Niemand_Rich_idle1.png',
    import.meta.url,
  ).href;

const niemandRichIdle02 =
new URL(
'../assets/characters/niemand/skins/rich/idle/Niemand_Rich_idle2.png',
import.meta.url,
).href;

const niemandRichIdle03 =
new URL(
'../assets/characters/niemand/skins/rich/idle/Niemand_Rich_idle3.png',
import.meta.url,
).href;

const niemandRichIdle04 =
new URL(
'../assets/characters/niemand/skins/rich/idle/Niemand_Rich_idle4.png',
import.meta.url,
).href;

const niemandRichIdle05 =
new URL(
'../assets/characters/niemand/skins/rich/idle/Niemand_Rich_idle5.png',
import.meta.url,
).href;

const niemandRichIdle06 =
new URL(
'../assets/characters/niemand/skins/rich/idle/Niemand_Rich_idle6.png',
import.meta.url,
).href;


export const CHARACTER_SKINS =
  Object.freeze({

    niemand_rich:
      Object.freeze({

        id:
          'niemand_rich',

        characterId:
          'test-character',

        name:
          'Niemand Rich',

        portrait:
          niemandRichPortrait,

        sprite:
          Object.freeze({
            neutralFrame:
              niemandRichIdle01,
          }),

        animations:
          Object.freeze({

            idle:
              Object.freeze({

                frames:
                  Object.freeze([
                    niemandRichIdle02,
                    niemandRichIdle03,
                    niemandRichIdle04,
                    niemandRichIdle05,
                    niemandRichIdle06,
                  ]),

                frameDurationMs:
                  150,

                minDelayMs:
                  150,

                maxDelayMs:
                  150,

              }),

          }),

      }),

  });


/*
 * Alle verfügbaren Skins eines Charakters.
 */

export function getCharacterSkins(
  characterId,
) {
  return Object.values(
    CHARACTER_SKINS,
  ).filter(
    (skin) =>
      skin.characterId ===
      characterId,
  );
}


/*
 * Einen konkreten Skin ermitteln.
 */

export function getCharacterSkinById(
  skinId,
) {
  if (
    typeof skinId !==
    'string'
  ) {
    return null;
  }

  return (
    CHARACTER_SKINS[
      skinId
    ] ??
    null
  );
}