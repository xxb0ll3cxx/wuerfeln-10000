export class CharacterSprite {
  constructor(
    scene,
  ) {
    this.scene =
      scene;

    this.sprite =
      null;

    this.currentCharacterId =
      null;

    this.currentIdleConfig =
      null;

    this.idleTimer =
      null;

    this.isIdlePlaying =
      false;
  }


  /*
   * =======================================================
   * CHARACTER ANZEIGEN
   * =======================================================
   */

  showCharacter(
    character,
    {
      x,
      y,
      scale = 1,
    },
  ) {
    const idleConfig =
      character
        ?.sprite
        ?.idle;


    if (
      !idleConfig ||
      !Array.isArray(
        idleConfig.frames,
      ) ||
      idleConfig.frames.length ===
        0
    ) {
      this.clear();

      return;
    }


    /*
     * Derselbe Charakter wird bereits angezeigt.
     *
     * Wichtig:
     * Nicht bei jedem Screen-Render den Timer
     * erneut starten.
     */
    if (
      this.currentCharacterId ===
        character.id &&
      this.sprite
    ) {
      return;
    }


    this.clear();


    this.currentCharacterId =
      character.id;

    this.currentIdleConfig =
      idleConfig;


    this.#ensureIdleAnimation(
      idleConfig,
    );


    const firstFrame =
      idleConfig.frames[0];


    /*
     * Frame 1 ist unser neutraler,
     * statischer Zustand.
     */
    this.sprite =
      this.scene.add.sprite(
        x,
        y,
        firstFrame.key,
      );


    /*
     * bottom-center:
     * x = horizontale Mitte
     * y = Unterkante der Figur
     */
    this.sprite.setOrigin(
      0.5,
      1,
    );


    this.sprite.setScale(
      scale,
    );


    /*
     * NICHT sofort permanent animieren.
     *
     * Erst nach 30–60 Sekunden.
     */
    this.#scheduleNextIdle();
  }


  /*
   * =======================================================
   * IDLE ANIMATION REGISTRIEREN
   * =======================================================
   */

  #ensureIdleAnimation(
    idleConfig,
  ) {
    if (
      this.scene.anims.exists(
        idleConfig.animationKey,
      )
    ) {
      return;
    }


    const animationFrames =
      idleConfig.frames.map(
        (frame) => ({
          key:
            frame.key,
        }),
      );


    this.scene.anims.create({
      key:
        idleConfig.animationKey,

      frames:
        animationFrames,

      frameRate:
        idleConfig.frameRate,

      /*
       * Ganz wichtig:
       *
       * Genau einmal durchlaufen.
       */
      repeat:
        0,
    });
  }


  /*
   * =======================================================
   * NÄCHSTEN IDLE PLANEN
   * =======================================================
   */

  #scheduleNextIdle() {
    this.#clearIdleTimer();


    if (
      !this.sprite ||
      !this.currentIdleConfig
    ) {
      return;
    }


    const minDelay =
      this.currentIdleConfig
        .minDelayMs ??
      30_000;


    const maxDelay =
      this.currentIdleConfig
        .maxDelayMs ??
      60_000;


    const delay =
      this.#randomBetween(
        minDelay,
        maxDelay,
      );


    this.idleTimer =
      this.scene.time.delayedCall(
        delay,

        () => {
          this.idleTimer =
            null;

          this.#playIdle();
        },
      );
  }


  /*
   * =======================================================
   * IDLE ABSPIELEN
   * =======================================================
   */

  #playIdle() {
    if (
      !this.sprite ||
      !this.currentIdleConfig ||
      this.isIdlePlaying
    ) {
      return;
    }


    const idleConfig =
      this.currentIdleConfig;


    this.isIdlePlaying =
      true;


    /*
     * Wenn die Animation beendet ist:
     *
     * 1. statischen Frame wiederherstellen
     * 2. neuen Zufallstimer starten
     */
    this.sprite.once(
      'animationcomplete',

      () => {
        if (
          !this.sprite ||
          !this.currentIdleConfig
        ) {
          return;
        }


        this.isIdlePlaying =
          false;


        const neutralFrame =
          this.currentIdleConfig
            .frames[0];


        this.sprite.stop();


        this.sprite.setTexture(
          neutralFrame.key,
        );


        this.#scheduleNextIdle();
      },
    );


    this.sprite.play(
      idleConfig.animationKey,
    );
  }


  /*
   * =======================================================
   * ZUFALLSZEIT
   * =======================================================
   */

  #randomBetween(
    min,
    max,
  ) {
    return Math.floor(
      Math.random() *
        (
          max -
          min +
          1
        ),
    ) +
      min;
  }


  /*
   * =======================================================
   * TIMER ENTFERNEN
   * =======================================================
   */

  #clearIdleTimer() {
    if (
      !this.idleTimer
    ) {
      return;
    }


    this.idleTimer.remove(
      false,
    );


    this.idleTimer =
      null;
  }


  /*
   * =======================================================
   * CLEANUP
   * =======================================================
   */

  clear() {
    this.#clearIdleTimer();


    this.isIdlePlaying =
      false;


    if (
      this.sprite
    ) {
      this.sprite.stop();

      this.sprite.destroy();

      this.sprite =
        null;
    }


    this.currentCharacterId =
      null;

    this.currentIdleConfig =
      null;
  }


  destroy() {
    this.clear();
  }
}