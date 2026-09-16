export function determineWinner(
  players,
) {
  if (
    !Array.isArray(players) ||
    players.length === 0
  ) {
    throw new Error(
      'Für die Gewinnerermittlung wird mindestens ein Spieler benötigt.',
    );
  }

  const highestScore =
    Math.max(
      ...players.map(
        (player) =>
          player.totalScore,
      ),
    );

  const leaders =
    players.filter(
      (player) =>
        player.totalScore ===
        highestScore,
    );

  /*
   * Die Spielregeln definieren keinen
   * Tiebreaker bei identischen Höchstständen.
   *
   * Deshalb entscheiden wir hier bewusst
   * NICHT willkürlich nach Spielerreihenfolge.
   */
  if (
    leaders.length > 1
  ) {
    return {
      winner:
        null,

      isTie:
        true,

      tiedPlayers:
        leaders,

      highestScore,
    };
  }

  return {
    winner:
      leaders[0],

    isTie:
      false,

    tiedPlayers: [],

    highestScore,
  };
}