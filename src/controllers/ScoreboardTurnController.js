export class ScoreboardTurnController {
  constructor(
    gameSessionController,
  ) {
    this.gameSessionController =
      gameSessionController;
  }

  bankScore(
    rawScore,
  ) {
    const score =
      this.#parseScore(
        rawScore,
      );

    return this.gameSessionController
      .bankScoreboardTurn(
        score,
      );
  }

  loseTurn() {
    return this.gameSessionController
      .finishScoreboardLostTurn({
        isFirstRollBust:
          false,
      });
  }

  loseTurnOnFirstRoll() {
    return this.gameSessionController
      .finishScoreboardLostTurn({
        isFirstRollBust:
          true,
      });
  }

  finishInstantWin() {
    return this.gameSessionController
      .finishScoreboardInstantWin();
  }

  #parseScore(
    rawScore,
  ) {
    /*
     * Input-Elemente liefern Strings.
     */
    const normalized =
      typeof rawScore ===
        'string'
        ? rawScore.trim()
        : rawScore;

    if (
      normalized === ''
    ) {
      throw new Error(
        'Bitte einen Score eingeben.',
      );
    }

    const score =
      Number(normalized);

    if (
      !Number.isInteger(score) ||
      score <= 0
    ) {
      throw new Error(
        'Der Score muss eine positive ganze Zahl sein.',
      );
    }

    return score;
  }
}
