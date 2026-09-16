/*
 * =========================================================
 * AUDIO ASSETS
 * =========================================================
 */


/*
 * =========================================================
 * UI SOUNDS
 * =========================================================
 */

const buttonClick =
  new URL(
    '../assets/audio/click_sound.mp3',
    import.meta.url,
  ).href;

const jippi_zecke =
  new URL(
    '../assets/audio/Jippii.mp3',
    import.meta.url,
  ).href;

/*
 * =========================================================
 * GAME SFX
 * =========================================================
 */

const diceRoll =
  new URL(
    '../assets/audio/spin_sound.mp3',
    import.meta.url,
  ).href;


const bankScore =
  new URL(
    '../assets/audio/clock_sound.mp3',
    import.meta.url,
  ).href;


const victory =
  new URL(
    '../assets/audio/win_sound.mp3',
    import.meta.url,
  ).href;


/*
 * =========================================================
 * MUSIC
 * =========================================================
 */

const menuMusic =
  new URL(
    '../assets/audio/background_menue_music.mp3',
    import.meta.url,
  ).href;


const gameMusic =
  new URL(
    '../assets/audio/background_music.mp3',
    import.meta.url,
  ).href;


/*
 * =========================================================
 * AUDIO CONFIG
 * =========================================================
 */

export const AUDIO_CONFIG =
  Object.freeze({
    sfx: {
      buttonClick: {
        src:
          buttonClick,

        volume:
          0.5,
      },

      jippi_zecke: {
        src:
          jippi_zecke,
        volume:
          0.0,
      },

      diceRoll: {
        src:
          diceRoll,

        volume:
          0.8,
      },


      bankScore: {
        src:
          bankScore,

        volume:
          0.8,
      },


      victory: {
        src:
          victory,

        volume:
          1,
      },
    },


    music: {
      menuMusic: {
        src:
          menuMusic,

        volume:
          0.35,

        loop:
          true,
      },


      gameMusic: {
        src:
          gameMusic,

        volume:
          0.25,

        loop:
          true,
      },
    },
  });