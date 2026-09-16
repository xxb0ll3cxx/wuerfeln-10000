import Phaser from 'phaser';


export const PHASER_GAME_WIDTH =
  760;

export const PHASER_GAME_HEIGHT =
  300;


export function createPhaserConfig({
  parent,
  gameScene,
}) {
  if (!parent) {
    throw new Error(
      'Phaser benötigt ein Parent-Element.',
    );
  }

  if (!gameScene) {
    throw new Error(
      'Phaser benötigt eine GameScene.',
    );
  }


  return {
    type:
      Phaser.AUTO,

    parent,

    width:
      PHASER_GAME_WIDTH,

    height:
      PHASER_GAME_HEIGHT,

    transparent: true,

    render: {
      antialias:
        true,

      pixelArt:
        false,

      roundPixels:
        false,
    },

    /*
     * Kein FIT / RESIZE.
     *
     * Die komplette App wird bereits
     * durch AppViewport skaliert.
     */
    scene: [
      gameScene,
    ],
  };
}