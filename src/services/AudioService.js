import {
  AUDIO_CONFIG,
} from '../config/audioConfig.js';


export class AudioService {
  constructor() {
    /*
     * =====================================================
     * GLOBAL STATE
     * =====================================================
     */

    this.muted =
      false;


    this.musicVolume =
      1;


    this.sfxVolume =
      1;


    /*
     * Aktuell laufende Hintergrundmusik.
     */
    this.currentMusic =
      null;


    this.currentMusicKey =
      null;


    /*
     * Wiederverwendbare Soundeffekte.
     */
    this.sfxPlayers =
      new Map();
    /*
    * Soundeffekte frühzeitig laden,
    * statt erst beim ersten Klick/Wurf.
    */
    for (
      const [
        soundKey,
        config,
      ] of Object.entries(
        AUDIO_CONFIG.sfx,
      )
    ) {
      const audio =
        new Audio(
          config.src,
        );

      audio.preload =
        'auto';

      audio.load();

      this.sfxPlayers.set(
        soundKey,
        audio,
      );
    }

    /*
     * Browser erlauben Audio normalerweise erst nach
     * einer Benutzerinteraktion.
     */
    this.unlocked =
      false;


    /*
     * Falls Musik vor dem ersten Klick angefordert wurde,
     * merken wir uns den gewünschten Track.
     */
    this.pendingMusicKey =
      null;
  }


  /*
   * =======================================================
   * AUDIO UNLOCK
   * =======================================================
   */

  unlock() {
    if (
      this.unlocked
    ) {
      return;
    }


    this.unlocked =
      true;


    if (
      this.pendingMusicKey
    ) {
      const musicKey =
        this.pendingMusicKey;


      this.pendingMusicKey =
        null;


      void this.playMusic(
        musicKey,
      );
    }
  }


  /*
   * =======================================================
   * SOUND EFFECTS
   * =======================================================
   */

  playSfx(
    soundKey,
    {
      restart = true,
      loop = false,
    } = {},
  ) {
    if (
      this.muted ||
      !this.unlocked
    ) {
      return null;
    }


    const config =
      AUDIO_CONFIG
        .sfx
        ?.[soundKey];


    if (!config) {
      console.warn(
        `Unbekannter SFX-Key: ${soundKey}`,
      );


      return null;
    }


    let audio =
      this.sfxPlayers.get(
        soundKey,
      );


    if (!audio) {
      audio =
        new Audio(
          config.src,
        );


      audio.preload =
        'auto';


      this.sfxPlayers.set(
        soundKey,
        audio,
      );
    }
    /*
    * Einen noch nicht abspielbereiten Sound
    * nicht für eine verspätete Wiedergabe einreihen.
    */
    if (
      audio.readyState < 2
    ) {
      return null;
    }

    audio.loop =
      loop;


    audio.volume =
      this.#calculateVolume(
        config.volume,
        this.sfxVolume,
      );


    if (
      restart
    ) {
      audio.currentTime =
        0;
    }


    const playPromise =
      audio.play();


    if (
      playPromise
    ) {
      playPromise.catch(
        (error) => {
          console.debug(
            'SFX konnte nicht abgespielt werden:',
            soundKey,
            error,
          );
        },
      );
    }


    return audio;
  }


  /*
   * =======================================================
   * SFX STOPPEN
   * =======================================================
   */

  stopSfx(
    soundKey,
  ) {
    const audio =
      this.sfxPlayers.get(
        soundKey,
      );


    if (!audio) {
      return;
    }


    audio.pause();


    audio.currentTime =
      0;
  }


  /*
   * =======================================================
   * MUSIC
   * =======================================================
   */

async playMusic(
  musicKey,
) {
  const config =
    AUDIO_CONFIG
      .music
      ?.[musicKey];


  if (!config) {
    console.warn(
      `Unbekannter Music-Key: ${musicKey}`,
    );

    return;
  }


  /*
   * Browser noch nicht freigeschaltet.
   */
  if (
    !this.unlocked
  ) {
    this.pendingMusicKey =
      musicKey;

    return;
  }


  /*
   * Derselbe Track läuft bereits.
   *
   * Nicht neu starten.
   */
  if (
    this.currentMusicKey ===
      musicKey &&
    this.currentMusic
  ) {
    if (
      this.currentMusic.paused &&
      !this.muted
    ) {
      try {
        await this.currentMusic
          .play();

      } catch {
        // Browserblockade ignorieren.
      }
    }


    return;
  }


  /*
   * Alten Track komplett beenden.
   */
  this.stopMusic();


  const audio =
    this.#createMusicAudio(
      config,
    );


  this.currentMusic =
    audio;


  this.currentMusicKey =
    musicKey;


  if (
    this.muted
  ) {
    return;
  }


  try {
    await audio.play();

  } catch (error) {
    console.debug(
      'Musik konnte noch nicht gestartet werden:',
      musicKey,
      error,
    );
  }
}
#startMusicLoopWatcher(
  musicKey,
) {
  this.#clearMusicLoopTimer();


  this.musicLoopTimer =
    window.setInterval(
      () => {
        const audio =
          this.currentMusic;


        if (
          !audio ||
          this.currentMusicKey !==
            musicKey
        ) {
          return;
        }


        if (
          !Number.isFinite(
            audio.duration,
          ) ||
          audio.duration <=
            0
        ) {
          return;
        }


        const config =
          AUDIO_CONFIG
            .music
            ?.[musicKey];


        if (!config) {
          return;
        }


        const crossfadeMs =
          config.crossfadeMs ??
          1200;


        const crossfadeSeconds =
          crossfadeMs /
          1000;


        const remainingTime =
          audio.duration -
          audio.currentTime;


        /*
         * Noch nicht am Ende angekommen.
         */
        if (
          remainingTime >
          crossfadeSeconds
        ) {
          return;
        }


        /*
         * Crossfade läuft bereits.
         */
        if (
          this.nextMusic
        ) {
          return;
        }


        void this.#crossfadeMusicLoop(
          musicKey,
        );
      },

      100,
    );
}
async #crossfadeMusicLoop(
  musicKey,
) {
  const currentAudio =
    this.currentMusic;


  const config =
    AUDIO_CONFIG
      .music
      ?.[musicKey];


  if (
    !currentAudio ||
    !config
  ) {
    return;
  }


  const nextAudio =
    this.#createMusicAudio(
      config,
    );


  /*
   * Neuer Track startet lautlos.
   */
  nextAudio.volume =
    0;


  this.nextMusic =
    nextAudio;


  try {
    await nextAudio.play();

  } catch (error) {
    console.debug(
      'Crossfade-Track konnte nicht gestartet werden:',
      error,
    );


    this.nextMusic =
      null;


    return;
  }


  const crossfadeMs =
    config.crossfadeMs ??
    1200;


  const targetVolume =
    this.#calculateVolume(
      config.volume,
      this.musicVolume,
    );


  const startTime =
    performance.now();


  const fade =
    (
      now,
    ) => {
      /*
       * Inzwischen Screen/Musik gewechselt.
       */
      if (
        this.currentMusic !==
          currentAudio ||
        this.nextMusic !==
          nextAudio
      ) {
        return;
      }


      const progress =
        Math.min(
          1,

          (
            now -
            startTime
          ) /
          crossfadeMs,
        );


      /*
       * Alter Track:
       * 100 % → 0 %
       */
      currentAudio.volume =
        targetVolume *
        (
          1 -
          progress
        );


      /*
       * Neuer Track:
       * 0 % → 100 %
       */
      nextAudio.volume =
        targetVolume *
        progress;


      if (
        progress <
        1
      ) {
        this.musicFadeFrame =
          window.requestAnimationFrame(
            fade,
          );


        return;
      }


      /*
       * Alter Track fertig.
       */
      currentAudio.pause();


      currentAudio.currentTime =
        0;


      /*
       * Neuer Track wird ab jetzt
       * der aktuelle Track.
       */
      this.currentMusic =
        nextAudio;


      this.nextMusic =
        null;


      this.musicFadeFrame =
        null;
    };


  this.musicFadeFrame =
    window.requestAnimationFrame(
      fade,
    );
}

#createMusicAudio(
  config,
) {
  const audio =
    new Audio(
      config.src,
    );


  audio.preload =
    'auto';



  audio.loop =
    true;


  audio.volume =
    this.#calculateVolume(
      config.volume,
      this.musicVolume,
    );


  return audio;
}


  /*
   * =======================================================
   * MUSIC STOPPEN
   * =======================================================
   */

  stopMusic() {
    if (
      !this.currentMusic
    ) {
      return;
    }


    this.currentMusic.pause();


    this.currentMusic.currentTime =
      0;


    this.currentMusic =
      null;


    this.currentMusicKey =
      null;
  }


  /*
   * =======================================================
   * MUTE
   * =======================================================
   */

  setMuted(
    muted,
  ) {
    this.muted =
      Boolean(
        muted,
      );


    if (
      this.currentMusic
    ) {
      if (
        this.muted
      ) {
        this.currentMusic
          .pause();

      } else {
        void this.currentMusic
          .play()
          .catch(
            () => {},
          );
      }
    }


    for (
      const audio
      of this.sfxPlayers
        .values()
    ) {
      audio.muted =
        this.muted;
    }
  }


  toggleMuted() {
    this.setMuted(
      !this.muted,
    );


    return this.muted;
  }

  #clearMusicLoopTimer() {
  if (
    this.musicLoopTimer !==
    null
  ) {
    window.clearInterval(
      this.musicLoopTimer,
    );


    this.musicLoopTimer =
      null;
  }
}

  /*
   * =======================================================
   * MUSIC VOLUME
   * =======================================================
   */

  setMusicVolume(
    volume,
  ) {
    this.musicVolume =
      this.#clampVolume(
        volume,
      );


    if (
      this.currentMusic &&
      this.currentMusicKey
    ) {
      const config =
        AUDIO_CONFIG
          .music[
            this.currentMusicKey
          ];


      this.currentMusic.volume =
        this.#calculateVolume(
          config.volume,
          this.musicVolume,
        );
    }
  }


  /*
   * =======================================================
   * SFX VOLUME
   * =======================================================
   */

  setSfxVolume(
    volume,
  ) {
    this.sfxVolume =
      this.#clampVolume(
        volume,
      );


    for (
      const [
        soundKey,
        audio,
      ]
      of this.sfxPlayers
    ) {
      const config =
        AUDIO_CONFIG
          .sfx[
            soundKey
          ];


      if (!config) {
        continue;
      }


      audio.volume =
        this.#calculateVolume(
          config.volume,
          this.sfxVolume,
        );
    }
  }


  /*
   * =======================================================
   * HELPERS
   * =======================================================
   */

  #calculateVolume(
    assetVolume,
    channelVolume,
  ) {
    return this.#clampVolume(
      (
        assetVolume ??
        1
      ) *
      channelVolume,
    );
  }


  #clampVolume(
    value,
  ) {
    return Math.min(
      1,
      Math.max(
        0,
        Number(value) ||
        0,
      ),
    );
  }


  /*
   * =======================================================
   * CLEANUP
   * =======================================================
   */

  destroy() {
    this.stopMusic();


    for (
      const audio
      of this.sfxPlayers
        .values()
    ) {
      audio.pause();


      audio.currentTime =
        0;
    }


    this.sfxPlayers
      .clear();
  }
}