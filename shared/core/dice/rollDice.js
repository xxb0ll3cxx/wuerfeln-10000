export function rollDice(
  count,
  rollFace,
) {
  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > 6
  ) {
    throw new RangeError(
      'Die Würfelanzahl muss zwischen 1 und 6 liegen.',
    );
  }


  if (
    typeof rollFace !==
    'function'
  ) {
    throw new TypeError(
      'rollDice benötigt eine Funktion zum Erzeugen einer Würfelseite.',
    );
  }


  const values =
    [];


  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const value =
      Number(
        rollFace(),
      );


    /*
     * Auch die Zufallsquelle wird validiert.
     * Dadurch kann kein ungültiger Dice-State
     * ins Match gelangen.
     */
    if (
      !Number.isInteger(value) ||
      value < 1 ||
      value > 6
    ) {
      throw new RangeError(
        'Die Zufallsquelle hat eine ungültige Würfelseite erzeugt.',
      );
    }


    values.push(
      value,
    );
  }


  return values;
}