export function createPlayer({
  id,
  name,
  characterId = null,
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

  return {
    id:
      id.trim(),

    name:
      name.trim(),

    characterId:
      characterId === null
        ? null
        : characterId.trim(),

    totalScore:
      0,

    lastBankedScore:
      0,
  };
}