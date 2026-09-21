export function createPlayer({
  id,
  name,
  characterId = null,
  skinId = null,
}) {
  if (
    typeof id !== 'string' ||
    id.trim() === ''
  ) {
    throw new Error(
      'Ein Spieler benötigt eine gültige ID.',
    );
  }

  if (
    typeof name !== 'string' ||
    name.trim() === ''
  ) {
    throw new Error(
      'Ein Spieler benötigt einen Namen.',
    );
  }

  if (
    characterId !== null &&
    (
      typeof characterId !==
        'string' ||
      characterId.trim() ===
        ''
    )
  ) {
    throw new Error(
      'characterId muss null oder eine gültige Zeichenkette sein.',
    );
  }
  if (
    skinId !== null &&
    (
      typeof skinId !== 'string' ||
      skinId.trim() === ''
    )
  ) {
    throw new Error(
      'skinId muss null oder eine gültige Zeichenkette sein.',
    );
  }

  return {
    id:
      id.trim(),

    name:
      name.trim(),

    characterId:
      characterId === null
        ? null
        : characterId.trim(),

    skinId:
      skinId === null
        ? null
        : skinId.trim(),

    totalScore:
      0,

    lastBankedScore:
      0,
  };
}