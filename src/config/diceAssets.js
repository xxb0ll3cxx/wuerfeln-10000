const diceOne =
  new URL(
    '../assets/dice/diceAssetOne.png',
    import.meta.url,
  ).href;

const diceTwo =
  new URL(
    '../assets/dice/diceAssettwo.png',
    import.meta.url,
  ).href;

const diceThree =
  new URL(
    '../assets/dice/diceAssetthree.png',
    import.meta.url,
  ).href;

const diceFour =
  new URL(
    '../assets/dice/diceAssetfour.png',
    import.meta.url,
  ).href;

const diceFive =
  new URL(
    '../assets/dice/diceAssetfive.png',
    import.meta.url,
  ).href;

const diceSix =
  new URL(
    '../assets/dice/diceAssetsix.png',
    import.meta.url,
  ).href;


export const DICE_ASSETS =
  Object.freeze({
    1: {
      key:
        'dice-one',

      url:
        diceOne,
    },

    2: {
      key:
        'dice-two',

      url:
        diceTwo,
    },

    3: {
      key:
        'dice-three',

      url:
        diceThree,
    },

    4: {
      key:
        'dice-four',

      url:
        diceFour,
    },

    5: {
      key:
        'dice-five',

      url:
        diceFive,
    },

    6: {
      key:
        'dice-six',

      url:
        diceSix,
    },
  });


export function getDiceAsset(
  value,
) {
  return (
    DICE_ASSETS[value] ??
    null
  );
}

export function getDiceTextureKey(
  value,
) {
  return (
    DICE_ASSETS[value]?.key ??
    null
  );
}