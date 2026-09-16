import {
  describe,
  expect,
  test,
} from 'vitest';

import {
  createInitialEndgameState,
  ENDGAME_PHASES,
  hasReachedTargetScore,
} from '../../src/core/endgame/EndgameRules.js';

describe(
  'EndgameRules',
  () => {
    test(
      '9999 Punkte starten das Endgame noch nicht',
      () => {
        expect(
          hasReachedTargetScore({
            totalScore: 9999,
          }),
        ).toBe(false);
      },
    );

    test(
      '10000 Punkte erreichen das Endgame-Ziel',
      () => {
        expect(
          hasReachedTargetScore({
            totalScore: 10000,
          }),
        ).toBe(true);
      },
    );

    test(
      'mehr als 10000 Punkte erreichen ebenfalls das Ziel',
      () => {
        expect(
          hasReachedTargetScore({
            totalScore: 12450,
          }),
        ).toBe(true);
      },
    );

    test(
      'initial ist die Partie im normalen Spielbetrieb',
      () => {
        const state =
          createInitialEndgameState();

        expect(
          state.phase,
        ).toBe(
          ENDGAME_PHASES.ACTIVE,
        );

        expect(
          state.pendingPlayerIds,
        ).toEqual([]);
      },
    );
  },
);