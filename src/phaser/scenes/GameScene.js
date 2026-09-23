import Phaser from 'phaser';

import {
  DiceView,
} from '../views/DiceView.js';

import {
  DiceRollAnimator,
} from '../animations/DiceRollAnimator.js';

import {
  DICE_ASSETS,
} from '../../config/diceAssets.js';

import {
  DICE_SKINS,
  getDiceSkinById,
} from '../../config/diceSkins.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({
      key:
        'GameScene',
    });
    this.diceSkinId = null;

    this.diceViews =
      [];


    this.diceRollAnimator =
      null;


    this.diceSelectionHandler =
      null;


    this.diceSelectionEnabled =
      false;


    this.activeDiceCount =
      6;
  }

preload() {
  // Standardwürfel laden.
  for (const asset of Object.values(DICE_ASSETS)) {
    this.load.image(
      asset.key,
      asset.url,
    );
  }

  // Texturen aller konfigurierten Würfelskins laden.
  for (const skin of Object.values(DICE_SKINS)) {
    for (const face of Object.values(skin.faces)) {
      this.load.image(
        face.key,
        face.url,
      );
    }
  }
}
  /*
   * =======================================================
   * CREATE
   * =======================================================
   */

  create() {
    this.#createDice();


    this.diceRollAnimator =
      new DiceRollAnimator(
        this,
        this.diceViews,
      );
  }

  /*
   * =======================================================
   * DICE CREATION
   * =======================================================
   */

  #createDice() {
    const startX =
      117;


    const spacing =
      106;


    const y =
      140;


    for (
      let index = 0;
      index < 6;
      index += 1
    ) {
      const x =
        startX +
        index *
          spacing;


      const diceView =
        new DiceView(
          this,
          x,
          y,
        );
    diceView.setSkinId(this.diceSkinId);

      /*
       * Jeder Würfel kennt seinen festen Index.
       *
       * Beim Anklicken wird dieser Index
       * an den VirtualGameScreen weitergegeben.
       */
      diceView
        .setSelectionHandler(
          () => {
            this.diceSelectionHandler?.(
              index,
            );
          },
        );


      this.diceViews.push(
        diceView,
      );
    }


    this.setActiveDiceCount(
      this.activeDiceCount,
    );
  }


  /*
   * =======================================================
   * ROLL
   * =======================================================
   */

  async showRoll(
    results,
  ) {
    if (
      !this.diceRollAnimator
    ) {
      return;
    }


    /*
     * Nur so viele Würfel anzeigen,
     * wie aktuell tatsächlich gewürfelt wurden.
     */
    this.setActiveDiceCount(
      results.length,
    );


    /*
     * Alte Auswahlmarkierungen entfernen.
     */
    this.setSelectedDiceIndices(
      [],
    );


    /*
     * Das Würfelergebnis steht bereits fest.
     * Die Animation visualisiert es nur.
     */
    await this.diceRollAnimator
      .play(
        results,
      );
  }


  /*
   * =======================================================
   * NEXT ROLL
   * =======================================================
   */

  prepareForNextRoll(
    activeDiceCount,
  ) {
    /*
     * Vor dem nächsten Wurf:
     *
     * - Auswahl deaktivieren
     * - Markierungen löschen
     * - Anzahl aktiver Würfel setzen
     * - sichtbare Würfel leeren
     */

    this.setDiceSelectionEnabled(
      false,
    );


    this.setSelectedDiceIndices(
      [],
    );


    this.setActiveDiceCount(
      activeDiceCount,
    );


    this.diceViews.forEach(
      (
        diceView,
        index,
      ) => {
        if (
          index <
          activeDiceCount
        ) {
          diceView.clearValue();
        }
      },
    );
  }


  /*
   * =======================================================
   * ACTIVE DICE
   * =======================================================
   */

  setActiveDiceCount(
    activeDiceCount,
  ) {
    this.activeDiceCount =
      activeDiceCount;


    this.diceViews.forEach(
      (
        diceView,
        index,
      ) => {
        const isActive =
          index <
          activeDiceCount;


        /*
         * Nicht mehr verfügbare Würfel
         * werden vollständig ausgeblendet.
         */
        diceView.setVisible(
          isActive,
        );


        /*
         * Ein Würfel ist nur anklickbar,
         * wenn:
         *
         * 1. er aktiv ist
         * 2. die Auswahlphase aktiviert wurde
         */
        diceView.setSelectable(
          isActive &&
          this.diceSelectionEnabled,
        );
      },
    );
  }


  /*
   * =======================================================
   * SELECTION HANDLER
   * =======================================================
   */

  setDiceSelectionHandler(
    handler,
  ) {
    this.diceSelectionHandler =
      handler;
  }


  /*
   * =======================================================
   * SELECTION ENABLE / DISABLE
   * =======================================================
   */

  setDiceSelectionEnabled(
    isEnabled,
  ) {
    this.diceSelectionEnabled =
      isEnabled;


    this.diceViews.forEach(
      (
        diceView,
        index,
      ) => {
        diceView.setSelectable(
          isEnabled &&
          index <
            this.activeDiceCount,
        );
      },
    );
  }


  /*
   * =======================================================
   * SELECTED DICE
   * =======================================================
   */

  setSelectedDiceIndices(
    selectedIndices,
  ) {
    const selectedSet =
      new Set(
        selectedIndices,
      );


    this.diceViews.forEach(
      (
        diceView,
        index,
      ) => {
        diceView.setSelected(
          selectedSet.has(
            index,
          ),
        );
      },
    );
  }


  /*
   * =======================================================
   * CLEANUP
   * =======================================================
   */

  shutdown() {
    this.diceRollAnimator
      ?.destroy();


    this.diceSelectionHandler =
      null;


    this.diceRollAnimator =
      null;
  }
  setDiceSkinId(skinId) {
  const skin = getDiceSkinById(skinId);

  this.diceSkinId = skin?.id ?? null;

  for (const diceView of this.diceViews) {
    diceView.setSkinId(this.diceSkinId);
  }
}
}