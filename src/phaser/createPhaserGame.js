import Phaser from 'phaser';

import {
  createPhaserConfig,
} from './phaserConfig.js';

import {
  GameScene,
} from './scenes/GameScene.js';


export function createPhaserGame(
  parent,
) {
  const parentElement =
    typeof parent ===
    'string'
      ? document.getElementById(
          parent,
        )
      : parent;


  if (
    !(
      parentElement instanceof
      HTMLElement
    )
  ) {
    throw new Error(
      'Der Phaser-Container wurde nicht gefunden.',
    );
  }


  const gameScene =
    new GameScene();


  const config =
    createPhaserConfig({
      parent:
        parentElement,

      gameScene,
    });


  const game =
    new Phaser.Game(
      config,
    );


  return {
    game,
    gameScene,
  };
}