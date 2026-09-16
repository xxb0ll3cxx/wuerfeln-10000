export function createCharacter({
  id,
  name,
  portrait = null,
  sprite = null,
  animations = {},
  modifiers = [],
}) {
  if (
    typeof id !== 'string' ||
    id.trim() === ''
  ) {
    throw new Error(
      'Ein Charakter benötigt eine gültige ID.',
    );
  }

  if (
    typeof name !== 'string' ||
    name.trim() === ''
  ) {
    throw new Error(
      'Ein Charakter benötigt einen Namen.',
    );
  }

  if (
    !Array.isArray(modifiers)
  ) {
    throw new TypeError(
      'modifiers muss ein Array sein.',
    );
  }

  return Object.freeze({
    id:
      id.trim(),

    name:
      name.trim(),

    portrait,

    sprite,

    animations:
      Object.freeze({
        idle:
          animations.idle ?? null,

        success:
          animations.success ?? null,

        fail:
          animations.fail ?? null,
      }),

    modifiers:
      Object.freeze([
        ...modifiers,
      ]),
  });
}