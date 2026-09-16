import {
  describe,
  expect,
  test,
} from 'vitest';

import {
  GameStore,
} from '../../src/state/GameStore.js';

import {
  createInitialState,
} from '../../src/state/createInitialState.js';

import {
  GameSessionController,
} from '../../src/controllers/GameSessionController.js';

import {
  ScoreboardTurnController,
} from '../../src/controllers/ScoreboardTurnController.js';

import {
  createPlayer,
} from '../../src/models/Player.js';

function createTestGame() {
  const store =
    new GameStore(
      createInitialState(),
    );

  const gameSessionController =
    new GameSessionController(
      store,
    );

  const scoreboardTurnController =
    new ScoreboardTurnController(
      gameSessionController,
    );

  gameSessionController.startGame({
    mode:
      'scoreboard',

    players: [
      createPlayer({
        id:
          'player-1',

        name:
          'Anna',
      }),

      createPlayer({
        id:
          'player-2',

        name:
          'Ben',
      }),
    ],
  });

  return {
    store,
    gameSessionController,
    scoreboardTurnController,
  };
}

describe(
  'ScoreboardTurnController',
  () => {
    test(
      'sichert einen eingegebenen Score und wechselt den Spieler',
      () => {
        const {
          scoreboardTurnController,
        } =
          createTestGame();

        const result =
          scoreboardTurnController
            .bankScore(
              '850',
            );

        expect(
          result.bankedScore,
        ).toBe(850);

        expect(
          result.bankedPlayer
            .totalScore,
        ).toBe(850);

        expect(
          result.bankedPlayer
            .lastBankedScore,
        ).toBe(850);

        expect(
          result.nextPlayer.name,
        ).toBe('Ben');
      },
    );

    test(
      'Scoreboard erzwingt nicht die virtuelle 350-Punkte-Regel',
      () => {
        const {
          scoreboardTurnController,
        } =
          createTestGame();

        const result =
          scoreboardTurnController
            .bankScore(
              '200',
            );

        expect(
          result.bankedScore,
        ).toBe(200);

        expect(
          result.bankedPlayer
            .totalScore,
        ).toBe(200);
      },
    );

    test(
      'normaler verlorener Zug löscht den letzten gesicherten Wert nicht',
      () => {
        const {
          store,
          scoreboardTurnController,
        } =
          createTestGame();

        store.setState(
          (state) => ({
            ...state,

            players:
              state.players.map(
                (
                  player,
                  index,
                ) =>
                  index === 0
                    ? {
                        ...player,

                        totalScore:
                          1200,

                        lastBankedScore:
                          450,
                      }
                    : player,
              ),
          }),
        );

        const result =
          scoreboardTurnController
            .loseTurn();

        expect(
          result.penaltyApplied,
        ).toBe(0);

        expect(
          result.lostPlayer
            .totalScore,
        ).toBe(1200);

        expect(
          result.lostPlayer
            .lastBankedScore,
        ).toBe(450);

        expect(
          result.nextPlayer.name,
        ).toBe('Ben');
      },
    );

    test(
      'Erstwurf 0 zieht den letzten gesicherten Wert ab und löscht ihn',
      () => {
        const {
          store,
          scoreboardTurnController,
        } =
          createTestGame();

        store.setState(
          (state) => ({
            ...state,

            players:
              state.players.map(
                (
                  player,
                  index,
                ) =>
                  index === 0
                    ? {
                        ...player,

                        totalScore:
                          2000,

                        lastBankedScore:
                          750,
                      }
                    : player,
              ),
          }),
        );

        const result =
          scoreboardTurnController
            .loseTurnOnFirstRoll();

        expect(
          result.penaltyApplied,
        ).toBe(750);

        expect(
          result.lostPlayer
            .totalScore,
        ).toBe(1250);

        expect(
          result.lostPlayer
            .lastBankedScore,
        ).toBe(0);

        expect(
          result.nextPlayer.name,
        ).toBe('Ben');
      },
    );

    test(
      'Erstwurf 0 ohne vorherigen gesicherten Wert zieht nichts ab',
      () => {
        const {
          scoreboardTurnController,
        } =
          createTestGame();

        const result =
          scoreboardTurnController
            .loseTurnOnFirstRoll();

        expect(
          result.penaltyApplied,
        ).toBe(0);

        expect(
          result.lostPlayer
            .totalScore,
        ).toBe(0);

        expect(
          result.lostPlayer
            .lastBankedScore,
        ).toBe(0);
      },
    );

    test(
      'sechs 1en beenden auch im Scoreboard-Modus sofort die Partie',
      () => {
        const {
          scoreboardTurnController,
        } =
          createTestGame();

        const result =
          scoreboardTurnController
            .finishInstantWin();

        expect(
          result.matchFinished,
        ).toBe(true);

        expect(
          result.winner.name,
        ).toBe('Anna');

        expect(
          result.winner
            .totalScore,
        ).toBe(10000);

        expect(
          result.endgame
            .pendingPlayerIds,
        ).toEqual([]);

        expect(
          result.endgame
            .winReason,
        ).toBe('six-ones');
      },
    );

    test(
      'leere Score-Eingabe wird abgelehnt',
      () => {
        const {
          scoreboardTurnController,
        } =
          createTestGame();

        expect(
          () =>
            scoreboardTurnController
              .bankScore(''),
        ).toThrow(
          'Bitte einen Score eingeben.',
        );
      },
    );
  },
);