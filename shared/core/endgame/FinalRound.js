export function createFinalRound({
  players,
  triggerPlayerIndex,
}) {
  validatePlayers(
    players,
  );

  if (
    !Number.isInteger(
      triggerPlayerIndex,
    ) ||
    triggerPlayerIndex < 0 ||
    triggerPlayerIndex >=
      players.length
  ) {
    throw new RangeError(
      `Ungültiger triggerPlayerIndex: ${triggerPlayerIndex}`,
    );
  }

  const triggerPlayer =
    players[
      triggerPlayerIndex
    ];

  const pendingPlayerIds =
    [];

  /*
   * Jeder andere Spieler erhält exakt
   * einen letzten Zug.
   *
   * Wir beginnen beim nächsten Spieler
   * und laufen zyklisch durch die Liste,
   * bis wir wieder vor dem Trigger stehen.
   */
  for (
    let offset = 1;
    offset < players.length;
    offset += 1
  ) {
    const index =
      (
        triggerPlayerIndex +
        offset
      ) %
      players.length;

    pendingPlayerIds.push(
      players[index].id,
    );
  }

  return {
    triggerPlayerId:
      triggerPlayer.id,

    pendingPlayerIds,
  };
}

export function completeFinalRoundTurn({
  pendingPlayerIds,
  completedPlayerId,
}) {
  if (
    !Array.isArray(
      pendingPlayerIds,
    )
  ) {
    throw new TypeError(
      'pendingPlayerIds muss ein Array sein.',
    );
  }

  if (
    pendingPlayerIds.length ===
    0
  ) {
    throw new Error(
      'Die Nachziehrunde besitzt keinen offenen Spielerzug.',
    );
  }

  /*
   * Durch diese Prüfung fällt sofort auf,
   * falls der GameSessionController die
   * Nachziehrunde in falscher Reihenfolge
   * ausführt.
   */
  if (
    pendingPlayerIds[0] !==
    completedPlayerId
  ) {
    throw new Error(
      `Spieler "${completedPlayerId}" ist nicht als Nächstes in der Nachziehrunde vorgesehen.`,
    );
  }

  return pendingPlayerIds.slice(
    1,
  );
}

export function getPlayerIndexById(
  players,
  playerId,
) {
  const index =
    players.findIndex(
      (player) =>
        player.id ===
        playerId,
    );

  if (index === -1) {
    throw new Error(
      `Spieler "${playerId}" wurde nicht gefunden.`,
    );
  }

  return index;
}

function validatePlayers(
  players,
) {
  if (
    !Array.isArray(players) ||
    players.length === 0
  ) {
    throw new Error(
      'Mindestens ein Spieler wird benötigt.',
    );
  }

  for (const player of players) {
    if (
      !player ||
      typeof player.id !==
        'string'
    ) {
      throw new Error(
        'Jeder Spieler benötigt eine gültige ID.',
      );
    }
  }
}