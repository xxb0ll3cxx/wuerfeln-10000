export const TURN_PHASES = Object.freeze({
  READY_TO_ROLL: 'ready-to-roll',
  SELECTING: 'selecting',
  BUSTED: 'busted',
  FINISHED: 'finished',
});

export function assertCanRoll(turnState) {
  if (
    turnState.phase !==
    TURN_PHASES.READY_TO_ROLL
  ) {
    throw new Error(
      `Würfeln ist in der Zugphase "${turnState.phase}" nicht erlaubt.`,
    );
  }
}

export function assertCanSelect(turnState) {
  if (
    turnState.phase !==
    TURN_PHASES.SELECTING
  ) {
    throw new Error(
      `Würfelauswahl ist in der Zugphase "${turnState.phase}" nicht erlaubt.`,
    );
  }
}