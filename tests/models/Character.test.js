import {
  describe,
  expect,
  test,
} from 'vitest';

import {
  createCharacter,
} from '../../src/models/Character.js';

describe(
  'Character',
  () => {
    test(
      'erstellt einen Charakter mit stabiler ID',
      () => {
        const character =
          createCharacter({
            id:
              'test-character',

            name:
              'Test',
          });

        expect(
          character.id,
        ).toBe(
          'test-character',
        );

        expect(
          character.name,
        ).toBe(
          'Test',
        );

        expect(
          character.modifiers,
        ).toEqual([]);
      },
    );
  },
);