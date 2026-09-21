export class ActiveCharacterView {
  constructor(
    rootElement,
    audioService = null,
  ) {
    if (
      !(
        rootElement instanceof
        HTMLElement
      )
    ) {
      throw new TypeError(
        'ActiveCharacterView benötigt ein gültiges Root-Element.',
      );
    }
    this.audioService =
      audioService;

    this.rootElement =
      rootElement;


    this.imageElement =
      document.createElement(
        'img',
      );


    this.imageElement.className =
      'active-character-sprite';


    this.imageElement.alt =
      '';

    this.imageElement
      .setAttribute(
        'aria-hidden',
        'true',
      );


    this.imageElement.draggable =
      false;


    this.rootElement
      .replaceChildren(
        this.imageElement,
      );


    this.currentCharacter =
      null;


    this.idleTimer =
      null;


    this.frameTimer =
      null;


    this.isAnimating =
      false;


    /*
     * Mit jeder gestarteten oder abgebrochenen Animation
     * ändert sich diese Nummer.
     *
     * Dadurch kann ein alter Timeout niemals später noch
     * Frames einer bereits abgebrochenen Animation setzen.
     */
    this.animationGeneration =
      0;


    this.pendingAnimationResolve =
      null;
  }


  /*
   * =======================================================
   * CHARAKTER ANZEIGEN
   * =======================================================
   */

  showCharacter(
    character,
  ) {
    if (
      !character?.sprite
        ?.neutralFrame
    ) {
      this.clear();

      return;
    }


    /*
     * Derselbe Charakter ist bereits aktiv.
     * Nicht neu initialisieren, sonst würde bei jedem Render
     * der Idle-Timer zurückgesetzt.
     */
    if (
      this.currentCharacter?.id ===
        character.id &&

      (
        this.currentCharacter?.skinId ??
        null
      ) === (
        character.skinId ??
        null
      )
    ) {
      return;
    }


    this.#clearTimers();


    this.currentCharacter =
      character;


    this.#preloadCharacterFrames(
      character,
    );


    this.#showNeutralFrame();


    this.#scheduleIdle();
  }


  /*
   * =======================================================
   * EVENT-ANIMATION
   * =======================================================
   *
   * Beispiel:
   *
   * await activeCharacterView.playAnimation('success');
   *
   * Eine laufende oder wartende Idle-Animation wird sofort
   * unterbrochen.
   */

  playAnimation(
    animationName,
  ) {
    const animation =
      this.currentCharacter
        ?.animations
        ?.[animationName];


    if (
      !animation ||
      !Array.isArray(
        animation.frames,
      ) ||
      animation.frames.length ===
        0
    ) {
      return Promise.resolve(
        false,
      );
    }


    /*
     * Wartenden Idle stoppen.
     */
    this.#clearIdleTimer();


    /*
     * Falls Idle gerade läuft:
     * sofort abbrechen.
     */
    this.#cancelFrameAnimation();


    return this.#playFrames(
      animation,
    );
  }


  /*
   * =======================================================
   * RANDOM IDLE
   * =======================================================
   */

  #scheduleIdle() {
    this.#clearIdleTimer();


    const idle =
      this.currentCharacter
        ?.animations
        ?.idle;


    if (
      !idle ||
      !Array.isArray(
        idle.frames,
      ) ||
      idle.frames.length ===
        0
    ) {
      return;
    }


    const minDelay =
      idle.minDelayMs ??
      30_000;


    const maxDelay =
      idle.maxDelayMs ??
      60_000;


    const safeMaxDelay =
      Math.max(
        minDelay,
        maxDelay,
      );


    const delay =
      Math.floor(
        Math.random() *
          (
            safeMaxDelay -
            minDelay +
            1
          ),
      ) +
      minDelay;


    this.idleTimer =
      window.setTimeout(
        () => {
          this.idleTimer =
            null;


          void this.#playFrames(
            idle,
          );
        },

        delay,
      );
  }


  /*
   * =======================================================
   * FRAMES ABSPIELEN
   * =======================================================
   */

  #playFrames(
    animation,
  ) {
    if (
      animation.sfx
    ) {
      this.audioService
        ?.playSfx(
          animation.sfx,
        );
    }
    const frames =
      animation.frames;


    const frameDuration =
      Math.max(
        1,
        animation.frameDurationMs ??
          150,
      );


    /*
     * Eigene Kennung für genau diesen Animationslauf.
     */
    const generation =
      ++this.animationGeneration;


    this.isAnimating =
      true;


    let frameIndex =
      0;


    return new Promise(
      (resolve) => {
        this.pendingAnimationResolve =
          resolve;


        const finish =
          (
            completed,
          ) => {
            /*
             * Nur der aktuell gültige Lauf darf den
             * sichtbaren Zustand abschließen.
             */
            if (
              generation !==
              this.animationGeneration
            ) {
              return;
            }


            this.frameTimer =
              null;


            this.isAnimating =
              false;


            this.pendingAnimationResolve =
              null;


            if (
              completed
            ) {
              this.#showNeutralFrame();


              /*
               * Nach jeder abgeschlossenen Reaktion
               * wieder einen neuen Idle-Timer planen.
               */
              this.#scheduleIdle();
            }


            resolve(
              completed,
            );
          };


        const showNextFrame =
          () => {
            if (
              generation !==
              this.animationGeneration
            ) {
              return;
            }


            if (
              !this.currentCharacter
            ) {
              finish(
                false,
              );

              return;
            }


            if (
              frameIndex >=
              frames.length
            ) {
              finish(
                true,
              );

              return;
            }


            this.imageElement.src =
              frames[
                frameIndex
              ];


            frameIndex +=
              1;


            this.frameTimer =
              window.setTimeout(
                showNextFrame,
                frameDuration,
              );
          };


        showNextFrame();
      },
    );
  }


  /*
   * =======================================================
   * NEUTRAL FRAME
   * =======================================================
   */

  #showNeutralFrame() {
    const neutralFrame =
      this.currentCharacter
        ?.sprite
        ?.neutralFrame;


    if (!neutralFrame) {
      return;
    }


    this.imageElement.src =
      neutralFrame;
  }


  /*
   * =======================================================
   * PRELOAD
   * =======================================================
   */

  #preloadCharacterFrames(
    character,
  ) {
    const animations =
      character.animations ??
      {};


    for (
      const animation
      of Object.values(
        animations,
      )
    ) {
      if (
        !animation ||
        !Array.isArray(
          animation.frames,
        )
      ) {
        continue;
      }


      for (
        const frame
        of animation.frames
      ) {
        const image =
          new Image();


        image.src =
          frame;
      }
    }
  }


  /*
   * =======================================================
   * TIMER / CANCEL
   * =======================================================
   */

  #clearIdleTimer() {
    if (
      this.idleTimer !==
      null
    ) {
      window.clearTimeout(
        this.idleTimer,
      );


      this.idleTimer =
        null;
    }
  }


  #cancelFrameAnimation() {
    if (
      this.frameTimer !==
      null
    ) {
      window.clearTimeout(
        this.frameTimer,
      );


      this.frameTimer =
        null;
    }


    /*
     * Alten Animationslauf ungültig machen.
     */
    this.animationGeneration +=
      1;


    this.isAnimating =
      false;


    /*
     * Ein auf die alte Animation wartendes await
     * darf niemals hängen bleiben.
     */
    if (
      this.pendingAnimationResolve
    ) {
      const resolve =
        this.pendingAnimationResolve;


      this.pendingAnimationResolve =
        null;


      resolve(
        false,
      );
    }
  }


  #clearTimers() {
    this.#clearIdleTimer();

    this.#cancelFrameAnimation();
  }


  /*
   * =======================================================
   * CLEANUP
   * =======================================================
   */

  clear() {
    this.#clearTimers();


    this.currentCharacter =
      null;


    this.imageElement
      .removeAttribute(
        'src',
      );
  }


  destroy() {
    this.#clearTimers();


    this.currentCharacter =
      null;


    this.rootElement
      .replaceChildren();
  }
}