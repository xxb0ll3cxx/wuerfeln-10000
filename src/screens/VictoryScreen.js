import {
  SCREENS,
} from '../app/screens.js';

export class VictoryScreen {
  constructor({
    navigate,
    gameSessionController,
    audioService
  }) {
    this.navigate =
      navigate;
      
    this.audioService =
     audioService;

    this.gameSessionController =
      gameSessionController;
  }

  mount(rootElement) {
    const state =
      this.gameSessionController
        .getState();

    const {
      endgame,
      players,
    } = state;

    const winner =
      endgame.winnerId
        ? players.find(
            (player) =>
              player.id ===
              endgame.winnerId,
          )
        : null;

    const tiedPlayers =
      endgame.tiedPlayerIds
        .map(
          (playerId) =>
            players.find(
              (player) =>
                player.id ===
                playerId,
            ),
        )
        .filter(Boolean);

    rootElement.innerHTML = `
      <main class="screen screen--centered victory-screen">
        <section class="victory-card">

          <h1
            data-victory-title
          ></h1>

          <p
            data-victory-score
            class="victory-card__score"
          ></p>

          <p
            data-victory-reason
          ></p>

          <div class="victory-card__actions">
            <button
              type="button"
              class="game-button game-button--primary"
              data-action="again"
            >
              ERNEUT SPIELEN
            </button>

            <button
              type="button"
              class="game-button game-button--secondary"
              data-action="main-menu"
            >
              HAUPTMENÜ
            </button>
          </div>
        </section>
      </main>
    `;

    this.titleElement =
      rootElement.querySelector(
        '[data-victory-title]',
      );

    this.scoreElement =
      rootElement.querySelector(
        '[data-victory-score]',
      );

    this.reasonElement =
      rootElement.querySelector(
        '[data-victory-reason]',
      );

    this.againButton =
      rootElement.querySelector(
        '[data-action="again"]',
      );

    this.mainMenuButton =
      rootElement.querySelector(
        '[data-action="main-menu"]',
      );

    this.audioService
    .stopMusic();


    this.audioService
      .playSfx(
        'victory',
    );
    if (winner) {
      this.titleElement.textContent =
        `${winner.name} gewinnt!`;

      this.scoreElement.textContent =
        `${winner.totalScore.toLocaleString('de-DE')} Punkte`;

      this.reasonElement.textContent =
        endgame.winReason ===
        'six-ones'
          ? 'Sechs 1en – Sofortsieg!'
          : 'Höchster Gesamtpunktestand nach der Nachziehrunde.';
    } else if (
      tiedPlayers.length > 1
    ) {
      const highestScore =
        Math.max(
          ...tiedPlayers.map(
            (player) =>
              player.totalScore,
          ),
        );

      this.titleElement.textContent =
        'Unentschieden';

      this.scoreElement.textContent =
        `${highestScore.toLocaleString('de-DE')} Punkte`;

      this.reasonElement.textContent =
        `${tiedPlayers
          .map(
            (player) =>
              player.name,
          )
          .join(', ')} teilen sich den höchsten Punktestand. ` +
        'Für Gleichstand ist aktuell keine weitere Spielregel definiert.';
    } else {
      this.titleElement.textContent =
        'Spiel beendet';

      this.scoreElement.textContent =
        '';

      this.reasonElement.textContent =
        'Es konnte kein eindeutiger Gewinner bestimmt werden.';
    }

    this.handleAgain =
      () => {
        this.navigate(
          SCREENS.PLAYER_SETUP,
          {
            mode:
              state.mode ??
              'virtual',
          },
        );
      };

    this.handleMainMenu =
      () => {
        this.navigate(
          SCREENS.MAIN_MENU,
        );
      };

    this.againButton.addEventListener(
      'click',
      this.handleAgain,
    );

    this.mainMenuButton.addEventListener(
      'click',
      this.handleMainMenu,
    );
  }

  destroy() {
    this.againButton
      ?.removeEventListener(
        'click',
        this.handleAgain,
      );

    this.mainMenuButton
      ?.removeEventListener(
        'click',
        this.handleMainMenu,
      );
  }
}