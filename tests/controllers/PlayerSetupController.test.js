import {
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';

import {
  PlayerSetupController,
} from '../../src/controllers/PlayerSetupController.js';


describe(
  'PlayerSetupController',
  () => {
    let controller;


    beforeEach(
      () => {
        controller =
          new PlayerSetupController();
      },
    );


    test(
      'erzeugt Spieler mit initialen Punkteständen',
      () => {
        const players =
          controller.createPlayers([
            {
              name:
                'Anna',

              characterId:
                'character-01',
            },

            {
              name:
                'Ben',

              characterId:
                'character-02',
            },
          ]);


        expect(
          players,
        ).toHaveLength(2);


        expect(
          players[0],
        ).toEqual({
          id:
            'player-1',

          name:
            'Anna',

          characterId:
            'character-01',

          totalScore:
            0,

          lastBankedScore:
            0,
        });


        expect(
          players[1],
        ).toEqual({
          id:
            'player-2',

          name:
            'Ben',

          characterId:
            'character-02',

          totalScore:
            0,

          lastBankedScore:
            0,
        });
      },
    );


    test(
      'erzeugt stabile fortlaufende Spieler-IDs',
      () => {
        const players =
          controller.createPlayers([
            {
              name:
                'Anna',

              characterId:
                'character-01',
            },

            {
              name:
                'Ben',

              characterId:
                'character-02',
            },

            {
              name:
                'Chris',

              characterId:
                'character-03',
            },
          ]);


        expect(
          players.map(
            (player) =>
              player.id,
          ),
        ).toEqual([
          'player-1',
          'player-2',
          'player-3',
        ]);
      },
    );


    test(
      'übernimmt den gewählten Charakter in den Player',
      () => {
        const players =
          controller.createPlayers([
            {
              name:
                'Anna',

              characterId:
                'character-02',
            },
          ]);


        expect(
          players[0]
            .characterId,
        ).toBe(
          'character-02',
        );
      },
    );


    test(
      'lehnt unbekannte Charaktere ab',
      () => {
        expect(
          () =>
            controller
              .createPlayers([
                {
                  name:
                    'Anna',

                  characterId:
                    'gibt-es-nicht',
                },
              ]),
        ).toThrow(
          'Spieler 1 benötigt einen gültigen Charakter.',
        );
      },
    );


    test(
      'lehnt fehlende Charakterauswahl ab',
      () => {
        expect(
          () =>
            controller
              .createPlayers([
                {
                  name:
                    'Anna',
                },
              ]),
        ).toThrow(
          'Spieler 1 benötigt einen gültigen Charakter.',
        );
      },
    );


    test(
      'lehnt leere Spielerliste ab',
      () => {
        expect(
          () =>
            controller
              .createPlayers([]),
        ).toThrow(
          'Mindestens ein Spieler wird benötigt.',
        );
      },
    );


    test(
      'lehnt ungültigen Spielernamen ab',
      () => {
        expect(
          () =>
            controller
              .createPlayers([
                {
                  name:
                    '',

                  characterId:
                    'character-01',
                },
              ]),
        ).toThrow(
          'Ein Spieler benötigt einen Namen.',
        );
      },
    );
  },
);