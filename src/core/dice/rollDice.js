export function rollDie(random = Math.random) {
  return Math.floor(random() * 6) + 1;
}

export function rollDice(count, random = Math.random) {
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error('Die Anzahl der Würfel muss eine positive Ganzzahl sein.');
  }

  return Array.from(
    { length: count },
    () => rollDie(random),
  );
}