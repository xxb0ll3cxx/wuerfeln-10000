export const MULTIPLAYER_MODES =
  Object.freeze({
    normal:
      Object.freeze({
        id:
          'normal',

        name:
          'Normal',

        usesWager:
          false,

        targetScore:
          Object.freeze({
            min:
              5000,

            max:
              20000,

            step:
              500,

            default:
              10000,
          }),
      }),


    coinBattle:
      Object.freeze({
        id:
          'coinBattle',

        name:
          'Coin Battle',

        usesWager:
          true,

        targetScore:
          Object.freeze({
            min:
              5000,

            max:
              20000,

            step:
              500,

            default:
              5000,
          }),

        wager:
          Object.freeze({
            min:
              100,

            max:
              10000,

            step:
              100,

            default:
              1000,
          }),
      }),
  });


export function getMultiplayerMode(
  modeId,
) {
  return (
    MULTIPLAYER_MODES[
      modeId
    ] ??
    null
  );
}


export function isValidRangeValue(
  value,
  range,
) {
  if (
    !Number.isInteger(
      value,
    )
  ) {
    return false;
  }


  if (
    value < range.min ||
    value > range.max
  ) {
    return false;
  }


  return (
    (
      value -
      range.min
    ) %
    range.step ===
    0
  );
}