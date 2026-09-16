import {
  describe,
  expect,
  test,
} from 'vitest';

import {
  GameSessionController,
} from '../../src/controllers/GameSessionController.js';

import {
  GameStore,
} from '../../src/state/GameStore.js';

import {
  createInitialState,
} from '../../src/state/createInitialState.js';

import {
  createPlayer,
} from '../../src/models/Player.js';

import {
  TURN_PHASES,
} from '../../src/core/turn/TurnRules.js';

function createTestSession() {
  const store =
    new GameStore(
      createInitialState(),
    );

  const controller =
    new GameSessionController(
      store,
    );

  controller.startGame({
    mode: 'virtual',

    players: [
      createPlayer({
        id: 'player-1',
        name: 'Anna',
      }),

      createPlayer({
        id: 'player-2',
        name: 'Ben',
      }),
    ],
  });

  return {
    store,
    controller,
  };
}

describe(
  'GameSessionController',
  () => {
    test(
      'startet mit dem ersten Spieler',
      () => {
        const {
          controller,
        } =
          createTestSession();

        expect(
          controller
            .getCurrentPlayer()
            .name,
        ).toBe('Anna');
      },
    );

    test(
      'sichert Zugpunkte und wechselt zum nächsten Spieler',
      () => {
        const {
          store,
          controller,
        } =
          createTestSession();

        store.setState(
          (state) => ({
            ...state,

            turn: {
              ...state.turn,

              phase:
                TURN_PHASES.READY_TO_ROLL,

              turnScore:
                450,
            },
          }),
        );

        const result =
          controller
            .bankCurrentTurn();

        expect(
          result.bankedPlayer
            .totalScore,
        ).toBe(450);

        expect(
          result.bankedPlayer
            .lastBankedScore,
        ).toBe(450);

        expect(
          result.nextPlayer.name,
        ).toBe('Ben');

        expect(
          result.turnState
            .turnScore,
        ).toBe(0);
      },
    );

    test(
      'erster-Wurf-Bust zieht den zuletzt gesicherten Wert ab',
      () => {
        const {
          store,
          controller,
        } =
          createTestSession();

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

            turn: {
              ...state.turn,

              phase:
                TURN_PHASES.BUSTED,

              rollNumber:
                1,

              turnScore:
                0,
            },
          }),
        );

        const result =
          controller
            .finishBustedTurn({
              isFirstRollBust:
                true,
            });

        expect(
          result.penaltyApplied,
        ).toBe(450);

        expect(
          result.bustedPlayer
            .totalScore,
        ).toBe(750);

        expect(
          result.bustedPlayer
            .lastBankedScore,
        ).toBe(0);

        expect(
          result.nextPlayer.name,
        ).toBe('Ben');
      },
    );

    test(
      'normaler Bust verändert gesicherte Gesamtpunkte nicht',
      () => {
        const {
          store,
          controller,
        } =
          createTestSession();

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

            turn: {
              ...state.turn,

              phase:
                TURN_PHASES.BUSTED,

              rollNumber:
                2,

              turnScore:
                0,
            },
          }),
        );

        const result =
          controller
            .finishBustedTurn({
              isFirstRollBust:
                false,
            });

        expect(
          result.penaltyApplied,
        ).toBe(0);

        expect(
          result.bustedPlayer
            .totalScore,
        ).toBe(1200);

        expect(
          result.bustedPlayer
            .lastBankedScore,
        ).toBe(450);
      },
    );

    test(
      'nach dem letzten Spieler beginnt wieder der erste',
      () => {
        const {
          store,
          controller,
        } =
          createTestSession();

        store.setState(
          (state) => ({
            ...state,

            currentPlayerIndex:
              1,

            turn: {
              ...state.turn,

              phase:
                TURN_PHASES.READY_TO_ROLL,

              turnScore:
                350,
            },
          }),
        );

        const result =
          controller
            .bankCurrentTurn();

        expect(
          result.nextPlayer.name,
        ).toBe('Anna');

        expect(
          result.currentPlayerIndex,
        ).toBe(0);
      },
    );
  },
);

test(
  '10000 Punkte starten die Nachziehrunde und der Trigger-Spieler zieht nicht erneut',
  () => {
    const {
      store,
      controller,
    } =
      createTestSession();

    /*
     * Für diesen Test ergänzen wir einen dritten Spieler.
     */
    const state =
      store.getState();

    store.setState({
      ...state,

      players: [
        {
          ...state.players[0],

          totalScore: 9700,
        },
        state.players[1],
        {
          id: 'player-3',
          name: 'Chris',
          characterId: null,
          totalScore: 0,
          lastBankedScore: 0,
        },
      ],

      currentPlayerIndex: 0,

      turn: {
        ...state.turn,

        phase:
          TURN_PHASES.READY_TO_ROLL,

        turnScore: 350,
      },
    });

    const result =
      controller
        .bankCurrentTurn();

    expect(
      result.bankedPlayer
        .totalScore,
    ).toBe(10050);

    expect(
      result.finalRoundStarted,
    ).toBe(true);

    expect(
      result.nextPlayer.name,
    ).toBe('Ben');

    expect(
      result.endgame
        .pendingPlayerIds,
    ).toEqual([
      'player-2',
      'player-3',
    ]);

    expect(
      result.endgame
        .pendingPlayerIds,
    ).not.toContain(
      'player-1',
    );
  },
);

test(
  'nach allen Nachziehzügen gewinnt der höchste Gesamtpunktestand',
  () => {
    const {
      store,
      controller,
    } =
      createTestSession();

    const state =
      store.getState();

    store.setState({
      ...state,

      players: [
        {
          ...state.players[0],

          totalScore: 9700,
        },
        {
          ...state.players[1],

          totalScore: 9000,
        },
        {
          id: 'player-3',
          name: 'Chris',
          characterId: null,
          totalScore: 9800,
          lastBankedScore: 0,
        },
      ],

      currentPlayerIndex:
        0,

      turn: {
        ...state.turn,

        phase:
          TURN_PHASES.READY_TO_ROLL,

        turnScore:
          350,
      },
    });

    /*
     * Anna:
     * 9700 + 350 = 10050
     *
     * Nachziehrunde beginnt.
     */
    const annaResult =
      controller
        .bankCurrentTurn();

    expect(
      annaResult.finalRoundStarted,
    ).toBe(true);

    /*
     * Ben:
     * 9000 + 350 = 9350
     */
    store.setState(
      (currentState) => ({
        ...currentState,

        turn: {
          ...currentState.turn,

          phase:
            TURN_PHASES
              .READY_TO_ROLL,

          turnScore:
            350,
        },
      }),
    );

    const benResult =
      controller
        .bankCurrentTurn();

    expect(
      benResult.matchFinished,
    ).toBe(false);

    expect(
      benResult.nextPlayer.name,
    ).toBe('Chris');

    /*
     * Chris:
     * 9800 + 500 = 10300
     *
     * Er überholt Anna in seinem letzten Zug.
     */
    store.setState(
      (currentState) => ({
        ...currentState,

        turn: {
          ...currentState.turn,

          phase:
            TURN_PHASES
              .READY_TO_ROLL,

          turnScore:
            500,
        },
      }),
    );

    const chrisResult =
      controller
        .bankCurrentTurn();

    expect(
      chrisResult.matchFinished,
    ).toBe(true);

    expect(
      chrisResult.winner.name,
    ).toBe('Chris');

    expect(
      chrisResult.winner
        .totalScore,
    ).toBe(10300);
  },
);

test(
  'sechs 1en beenden die Partie sofort ohne Nachziehrunde',
  () => {
    const {
      store,
      controller,
    } =
      createTestSession();

    store.setState(
      (state) => ({
        ...state,

        currentPlayerIndex:
          0,

        turn: {
          ...state.turn,

          phase:
            TURN_PHASES.FINISHED,

          turnScore:
            10000,

          isInstantWin:
            true,
        },
      }),
    );

    const result =
      controller
        .finishInstantWin({
          instantWinScore:
            10000,
        });

    expect(
      result.matchFinished,
    ).toBe(true);

    expect(
      result.winner.name,
    ).toBe('Anna');

    expect(
      result.endgame.phase,
    ).toBe('finished');

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