import {
  getDiceTextureKey,
} from '../../config/diceAssets.js';


const DICE_WIDTH =
  80;

const DICE_HEIGHT =
  80;


const SELECTED_BORDER_COLOR =
  0xf4b942;


export class DiceView {
  constructor(
    scene,
    x,
    y,
  ) {
    this.scene =
      scene;


    this.selectionHandler =
      null;


    this.isSelectable =
      false;


    /*
     * =====================================================
     * CONTAINER
     * =====================================================
     */

    this.container =
      scene.add.container(
        x,
        y,
      );


    /*
     * =====================================================
     * DICE IMAGE
     * =====================================================
     *
     * Es wird zunächst Asset 1 erzeugt,
     * anschließend aber ausgeblendet.
     *
     * setValue() setzt später die richtige Texture.
     */

    this.diceImage =
      scene.add.image(
        0,
        0,
        'dice-one',
      );


    this.diceImage
      .setDisplaySize(
        DICE_WIDTH,
        DICE_HEIGHT,
      );


    this.diceImage
      .setOrigin(
        0.5,
      );


    this.diceImage
      .setVisible(
        false,
      );


    /*
     * =====================================================
     * INPUT / SELECTION FRAME
     * =====================================================
     *
     * Dieses Rechteck ist unsichtbar.
     *
     * Es existiert nur noch für:
     *
     * - Klickfläche
     * - Auswahlmarkierung
     *
     * Es zeichnet KEINEN weißen Würfel mehr.
     */

    this.selectionFrame =
      scene.add.rectangle(
        0,
        0,
        DICE_WIDTH,
        DICE_HEIGHT,
        0x000000,
        0,
      );


    /*
     * Standardmäßig unsichtbarer Rahmen.
     */
    this.selectionFrame
      .setStrokeStyle(
        6,
        SELECTED_BORDER_COLOR,
        0,
      );


    this.selectionFrame
      .setInteractive({
        useHandCursor:
          true,
      });


    /*
     * Reihenfolge wichtig:
     *
     * Würfelbild unten
     * Auswahlrahmen darüber
     */
    this.container.add([
      this.diceImage,
      this.selectionFrame,
    ]);


    /*
     * =====================================================
     * POINTER
     * =====================================================
     */

    this.handlePointerDown =
      () => {
        if (
          !this.isSelectable
        ) {
          return;
        }


        this.selectionHandler?.();
      };


    this.selectionFrame
      .on(
        'pointerdown',
        this.handlePointerDown,
      );


    this.setSelectable(
      false,
    );
  }


  /*
   * =======================================================
   * VALUE
   * =======================================================
   *
   * 1 -> dice-one
   * 2 -> dice-two
   * ...
   * 6 -> dice-six
   */

  setValue(
    value,
  ) {
    const textureKey =
      getDiceTextureKey(
        value,
      );


    if (!textureKey) {
      throw new RangeError(
        `Ungültiger Würfelwert: ${value}`,
      );
    }


    this.diceImage
      .setTexture(
        textureKey,
      );


    this.diceImage
      .setDisplaySize(
        DICE_WIDTH,
        DICE_HEIGHT,
      );


    this.diceImage
      .setVisible(
        true,
      );
  }


  /*
   * =======================================================
   * CLEAR
   * =======================================================
   *
   * Früher wurde hier "-" angezeigt.
   *
   * Jetzt wird der Würfel einfach ausgeblendet.
   */

  clearValue() {
    this.diceImage
      .setVisible(
        false,
      );


    this.setSelected(
      false,
    );
  }


  /*
   * =======================================================
   * SELECTION HANDLER
   * =======================================================
   */

  setSelectionHandler(
    handler,
  ) {
    this.selectionHandler =
      handler;
  }


  /*
   * =======================================================
   * SELECTABLE
   * =======================================================
   */

  setSelectable(
    isSelectable,
  ) {
    this.isSelectable =
      isSelectable;


    if (
      this.selectionFrame.input
    ) {
      this.selectionFrame
        .input
        .enabled =
        isSelectable;
    }
  }


  /*
   * =======================================================
   * SELECTED
   * =======================================================
   */

  setSelected(
    isSelected,
  ) {
    this.selectionFrame
      .setStrokeStyle(
        6,
        SELECTED_BORDER_COLOR,
        isSelected
          ? 1
          : 0,
      );
  }


  /*
   * =======================================================
   * VISIBLE
   * =======================================================
   */

  setVisible(
    isVisible,
  ) {
    this.container
      .setVisible(
        isVisible,
      );


    if (!isVisible) {
      this.setSelectable(
        false,
      );
    }
  }


  /*
   * =======================================================
   * DESTROY
   * =======================================================
   */

  destroy() {
    this.selectionFrame
      .off(
        'pointerdown',
        this.handlePointerDown,
      );


    this.selectionHandler =
      null;


    this.container
      .destroy(
        true,
      );
  }
}